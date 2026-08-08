import { describe, it, expect } from "vitest";
import { alignGlosses, alignRoles, buildGlossPrompt } from "./gloss";

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

describe("alignRoles", () => {
  it("places 추임새 at their chunk index and trims whitespace", () => {
    expect(
      alignRoles(3, [
        { i: 0, ko: "이 대통령은 갔다", q: " 누가 " },
        { i: 1, ko: "이탈리아로", q: "어디로" },
      ]),
    ).toEqual(["누가", "어디로", ""]);
  });

  it("stays empty when the backend gave no q (legacy responses)", () => {
    expect(
      alignRoles(2, [
        { i: 0, ko: "나는 갔다" },
        { i: 1, ko: "부산으로" },
      ]),
    ).toEqual(["", ""]);
  });

  it("drops out-of-range entries", () => {
    expect(alignRoles(1, [{ i: 4, ko: "버려짐", q: "왜" }])).toEqual([""]);
  });
});

describe("buildGlossPrompt", () => {
  it("numbers chunks in reading order and asks for 직독직해", () => {
    const p = buildGlossPrompt(["I went", "to Pusan"]);
    expect(p).toContain("0\tI went");
    expect(p).toContain("1\tto Pusan");
    expect(p).toContain("직독직해");
  });

  it("asks for the 추임새 role prompt q", () => {
    const p = buildGlossPrompt(["I went"]);
    expect(p).toContain("추임새");
    expect(p).toContain('"q"');
  });

  it("추상문용 담화 추임새와 변별(반복 금지) 규칙을 포함한다", () => {
    const p = buildGlossPrompt(["I went"]);
    expect(p).toContain("주장은");
    expect(p).toContain("DISCRIMINATIVE");
  });
});
