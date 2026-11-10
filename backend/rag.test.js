import { chunkText, cosine } from "./rag.js";

// 2000 chars, step of 700 -> chunks start at 0, 700, 1400 -> 3 chunks
test("chunkText splits 2000 chars into 3 chunks", () => {
  const chunks = chunkText("A".repeat(2000));
  expect(chunks.length).toBe(3);
  expect(chunks.map((c) => c.length)).toEqual([800, 800, 600]);
});

// Edge case: empty input must not crash or return junk
test("chunkText returns no chunks for empty text", () => {
  expect(chunkText("")).toEqual([]);
});

// Same direction = same meaning = score 1
test("cosine of identical vectors is 1", () => {
  expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
});

// Perpendicular = unrelated = score 0
test("cosine of perpendicular vectors is 0", () => {
  expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
});