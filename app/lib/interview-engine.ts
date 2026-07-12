export type Level = "junior" | "mid" | "architect";
export type Topic =
  | "requirements"
  | "capacity"
  | "api"
  | "data"
  | "architecture"
  | "scale"
  | "reliability";

export type ScenarioId = "ticketing" | "shortener" | "social" | "delivery";

export type Scenario = {
  id: ScenarioId;
  name: string;
  shortName: string;
  brief: string;
  accent: string;
  scaleAnswer: string;
  functionalAnswer: string;
};

export const scenarios: Scenario[] = [
  {
    id: "ticketing",
    name: "Design a global ticket marketplace",
    shortName: "Ticket marketplace",
    brief: "Fans discover events, reserve scarce seats, and purchase tickets during extreme onsale spikes.",
    accent: "High contention",
    scaleAnswer: "We serve 35 million monthly users. A major onsale can bring 1.2 million users in ten minutes, with roughly 80,000 seat-hold attempts per second at peak.",
    functionalAnswer: "The core flow is event discovery, seat-map viewing, a five-minute seat hold, checkout, payment, and digital ticket delivery. Preventing double-sells is non-negotiable.",
  },
  {
    id: "shortener",
    name: "Design a planet-scale URL shortener",
    shortName: "URL shortener",
    brief: "Create short links, redirect globally with low latency, and expose useful click analytics.",
    accent: "Read heavy",
    scaleAnswer: "Assume 120 million new links per month and 18 billion redirects per month. Traffic is globally distributed and about 90% of reads should complete below 80 ms.",
    functionalAnswer: "Users create an optional custom alias with an expiry, follow short links, and see aggregate analytics. A link may be disabled for abuse, but edits to its destination are out of scope.",
  },
  {
    id: "social",
    name: "Design a Facebook-style social feed",
    shortName: "Social feed",
    brief: "People publish posts and receive a relevant home feed from friends and followed creators.",
    accent: "Fan-out tradeoffs",
    scaleAnswer: "We have 600 million daily users, 90 million new posts per day, and a read-to-write ratio near 250:1. Celebrity accounts can have more than 50 million followers.",
    functionalAnswer: "Focus on publishing text and media posts, following, home-feed retrieval, basic ranking, and privacy boundaries. Comments, messaging, and ads are out of scope.",
  },
  {
    id: "delivery",
    name: "Design an on-demand food delivery platform",
    shortName: "Food delivery",
    brief: "Customers order from nearby restaurants while couriers receive live assignments and location updates.",
    accent: "Real-time state",
    scaleAnswer: "At dinner peak we see 250,000 active orders, 400,000 couriers sending locations every five seconds, and 45,000 new orders per minute across 40 countries.",
    functionalAnswer: "Customers browse nearby menus, place and track orders; restaurants accept them; couriers are matched and stream location. Menu authoring and payroll are out of scope.",
  },
];

export const topicLabels: Record<Topic, string> = {
  requirements: "Requirements",
  capacity: "Capacity",
  api: "APIs",
  data: "Data model",
  architecture: "Architecture",
  scale: "Scale",
  reliability: "Reliability",
};

const topicMatchers: Record<Topic, RegExp> = {
  requirements: /requirement|feature|scope|user|functional|use case|flow|must support/i,
  capacity: /scale|traffic|qps|rps|dau|mau|volume|throughput|storage|how many|peak/i,
  api: /api|endpoint|request|response|contract|rest|graphql|grpc/i,
  data: /database|schema|table|model|store|sql|nosql|index|partition|shard|consisten/i,
  architecture: /service|component|architecture|queue|event|stream|worker|gateway/i,
  scale: /cache|cdn|replica|shard|partition|hot|bottleneck|load balanc|fan.?out/i,
  reliability: /fail|retry|outage|available|reliab|disaster|recovery|idempoten|timeout|slo/i,
};

