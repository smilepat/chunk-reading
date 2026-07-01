import { describe, it, expect } from "vitest";
import { alignGlosses, buildGlossPrompt } from "./gloss";

describe("alignGlosses", () => {
  it("places glosses at their chunk index", () => {
    expect(
      alignGlosses(3, [
        { i: 0, ko: "나는 갔다" },
        { i: 2, ko: "부산으로" },
      ]),
    ).toEqual(["나는 갔다", "", "부산으로"]);
  });

  it("drops out-of-range entries and trims whitespace", () => {
    expect(
      alignGlosses(2, [
        { i: 5, ko: "버려짐" },
        { i: 0, ko: "  나는 갔다 " },
        { i: -1, ko: "버려짐" },
      ]),
    ).toEqual(["나는 갔다", ""]);
  });

  it("handles an empty passage", () => {
    expect(alignGlosses(0, [])).toEqual([]);
  });
});

describe("buildGlossPrompt", () => {
  it("numbers chunks in reading order and asks for 직독직해", () => {
    const p = buildGlossPrompt(["I went", "to Pusan"]);
    expect(p).toContain("0\tI went");
    expect(p).toContain("1\tto Pusan");
    expect(p).toContain("직독직해");
  });
});
