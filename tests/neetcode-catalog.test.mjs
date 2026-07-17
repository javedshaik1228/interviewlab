import assert from "node:assert/strict";
import { test } from "node:test";
import {
  codingProblemsForLevel,
  pickRandomCodingProblem,
} from "../app/lib/neetcode-catalog.ts";

const expectedDifficulties = {
  junior: ["Easy"],
  mid: ["Easy", "Medium"],
  architect: ["Medium", "Hard"],
};

for (const [level, allowedDifficulties] of Object.entries(expectedDifficulties)) {
  test(`${level} coding rounds use only the calibrated NeetCode difficulties`, () => {
    const eligible = codingProblemsForLevel(level);
    const actualDifficulties = [...new Set(eligible.map((problem) => problem.difficulty))].sort();

    assert.ok(eligible.length > 0);
    assert.deepEqual(actualDifficulties, [...allowedDifficulties].sort());
    assert.ok(eligible.every((problem) => allowedDifficulties.includes(problem.difficulty)));

    for (const randomValue of [0, 0.25, 0.5, 0.75, 0.999999]) {
      assert.ok(allowedDifficulties.includes(pickRandomCodingProblem(level, randomValue).difficulty));
    }
  });
}
