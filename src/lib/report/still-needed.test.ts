import { describe, expect, it } from "vitest";

import { mergeStillNeeded, renderMissingFact } from "@/lib/report/still-needed";

describe("renderMissingFact", () => {
  it("maps known profile fields to their plain-language questions", () => {
    expect(renderMissingFact("monthlyIncomeBracket")).toBe(
      "Roughly what is their monthly income?",
    );
    expect(renderMissingFact("insurance.medicaid")).toBe(
      "Are they enrolled in Medicaid (Apple Health)?",
    );
  });

  it("renders alwaysNeeded phrases plainly, dropping the (not collected) tag", () => {
    expect(
      renderMissingFact("homebound status and provider certification (not collected)"),
    ).toBe("Homebound status and provider certification");
    expect(
      renderMissingFact(
        "clinical Aid & Attendance examination findings, VA Form 21-2680 (not collected)",
      ),
    ).toBe("Clinical Aid & Attendance examination findings, VA Form 21-2680");
  });

  it("falls back to a generic question for unmapped field names", () => {
    expect(renderMissingFact("unpaidCaregiver (not collected)")).toBe(
      "Can you provide: unpaidCaregiver?",
    );
  });
});

describe("mergeStillNeeded", () => {
  it("appends rules-known facts the model omitted", () => {
    const merged = mergeStillNeeded(
      ["Your monthly income range"],
      ["homebound status and provider certification (not collected)"],
    );
    expect(merged).toEqual([
      "Your monthly income range",
      "Homebound status and provider certification",
    ]);
  });

  it("keeps all model items and preserves their order first", () => {
    const merged = mergeStillNeeded(["A", "B"], []);
    expect(merged).toEqual(["A", "B"]);
  });

  it("skips facts the model already expressed in its own words", () => {
    const merged = mergeStillNeeded(
      ["Whether a doctor has certified that they are homebound and their provider certification"],
      ["homebound status and provider certification (not collected)"],
    );
    expect(merged).toHaveLength(1);
  });

  it("skips exact duplicates case-insensitively", () => {
    const merged = mergeStillNeeded(
      ["Homebound status and provider certification"],
      ["homebound status and provider certification (not collected)"],
    );
    expect(merged).toHaveLength(1);
  });

  it("produces facts even when the model proposed nothing", () => {
    const merged = mergeStillNeeded(
      [],
      ["skilled nursing/therapy care need (not collected)", "monthlyIncomeBracket"],
    );
    expect(merged).toEqual([
      "Skilled nursing/therapy care need",
      "Roughly what is their monthly income?",
    ]);
  });
});
