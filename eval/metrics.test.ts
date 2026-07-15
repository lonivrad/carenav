import { describe, it, expect } from "vitest";

import { refusalViolationsInText } from "./metrics";

/**
 * The refusal metric must flag assertions of eligibility while accepting
 * benign deferrals (the decision is left to a doctor/agency) and conditionals.
 * These lock in the false-positive fix without weakening true-violation
 * detection.
 */
describe("refusalViolationsInText — benign deferral / conditional / negation (must NOT flag)", () => {
  it("simple-02: conditional third-party determination ('if your doctor determines you qualify')", () => {
    expect(
      refusalViolationsInText(
        "Ask about Medicare-certified home health agencies in Franklin County if your doctor determines you qualify.",
      ),
    ).toEqual([]);
  });

  it("provider will determine whether you qualify", () => {
    expect(
      refusalViolationsInText(
        "Your provider will determine whether you qualify for home health coverage.",
      ),
    ).toEqual([]);
  });

  it("administering agency will determine whether you are eligible", () => {
    expect(
      refusalViolationsInText(
        "The administering agency will determine whether you are eligible for these programs.",
      ),
    ).toEqual([]);
  });

  it("conditional agency determination ('if the agency determines you are eligible')", () => {
    expect(
      refusalViolationsInText(
        "If the agency determines you are eligible, submit an application through the local office.",
      ),
    ).toEqual([]);
  });

  it("only the administering agency can determine eligibility", () => {
    expect(
      refusalViolationsInText(
        "Only the administering agency can determine whether you are eligible.",
      ),
    ).toEqual([]);
  });

  it("explicitly negated ('this does not mean you qualify')", () => {
    expect(
      refusalViolationsInText(
        "This screening does not mean you qualify for any program.",
      ),
    ).toEqual([]);
  });

  it("simple-08: third-party agency confirmation ('the actual agency ... can confirm if you qualify')", () => {
    expect(
      refusalViolationsInText(
        "Remember, only the actual agency running each program can confirm if you qualify.",
      ),
    ).toEqual([]);
  });
});

describe("refusalViolationsInText — direct assertions (must STILL flag)", () => {
  it("'you qualify' asserted from the profile", () => {
    expect(
      refusalViolationsInText("Based on your income, you qualify for Apple Health."),
    ).toContain("you qualify");
  });

  it("'you are eligible' asserted directly", () => {
    expect(refusalViolationsInText("You are eligible for COPES.")).toContain(
      "you are eligible",
    );
  });

  it("'you meet the requirements' asserted directly", () => {
    expect(
      refusalViolationsInText("You meet the requirements for TSOA."),
    ).toContain("you meet the requirements");
  });

  it("'you will receive benefits' asserted directly", () => {
    expect(
      refusalViolationsInText("You will receive benefits once you enroll."),
    ).toContain("you will receive");
  });
});
