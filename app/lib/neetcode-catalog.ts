import type { Level } from "./interview-engine";

export type CodingDifficulty = "Easy" | "Medium" | "Hard";

export type CodingProblem = {
  id: string;
  title: string;
  category: string;
  difficulty: CodingDifficulty;
  sourceUrl: string;
  targetComplexity: string;
};

type ProblemSeed = [title: string, difficulty: CodingDifficulty, slug: string];
type ProblemGroup = [category: string, problems: ProblemSeed[]];

const groups: ProblemGroup[] = [
  ["Arrays & Hashing", [
    ["Contains Duplicate", "Easy", "duplicate-integer"], ["Valid Anagram", "Easy", "is-anagram"], ["Two Sum", "Easy", "two-integer-sum"],
    ["Group Anagrams", "Medium", "anagram-groups"], ["Top K Frequent Elements", "Medium", "top-k-elements-in-list"], ["Encode and Decode Strings", "Medium", "string-encode-and-decode"],
    ["Product of Array Except Self", "Medium", "products-of-array-discluding-self"], ["Valid Sudoku", "Medium", "valid-sudoku"], ["Longest Consecutive Sequence", "Medium", "longest-consecutive-sequence"],
  ]],
  ["Two Pointers", [
    ["Valid Palindrome", "Easy", "is-palindrome"], ["Two Sum II Input Array Is Sorted", "Medium", "two-integer-sum-ii"], ["3Sum", "Medium", "three-integer-sum"],
    ["Container With Most Water", "Medium", "max-water-container"], ["Trapping Rain Water", "Hard", "trapping-rain-water"],
  ]],
  ["Sliding Window", [
    ["Best Time to Buy And Sell Stock", "Easy", "buy-and-sell-crypto"], ["Longest Substring Without Repeating Characters", "Medium", "longest-substring-without-duplicates"],
    ["Longest Repeating Character Replacement", "Medium", "longest-repeating-substring-with-replacement"], ["Permutation In String", "Medium", "permutation-string"],
    ["Minimum Window Substring", "Hard", "minimum-window-with-characters"], ["Sliding Window Maximum", "Hard", "sliding-window-maximum"],
  ]],
  ["Stack", [
    ["Valid Parentheses", "Easy", "validate-parentheses"], ["Min Stack", "Medium", "minimum-stack"], ["Evaluate Reverse Polish Notation", "Medium", "evaluate-reverse-polish-notation"],
    ["Daily Temperatures", "Medium", "daily-temperatures"], ["Car Fleet", "Medium", "car-fleet"], ["Largest Rectangle In Histogram", "Hard", "largest-rectangle-in-histogram"],
  ]],
  ["Binary Search", [
    ["Binary Search", "Easy", "binary-search"], ["Search a 2D Matrix", "Medium", "search-2d-matrix"], ["Koko Eating Bananas", "Medium", "eating-bananas"],
    ["Find Minimum In Rotated Sorted Array", "Medium", "find-minimum-in-rotated-sorted-array"], ["Search In Rotated Sorted Array", "Medium", "find-target-in-rotated-sorted-array"],
    ["Time Based Key Value Store", "Medium", "time-based-key-value-store"], ["Median of Two Sorted Arrays", "Hard", "median-of-two-sorted-arrays"],
  ]],
  ["Linked List", [
    ["Reverse Linked List", "Easy", "reverse-a-linked-list"], ["Merge Two Sorted Lists", "Easy", "merge-two-sorted-linked-lists"], ["Linked List Cycle", "Easy", "linked-list-cycle-detection"],
    ["Reorder List", "Medium", "reorder-linked-list"], ["Remove Nth Node From End of List", "Medium", "remove-node-from-end-of-linked-list"], ["Copy List With Random Pointer", "Medium", "copy-linked-list-with-random-pointer"],
    ["Add Two Numbers", "Medium", "add-two-numbers"], ["Find The Duplicate Number", "Medium", "find-duplicate-integer"], ["LRU Cache", "Medium", "lru-cache"],
    ["Merge K Sorted Lists", "Hard", "merge-k-sorted-linked-lists"], ["Reverse Nodes In K Group", "Hard", "reverse-nodes-in-k-group"],
  ]],
  ["Trees", [
    ["Invert Binary Tree", "Easy", "invert-a-binary-tree"], ["Maximum Depth of Binary Tree", "Easy", "depth-of-binary-tree"], ["Diameter of Binary Tree", "Easy", "binary-tree-diameter"],
    ["Balanced Binary Tree", "Easy", "balanced-binary-tree"], ["Same Tree", "Easy", "same-binary-tree"], ["Subtree of Another Tree", "Easy", "subtree-of-a-binary-tree"],
    ["Lowest Common Ancestor of a Binary Search Tree", "Medium", "lowest-common-ancestor-in-binary-search-tree"], ["Binary Tree Level Order Traversal", "Medium", "level-order-traversal-of-binary-tree"],
    ["Binary Tree Right Side View", "Medium", "binary-tree-right-side-view"], ["Count Good Nodes In Binary Tree", "Medium", "count-good-nodes-in-binary-tree"], ["Validate Binary Search Tree", "Medium", "valid-binary-search-tree"],
    ["Kth Smallest Element In a Bst", "Medium", "kth-smallest-integer-in-bst"], ["Construct Binary Tree From Preorder And Inorder Traversal", "Medium", "binary-tree-from-preorder-and-inorder-traversal"],
    ["Binary Tree Maximum Path Sum", "Hard", "binary-tree-maximum-path-sum"], ["Serialize And Deserialize Binary Tree", "Hard", "serialize-and-deserialize-binary-tree"],
  ]],
  ["Heap / Priority Queue", [
    ["Kth Largest Element In a Stream", "Easy", "kth-largest-integer-in-a-stream"], ["Last Stone Weight", "Easy", "last-stone-weight"], ["K Closest Points to Origin", "Medium", "k-closest-points-to-origin"],
    ["Kth Largest Element In An Array", "Medium", "kth-largest-element-in-an-array"], ["Task Scheduler", "Medium", "task-scheduling"], ["Design Twitter", "Medium", "design-twitter-feed"],
    ["Find Median From Data Stream", "Hard", "find-median-in-a-data-stream"],
  ]],
  ["Backtracking", [
    ["Subsets", "Medium", "subsets"], ["Combination Sum", "Medium", "combination-target-sum"], ["Combination Sum II", "Medium", "combination-target-sum-ii"],
    ["Permutations", "Medium", "permutations"], ["Subsets II", "Medium", "subsets-ii"], ["Generate Parentheses", "Medium", "generate-parentheses"],
    ["Word Search", "Medium", "search-for-word"], ["Palindrome Partitioning", "Medium", "palindrome-partitioning"], ["Letter Combinations of a Phone Number", "Medium", "combinations-of-a-phone-number"],
    ["N Queens", "Hard", "n-queens"],
  ]],
  ["Tries", [
    ["Implement Trie Prefix Tree", "Medium", "implement-prefix-tree"], ["Design Add And Search Words Data Structure", "Medium", "design-word-search-data-structure"], ["Word Search II", "Hard", "search-for-word-ii"],
  ]],
  ["Graphs", [
    ["Number of Islands", "Medium", "count-number-of-islands"], ["Max Area of Island", "Medium", "max-area-of-island"], ["Clone Graph", "Medium", "clone-graph"],
    ["Walls And Gates", "Medium", "islands-and-treasure"], ["Rotting Oranges", "Medium", "rotting-fruit"], ["Pacific Atlantic Water Flow", "Medium", "pacific-atlantic-water-flow"],
    ["Surrounded Regions", "Medium", "surrounded-regions"], ["Course Schedule", "Medium", "course-schedule"], ["Course Schedule II", "Medium", "course-schedule-ii"],
    ["Graph Valid Tree", "Medium", "valid-tree"], ["Number of Connected Components In An Undirected Graph", "Medium", "count-connected-components"], ["Redundant Connection", "Medium", "redundant-connection"],
    ["Word Ladder", "Hard", "word-ladder"],
  ]],
  ["Advanced Graphs", [
    ["Network Delay Time", "Medium", "network-delay-time"], ["Reconstruct Itinerary", "Hard", "reconstruct-flight-path"], ["Min Cost to Connect All Points", "Medium", "min-cost-to-connect-points"],
    ["Swim In Rising Water", "Hard", "swim-in-rising-water"], ["Alien Dictionary", "Hard", "foreign-dictionary"], ["Cheapest Flights Within K Stops", "Medium", "cheapest-flight-path"],
  ]],
  ["1-D Dynamic Programming", [
    ["Climbing Stairs", "Easy", "climbing-stairs"], ["Min Cost Climbing Stairs", "Easy", "min-cost-climbing-stairs"], ["House Robber", "Medium", "house-robber"],
    ["House Robber II", "Medium", "house-robber-ii"], ["Longest Palindromic Substring", "Medium", "longest-palindromic-substring"], ["Palindromic Substrings", "Medium", "palindromic-substrings"],
    ["Decode Ways", "Medium", "decode-ways"], ["Coin Change", "Medium", "coin-change"], ["Maximum Product Subarray", "Medium", "maximum-product-subarray"],
    ["Word Break", "Medium", "word-break"], ["Longest Increasing Subsequence", "Medium", "longest-increasing-subsequence"], ["Partition Equal Subset Sum", "Medium", "partition-equal-subset-sum"],
  ]],
  ["2-D Dynamic Programming", [
    ["Unique Paths", "Medium", "count-paths"], ["Longest Common Subsequence", "Medium", "longest-common-subsequence"], ["Best Time to Buy And Sell Stock With Cooldown", "Medium", "buy-and-sell-crypto-with-cooldown"],
    ["Coin Change II", "Medium", "coin-change-ii"], ["Target Sum", "Medium", "target-sum"], ["Interleaving String", "Medium", "interleaving-string"],
    ["Longest Increasing Path In a Matrix", "Hard", "longest-increasing-path-in-matrix"], ["Distinct Subsequences", "Hard", "count-subsequences"], ["Edit Distance", "Medium", "edit-distance"],
    ["Burst Balloons", "Hard", "burst-balloons"], ["Regular Expression Matching", "Hard", "regular-expression-matching"],
  ]],
  ["Greedy", [
    ["Maximum Subarray", "Medium", "maximum-subarray"], ["Jump Game", "Medium", "jump-game"], ["Jump Game II", "Medium", "jump-game-ii"], ["Gas Station", "Medium", "gas-station"],
    ["Hand of Straights", "Medium", "hand-of-straights"], ["Merge Triplets to Form Target Triplet", "Medium", "merge-triplets-to-form-target"], ["Partition Labels", "Medium", "partition-labels"],
    ["Valid Parenthesis String", "Medium", "valid-parenthesis-string"],
  ]],
  ["Intervals", [
    ["Insert Interval", "Medium", "insert-new-interval"], ["Merge Intervals", "Medium", "merge-intervals"], ["Non Overlapping Intervals", "Medium", "non-overlapping-intervals"],
    ["Meeting Rooms", "Easy", "meeting-schedule"], ["Meeting Rooms II", "Medium", "meeting-schedule-ii"], ["Minimum Interval to Include Each Query", "Hard", "minimum-interval-including-query"],
  ]],
  ["Math & Geometry", [
    ["Rotate Image", "Medium", "rotate-matrix"], ["Spiral Matrix", "Medium", "spiral-matrix"], ["Set Matrix Zeroes", "Medium", "set-zeroes-in-matrix"], ["Happy Number", "Easy", "non-cyclical-number"],
    ["Plus One", "Easy", "plus-one"], ["Pow(x, n)", "Medium", "pow-x-n"], ["Multiply Strings", "Medium", "multiply-strings"], ["Detect Squares", "Medium", "count-squares"],
  ]],
  ["Bit Manipulation", [
    ["Single Number", "Easy", "single-number"], ["Number of 1 Bits", "Easy", "number-of-one-bits"], ["Counting Bits", "Easy", "counting-bits"], ["Reverse Bits", "Easy", "reverse-bits"],
    ["Missing Number", "Easy", "missing-number"], ["Sum of Two Integers", "Medium", "sum-of-two-integers"], ["Reverse Integer", "Medium", "reverse-integer"],
  ]],
];

