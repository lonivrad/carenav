import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** WCAG 2.0/2.1 level A and AA — the conformance target for CareNav. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * A schema-valid report, seeded into sessionStorage so the report page renders
 * its full content (ranked index, cards, next step, unknowns) without a paid
 * pipeline call. Mirrors the shape produced by runScreening.
 */
const FIXTURE_REPORT = {
  overallSummary:
    "Based on the answers provided, a few programs appear worth investigating " +
    "with a benefits professional. This screening does not determine eligibility.",
  programs: [
    {
      programId: "wa-copes",
      programName: "COPES (Community Options Program Entry System)",
      status: "ok",
      relevanceLabel: "high",
      whyThisMayApply:
        "The person is 82 and needs help with bathing and dressing at home.",
      whatItCovers: [
        {
          text: "COPES can pay for in-home personal care and some home safety supports.",
          chunkIds: ["wa-copes#01-eligibility"],
        },
      ],
      informationStillNeeded: ["Monthly income", "Countable assets"],
      citations: ["wa-copes#01-eligibility"],
      nextSteps: ["Call Community Living Connections at 1-855-567-0252."],
      officialLinks: ["https://www.dshs.wa.gov/altsa/home-and-community-services"],
    },
    {
      programId: "medicare-home-health",
      programName: "Medicare home health benefit",
      status: "ok",
      relevanceLabel: "medium",
      whyThisMayApply:
        "The person is on Medicare and may need part-time skilled care at home.",
      whatItCovers: [
        {
          text: "Medicare can cover intermittent skilled nursing and therapy at home.",
          chunkIds: ["medicare-home-health#01-coverage"],
        },
      ],
      informationStillNeeded: ["Whether a doctor has certified a homebound status"],
      citations: ["medicare-home-health#01-coverage"],
      nextSteps: ["Ask the person's doctor whether home health is appropriate."],
      officialLinks: ["https://www.medicare.gov/coverage/home-health-services"],
    },
  ],
  unknowns: ["Monthly income", "Countable assets", "Veteran status"],
  followUpQuestions: ["Roughly what is their monthly income?"],
  disclaimer:
    "This screening is educational only. It identifies programs that appear " +
    "worth investigating based on the information provided — it does not " +
    "determine eligibility, provide legal or financial advice, or estimate " +
    "benefit amounts.",
};

test.describe("accessibility (axe-core, WCAG 2.1 AA)", () => {
  test("intake page has no violations", async ({ page }) => {
    await page.goto("/intake");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("report page has no violations", async ({ page }) => {
    const id = "a11y-fixture";
    await page.addInitScript(
      ([key, value]) => window.sessionStorage.setItem(key, value),
      [`carenav.report.${id}`, JSON.stringify(FIXTURE_REPORT)] as const,
    );

    await page.goto(`/report/${id}`);
    await expect(
      page.getByRole("heading", { level: 1, name: /screening report/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("intake is keyboard navigable with a visible focus indicator", async ({
    page,
  }) => {
    await page.goto("/intake");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const CONTROLS = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"];
    let focused: {
      tag: string;
      outlineStyle: string;
      outlineWidth: string;
      boxShadow: string;
    } | null = null;

    // Tab from the top until focus lands on a real interactive control.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const s = getComputedStyle(el);
        return {
          tag: el.tagName,
          outlineStyle: s.outlineStyle,
          outlineWidth: s.outlineWidth,
          boxShadow: s.boxShadow,
        };
      });
      if (focused && CONTROLS.includes(focused.tag)) break;
    }

    // Reachable by keyboard…
    expect(focused && CONTROLS.includes(focused.tag)).toBeTruthy();
    // …and the keyboard focus is visibly indicated (outline ring or shadow).
    const hasOutline =
      focused!.outlineStyle !== "none" && focused!.outlineWidth !== "0px";
    const hasShadow = focused!.boxShadow !== "none";
    expect(hasOutline || hasShadow).toBeTruthy();
  });
});
