import { describe, it, expect } from "vitest";
import { chunkSpan, chunkText, splitSentences, paragraphChunks } from "./chunk";

describe("chunkSpan", () => {
  it("keeps verb+object together, breaks before a PP once a chunk has 2+ words", () => {
    const t = "President Lee went to Italy to meet the prime minister";
    const chunks = chunkSpan(t, 0, t.length);
    expect(chunks.map((c) => c.text)).toEqual([
      "President Lee went",
      "to Italy",
      "to meet the prime minister",
    ]);
  });

  it("produces exact source slices (0 drop)", () => {
    const t = "I went to Pusan.";
    for (const c of chunkSpan(t, 0, t.length)) {
      expect(t.slice(c.start, c.end)).toBe(c.text);
    }
  });
});

describe("splitSentences", () => {
  it("splits on terminal punctuation with exact offsets", () => {
    const t = "He runs. She reads.";
    const spans = splitSentences(t);
    expect(spans.map((s) => t.slice(s.start, s.end).trim())).toEqual([
      "He runs.",
      "She reads.",
    ]);
  });

  it("treats a blank line as a paragraph boundary", () => {
    const t = "First para\n\nSecond para";
    const spans = splitSentences(t);
    expect(spans.length).toBe(2);
  });
});

describe("chunkText", () => {
  it("chunks a whole passage in reading order without crossing sentences", () => {
    const t = "I went to Pusan. She stayed home.";
    const chunks = chunkText(t);
    expect(chunks[0].text).toBe("I went");
    // every chunk is an exact slice
    for (const c of chunks) expect(t.slice(c.start, c.end)).toBe(c.text);
  });
});

describe("paragraphChunks", () => {
  it("groups chunks by blank line and numbers them globally", () => {
    const t = "I went to Pusan.\n\nShe stayed home.";
    const groups = paragraphChunks(t, chunkText(t));
    expect(groups.length).toBe(2);
    const flat = groups.flat();
    expect(flat.map((x) => x.gi)).toEqual(flat.map((_, i) => i));
  });
});