const categoryComplexity: Record<string, string> = {
  "Arrays & Hashing": "usually O(n) time",
  "Two Pointers": "usually O(n), or O(n²) for 3Sum-style problems",
  "Sliding Window": "usually O(n) time",
  Stack: "usually O(n) time",
  "Binary Search": "usually O(log n) or O(n log range)",
  "Linked List": "usually O(n), with O(1) extra pointer space",
  Trees: "usually O(n) time",
  "Heap / Priority Queue": "usually O(n log k)",
  Backtracking: "exponential output-sensitive time with pruning",
  Tries: "usually O(total characters) to build and O(word length) per lookup",
  Graphs: "usually O(V + E)",
  "Advanced Graphs": "commonly O(E log V)",
  "1-D Dynamic Programming": "usually O(n) or O(n²), depending on the state transition",
  "2-D Dynamic Programming": "usually O(mn) or another state-space bound",
  Greedy: "usually O(n), or O(n log n) when sorting is required",
  Intervals: "usually O(n log n)",
  "Math & Geometry": "usually linear in the represented input size",
  "Bit Manipulation": "usually O(n) or O(word size)",
};

export const neetcodeProblems: CodingProblem[] = groups.flatMap(([category, problems]) => {
  return problems.map(([title, difficulty, slug]) => ({
    id: slug,
    title,
    category,
    difficulty,
    sourceUrl: `https://neetcode.io/problems/${slug}/question?list=neetcode150`,
    targetComplexity: categoryComplexity[category],
  }));
});

export function pickRandomCodingProblem(level: Level, randomValue = Math.random()): CodingProblem {
  const eligible = neetcodeProblems.filter((problem) => {
    if (level === "junior") return problem.difficulty !== "Hard";
    if (level === "architect") return problem.difficulty !== "Easy";
    return true;
  });
  const bounded = Math.max(0, Math.min(0.999999, randomValue));
  return eligible[Math.floor(bounded * eligible.length)];
}
