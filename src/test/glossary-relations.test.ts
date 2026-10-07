import { describe, expect, it } from "vitest";
import { extractRelations, timestamp, type Statement } from "@/lib/glossary-relations";

const row = (art: string | null, action: string | null): Statement => ({ id: "research", art_is: art, acted_through_art: action, created_at: "2026-10-07T11:53:00Z", language: "en" });

describe("living glossary extraction", () => {
  it("keeps attitude and action lenses separate", () => {
    const response = row("care and support", "painting in a public garden");
    expect(extractRelations(response, "attitude").poles).toEqual(["care"]);
    expect(extractRelations(response, "gesture").poles).toEqual(["civic", "ecology", "making"]);
    expect(extractRelations(response, "vectors").poles).toEqual(["care", "civic", "ecology", "making"]);
    expect(response.art_is).toBe("care and support");
  });
  it("recognises bilingual micro echoes", () => {
    expect(extractRelations(row(null, "zuhören und gemeinsam reparieren"), "gesture").echoes).toEqual(["listening", "together", "repair"]);
  });
  it("leaves unmatched statements open and uses existing themes only for vectors", () => {
    expect(extractRelations(row("xyz", null), "attitude", ["nature"]).poles).toEqual(["open"]);
    expect(extractRelations(row("xyz", null), "vectors", ["nature"]).poles).toEqual(["ecology"]);
  });
  it("processes 1500 statements without changing the originals", () => {
    const answers = Array.from({ length: 1500 }, (_, i) => ({ ...row("care", "listening"), id: String(i) }));
    const before = JSON.stringify(answers);
    expect(answers.map((answer) => extractRelations(answer, "vectors")).filter((result) => result.poles.includes("care"))).toHaveLength(1500);
    expect(JSON.stringify(answers)).toBe(before);
  });
  it("formats timestamps explicitly in UTC", () => {
    expect(timestamp("2026-10-07T11:53:00Z", "en")).toContain("11:53:00");
    expect(timestamp("invalid", "de")).toBe("—");
  });
});