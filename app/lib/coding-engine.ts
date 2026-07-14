import type { CodingProblem } from "./neetcode-catalog";

export type CodingMessage = {
  id: number;
  role: "interviewer" | "candidate" | "system";
  text: string;
};

export type CodingNotes = {
  summary: string;
  reference: string[];
  approaches: string[];
  strengths: string[];
  pitfalls: string[];
  challenges: string[];
  inputLog: string[];
};

const bruteForce = /brute|nested loop|check every|all pairs|all combination|exhaustive|o\s*\(\s*n\s*\^?\s*[234]|o\s*\(\s*2\s*\^\s*n/i;
const complexity = /o\s*\([^)]+\)/i;
const edgeCases = /edge|empty|null|none|duplicate|negative|overflow|single|boundary|zero|cycle/i;
const tests = /test|example|dry run|walk through|trace/i;
const stuck = /stuck|hint|help|not sure|confus|don.?t know/i;
const bugs = /bug|incorrect|wrong|fail|off.by.one|timeout|tle|exception|error/i;
const revision = /instead|revise|change|optimi|better|improve|second approach|alternative/i;

const techniqueMatchers: { label: string; matcher: RegExp }[] = [
  { label: "hash set or map", matcher: /hash|map|dictionary|set\b/i },
  { label: "two pointers", matcher: /two pointer|left.*right|slow.*fast|fast.*slow/i },
  { label: "sliding window", matcher: /sliding window|window/i },
  { label: "stack", matcher: /stack|monotonic/i },
  { label: "binary search", matcher: /binary search|midpoint|\bmid\b/i },
  { label: "linked-list pointer manipulation", matcher: /linked list|dummy node|next pointer/i },
  { label: "tree traversal", matcher: /\bdfs\b|\bbfs\b|preorder|inorder|postorder|level order|recursion/i },
  { label: "heap or priority queue", matcher: /heap|priority queue/i },
  { label: "backtracking", matcher: /backtrack|decision tree|choose.*unchoose/i },
  { label: "trie", matcher: /trie|prefix tree/i },
  { label: "graph traversal", matcher: /graph|vertex|edge|topological|union.?find|dijkstra|bellman|prim|kruskal/i },
  { label: "dynamic programming", matcher: /dynamic programming|\bdp\b|memo|tabulation|recurrence/i },
  { label: "greedy", matcher: /greedy|local choice/i },
  { label: "interval sorting", matcher: /interval|sort.*start|sort.*end/i },
  { label: "bit manipulation", matcher: /\bxor\b|bit|mask|shift/i },
];

const reasoningNudges = [
  "Start from the work your current approach repeats. What information would let you avoid doing that work again?",
  "List the properties guaranteed by the input. Which one could support a stronger invariant or a tighter bound?",
  "Compare a time-for-space trade-off, preprocessing once, and discarding work safely. Which direction can you justify?",
];

function unique(items: string[]) {
  return Array.from(new Set(items));
}

export function createCodingNudge(nudgeIndex: number): string {
  return `Reasoning nudge: ${reasoningNudges[nudgeIndex % reasoningNudges.length]} Derive the next step from your own observations before naming a technique.`;
}

export function buildCodingNotes(problem: CodingProblem, messages: CodingMessage[], code: string, nudgesUsed: number): CodingNotes {
  const candidateInputs = messages.filter((message) => message.role === "candidate").map((message) => message.text.trim()).filter(Boolean);
  const discussion = candidateInputs.join(" ");
  const combined = `${discussion}\n${code}`;
  const detectedTechniques = techniqueMatchers.filter((item) => item.matcher.test(combined)).map((item) => item.label);
  const approaches = unique([
    ...(bruteForce.test(combined) ? ["Established a brute-force baseline"] : []),
    ...detectedTechniques.map((technique) => `Explored ${technique}`),
    ...(revision.test(discussion) ? ["Iterated from an initial approach"] : []),
  ]);

  const strengths = unique([
    ...(complexity.test(combined) ? ["Discussed asymptotic complexity"] : []),
    ...(edgeCases.test(combined) ? ["Raised boundary or edge cases"] : []),
    ...(tests.test(combined) ? ["Used examples or a dry run"] : []),
    ...(detectedTechniques.length ? ["Connected the solution to a recognizable algorithmic pattern"] : []),
  ]);

  const pitfalls = unique([
    ...(bruteForce.test(combined) ? ["The submitted reasoning included a brute-force path; valid, but not yet at the expected optimization target."] : []),
    ...(!complexity.test(combined) ? ["Time and auxiliary-space complexity were not stated clearly."] : []),
    ...(!edgeCases.test(combined) ? ["Edge cases and boundary conditions were not made explicit."] : []),
    ...(!tests.test(combined) ? ["No concrete dry run or test case was discussed."] : []),
    ...(code.trim().length < 40 ? ["The code draft was incomplete or too small to assess implementation details."] : []),
    ...(/\.sort\(|\.sort\b|sorted\(/i.test(code) && /Arrays & Hashing|Two Pointers|Intervals/.test(problem.category) ? ["Sorting may change the expected complexity or input ordering; justify why that trade-off is acceptable."] : []),
  ]);

  const challenges = unique([
    ...(stuck.test(discussion) || nudgesUsed > 0 ? [`Needed ${Math.max(nudgesUsed, 1)} reasoning nudge${Math.max(nudgesUsed, 1) === 1 ? "" : "s"}.`] : []),
    ...(bugs.test(combined) ? ["Encountered or anticipated an implementation/correctness issue."] : []),
    ...(revision.test(discussion) ? ["Changed direction while refining the approach."] : []),
    ...(!candidateInputs.length ? ["Submitted without explaining the reasoning in the discussion."] : []),
  ]);

  return {
    summary: bruteForce.test(combined)
      ? `A valid baseline was accepted for ${problem.title}; the main next step is reaching and defending ${problem.targetComplexity}.`
      : `The attempt was evaluated on correctness reasoning, complexity, edge cases, and progress toward ${problem.targetComplexity}.`,
    reference: [`Reference pattern: ${problem.category}`, `Typical target complexity: ${problem.targetComplexity}`],
    approaches: approaches.length ? approaches : ["No specific algorithmic approach was captured in the discussion."],
    strengths: strengths.length ? strengths : ["A solution draft was submitted for review."],
    pitfalls: pitfalls.length ? pitfalls : ["No major reasoning pitfall was detected from the captured input."],
    challenges: challenges.length ? challenges : ["No explicit blocker or challenge was recorded."],
    inputLog: candidateInputs.slice(-6).map((input) => input.length > 180 ? `${input.slice(0, 177)}…` : input),
  };
}
