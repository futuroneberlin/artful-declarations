import { describe, expect, it } from "vitest";
import { prepareContribution } from "@/lib/contribution";

describe("Visitor contribution", () => {
  it("records consent on submission without requiring a checkbox value", () => {
    expect(prepareContribution("shared care", "", "en")?.consent).toBe(true);
  });
  it("requires Art is", () => {
    expect(prepareContribution(" ", "making together", "en")).toBeNull();
  });
  it("allows an empty optional action", () => {
    expect(prepareContribution("shared care", "", "de")).toEqual({ art_is: "shared care", acted_through_art: null, language: "de", consent: true });
  });
});