export function detectTopics(text: string): Topic[] {
  return (Object.entries(topicMatchers) as [Topic, RegExp][])
    .filter(([, matcher]) => matcher.test(text))
    .map(([topic]) => topic);
}

type ReplyContext = {
  scenario: Scenario;
  level: Level;
  covered: Topic[];
  turn: number;
};

const pushByLevel: Record<Level, string> = {
  junior: "Take a moment and talk me through the next box you would add. What responsibility does it own?",
  mid: "Choose one trade-off explicitly. What gets better, and what are you willing to make worse?",
  architect: "I need a decision, not a menu of technologies. State the invariant, choose an owner for it, and tell me how it behaves during a partial regional failure.",
};

export function createArchitectReply(input: string, context: ReplyContext): { text: string; topics: Topic[] } {
  const topics = detectTopics(input);
  const lower = input.toLowerCase();

  if (/hint|stuck|nudge|help/.test(lower)) {
    const missing = (Object.keys(topicLabels) as Topic[]).find((topic) => !context.covered.includes(topic));
    return {
      topics: missing ? [missing] : [],
      text: missing
        ? `Small nudge: we have not made the ${topicLabels[missing].toLowerCase()} concrete yet. Pick the single decision there that is hardest to reverse, and reason from that.`
        : "You have touched the main dimensions. Pick the most fragile assumption in your design and attack it before I do.",
    };
  }

  if (topics.includes("requirements")) {
    return {
      topics,
      text: `${context.scenario.functionalAnswer}\n\nBefore you design, tell me which two user journeys you are optimizing for and one thing you are deliberately leaving out.`,
    };
  }

  if (topics.includes("capacity")) {
    return {
      topics,
      text: `${context.scenario.scaleAnswer}\n\nDo not calculate every number. Which estimate will actually change your architecture, and what threshold causes that change?`,
    };
  }

  if (topics.includes("data")) {
    return {
      topics,
      text: `That could work, but “use ${/sql/.test(lower) ? "SQL" : /nosql/.test(lower) ? "NoSQL" : "a database"}” is not yet a data design. Name the source of truth, the partition key, and the invariant that must survive concurrent writes. ${pushByLevel[context.level]}`,
    };
  }

  if (topics.includes("api")) {
    return {
      topics,
      text: `Let’s make one boundary real. Sketch the most important write API: request, response, and its idempotency behavior. Then tell me whether the client can safely retry after a timeout.`,
    };
  }

  if (topics.includes("scale")) {
    return {
      topics,
      text: `You are adding scale machinery. Good—now earn the complexity. What becomes the hot key or hot partition, and how do you prevent stale cached state from violating the product’s core invariant?`,
    };
  }

  if (topics.includes("reliability")) {
    return {
      topics,
      text: `Assume one dependency becomes slow rather than cleanly failing. Trace that through your design. Where do deadlines, backpressure, retries, and degraded behavior live? ${pushByLevel[context.level]}`,
    };
  }

  if (topics.includes("architecture")) {
    return {
      topics,
      text: `I can follow the shape. Now narrate the critical path from the client to durable state. At each hop, tell me whether it is synchronous and why it belongs on that path.`,
    };
  }

  const turns = [
    `I hear the direction. Make the product assumption behind it explicit, then show me where that decision appears on the diagram.`,
    `Let me challenge that: what fails first at 10× load, and what signal would tell you before users notice?`,
    `There are several valid designs here. Defend yours against the simplest credible alternative in terms of latency, correctness, and operating cost.`,
  ];

  return { topics, text: `${turns[context.turn % turns.length]} ${pushByLevel[context.level]}` };
}

export function getNudge(covered: Topic[]): string {
  const missing = (Object.keys(topicLabels) as Topic[]).find((topic) => !covered.includes(topic));
  return missing
    ? `Try asking a crisp question about ${topicLabels[missing].toLowerCase()}, then explain how the answer would change your design.`
    : "Pick one arrow on your diagram and explain its contract, failure behavior, and observability signals.";
}
