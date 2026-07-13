import type { BoardSignals } from "../components/DiagramBoard";

export type QualityId = "scalability" | "reliability" | "performance" | "maintainability" | "security";

export type QualityResult = {
  id: QualityId;
  label: string;
  score: number;
  feedback: string;
};

export type ChoiceResult = {
  id: "data-storage" | "communication" | "infrastructure";
  category: string;
  focus: string;
  goal: string;
  evidence: string;
  score: number;
};

export type DesignAssessment = {
  overall: number;
  qualities: QualityResult[];
  choices: ChoiceResult[];
  nextProbe: string;
};

type Rubric = {
  id: QualityId;
  label: string;
  keywords: RegExp;
  feedback: string;
  probe: string;
};

const reasoning = /because|trade.?off|instead|versus|vs\.?|so that|therefore|given|depends|at the cost|simpl/i;

const qualityRubrics: Rubric[] = [
  {
    id: "scalability",
    label: "Scalability",
    keywords: /horizontal|vertical|autoscal|partition|shard|fan.?out|load balanc|hot key|replica|cache|cdn|backpressure/i,
    feedback: "Tie the growth strategy to a workload threshold and identify the first hot key, partition, or fan-out boundary.",
    probe: "At 10× traffic, what saturates first, and which scaling move would you make before adding architectural complexity?",
  },
  {
    id: "reliability",
    label: "Reliability & availability",
    keywords: /availab|reliab|failover|redundan|retry|timeout|circuit break|backup|disaster|multi.?region|quorum|idempoten|degrad/i,
    feedback: "Trace one slow or failed dependency and state the retry, failover, degradation, and recovery behavior.",
    probe: "Assume a dependency becomes slow rather than failing cleanly. How does the system degrade without causing a retry storm?",
  },
  {
    id: "performance",
    label: "Performance & latency",
    keywords: /latency|p50|p95|p99|throughput|qps|rps|batch|index|cache|cdn|stream|compress|prefetch/i,
    feedback: "Name a latency or throughput target, then walk the critical path and show where its budget is spent.",
    probe: "What is the latency budget for the critical path, and which hop is most likely to violate it at peak?",
  },
  {
    id: "maintainability",
    label: "Maintainability & simplicity",
    keywords: /simple|maintain|modular|boundary|ownership|observab|migration|monolith|microservice|operat|rollout|version/i,
    feedback: "Explain why each service boundary earns its operational cost and how the design can evolve safely.",
    probe: "Which component could you remove or combine today, and what concrete threshold would justify splitting it later?",
  },
  {
    id: "security",
    label: "Security",
    keywords: /authn|authz|authentication|authorization|oauth|rbac|encrypt|tls|token|secret|privacy|abuse|rate limit|audit/i,
    feedback: "Mark trust boundaries and cover authentication, authorization, encryption, abuse prevention, and auditability where relevant.",
    probe: "Where is the first trust boundary, and how are identity, authorization, encryption, and abuse controls enforced there?",
  },
];

function countMatches(text: string, matcher: RegExp) {
  const source = matcher.source;
  const flags = matcher.flags.includes("g") ? matcher.flags : `${matcher.flags}g`;
  return new Set(text.match(new RegExp(source, flags))?.map((item) => item.toLowerCase()) ?? []).size;
}

function evidenceList(text: string, options: { label: string; matcher: RegExp }[]) {
  return options.filter((option) => option.matcher.test(text)).map((option) => option.label);
}

export function assessDesign(candidateText: string, signals: BoardSignals): DesignAssessment {
  const labels = signals.labels.join(" ");
  const combined = `${candidateText} ${labels}`.trim();
  const hasReasoning = reasoning.test(candidateText);
  const diagramBase = Math.min(12, signals.shapes * 2) + Math.min(8, signals.connections * 2);

  const qualities = qualityRubrics.map((rubric) => {
    const hits = countMatches(combined, rubric.keywords);
    const score = Math.min(100, 16 + hits * 16 + (hits > 0 && hasReasoning ? 14 : 0) + Math.round(diagramBase / 2));
    return { id: rubric.id, label: rubric.label, score, feedback: rubric.feedback };
  });

  const choiceDefinitions = [
    {
      id: "data-storage" as const,
      category: "Data & storage",
      focus: "SQL vs. NoSQL, sharding, caching layers",
      goal: "Minimize database load while preserving the chosen consistency guarantees.",
      options: [
        { label: "SQL", matcher: /\bsql\b|postgres|mysql|relational/i },
        { label: "NoSQL", matcher: /nosql|dynamo|cassandra|document store|key.?value/i },
        { label: "sharding", matcher: /shard|partition/i },
        { label: "caching", matcher: /cache|redis|memcache/i },
        { label: "consistency", matcher: /consisten|transaction|quorum|lineariz|eventual/i },
      ],
    },
    {
      id: "communication" as const,
      category: "Communication",
      focus: "Synchronous vs. asynchronous, message queues",
      goal: "Keep the critical path clear and prevent traffic bottlenecks.",
      options: [
        { label: "synchronous calls", matcher: /synchronous|\bsync\b|rest|grpc/i },
        { label: "asynchronous work", matcher: /asynchronous|\basync\b|background|worker/i },
        { label: "queues or streams", matcher: /queue|kafka|stream|event bus|pub.?sub/i },
        { label: "backpressure", matcher: /backpressure|buffer|load shed/i },
      ],
    },
    {
      id: "infrastructure" as const,
      category: "Infrastructure",
      focus: "Load balancers, service boundaries, CDNs",
      goal: "Remove single points of failure without creating needless operational complexity.",
      options: [
        { label: "load balancing", matcher: /load balanc|gateway/i },
        { label: "service boundaries", matcher: /microservice|service boundary|monolith/i },
        { label: "CDN or edge", matcher: /cdn|edge/i },
        { label: "redundancy", matcher: /replica|redundan|failover|multi.?region|multi.?az/i },
      ],
    },
  ];

  const choices: ChoiceResult[] = choiceDefinitions.map((definition) => {
    const evidence = evidenceList(combined, definition.options);
    const score = Math.min(100, 18 + evidence.length * 18 + (evidence.length > 0 && hasReasoning ? 12 : 0));
    return {
      id: definition.id,
      category: definition.category,
      focus: definition.focus,
      goal: definition.goal,
      evidence: evidence.length ? evidence.join(", ") : "Not discussed yet",
      score,
    };
  });

  const qualityAverage = qualities.reduce((sum, item) => sum + item.score, 0) / qualities.length;
  const choiceAverage = choices.reduce((sum, item) => sum + item.score, 0) / choices.length;
  const topology = Math.min(100, 20 + diagramBase * 3);
  const overall = Math.round(qualityAverage * 0.65 + choiceAverage * 0.25 + topology * 0.1);
  const weakest = qualities.reduce((current, item) => item.score < current.score ? item : current, qualities[0]);
  const nextProbe = qualityRubrics.find((rubric) => rubric.id === weakest.id)?.probe ?? qualityRubrics[0].probe;

  return { overall, qualities, choices, nextProbe };
}
