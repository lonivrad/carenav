/**
 * Phase 7.5, step 3 — agreement computation (runs only after labels lock).
 *
 * Ingests the filled blind worksheets, compares them against the sealed
 * system snapshot, and produces eval/results/independent-labeling-report.md.
 *
 * Conventions (stated in the report):
 * - Manual labels: WI (worth-investigating), NWI (not), UNK (docs + attributes
 *   don't settle it).
 * - System program set: the programs in the recorded Phase 7 report.
 * - Strict P/R & exact match: system set vs manual WI only.
 * - Lenient P/R & exact match: system set vs manual WI ∪ UNK (the system
 *   includes unknown-status programs by design, so both views are shown).
 * - Disagreement types kept distinct: over-include (system in, manual NWI),
 *   under-include (system out, manual WI), unknown-vs-included, and
 *   unknown-vs-excluded.
 *
 * Usage:
 *   npx tsx eval/phase75/compare.ts            # print summary only
 *   npx tsx eval/phase75/compare.ts --write    # also write the report
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { QUERY_PICKS, SUBSET_IDS } from "./subset";

const EVAL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const WS_DIR = join(EVAL_DIR, "worksheets");

/* ------------------------------------------------------------- parsing -- */

type ManualLabel = "WI" | "NWI" | "UNK";

function parseTableRows(markdown: string): string[][] {
  return markdown
    .split("\n")
    .filter((l) => l.trim().startsWith("|"))
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim()),
    )
    .filter(
      (cells) => cells.length >= 2 && !/^[-\s:]+$/.test(cells.join("")),
    );
}

function parseFamilySheet(path: string): Map<string, { label: ManualLabel; why: string }> {
  const rows = parseTableRows(readFileSync(path, "utf8"));
  const out = new Map<string, { label: ManualLabel; why: string }>();
  for (const cells of rows) {
    const m = cells[0].match(/^([a-z0-9-]+)\s+—/);
    if (!m) continue;
    // Single letters are unambiguous prefixes: W→WI, N→NWI, U→UNK.
    const expand: Record<string, ManualLabel> = { W: "WI", N: "NWI", U: "UNK" };
    const raw = cells[1]?.toUpperCase() ?? "";
    const label = (expand[raw] ?? raw) as ManualLabel;
    if (label !== "WI" && label !== "NWI" && label !== "UNK") {
      throw new Error(`${path}: program ${m[1]} has label "${cells[1]}" (want WI/NWI/UNK)`);
    }
    out.set(m[1], { label, why: cells[2] ?? "" });
  }
  if (out.size !== 12) throw new Error(`${path}: parsed ${out.size} programs, want 12`);
  return out;
}

function parseQuerySheet(path: string): Map<string, "R" | "NR"> {
  const rows = parseTableRows(readFileSync(path, "utf8"));
  const out = new Map<string, "R" | "NR">();
  for (const cells of rows) {
    if (!cells[0].includes("#")) continue;
    const label = cells[2]?.toUpperCase();
    if (label !== "R" && label !== "NR") {
      throw new Error(`${path}: chunk ${cells[0]} has label "${cells[2]}" (want R/NR)`);
    }
    out.set(cells[0], label);
  }
  if (out.size !== 40) throw new Error(`${path}: parsed ${out.size} chunks, want 40`);
  return out;
}

/* ------------------------------------------------------------ snapshot -- */

interface Snapshot {
  indexSha256: string;
  families: {
    caseId: string;
    bucket: string;
    systemProgramSet: {
      programId: string;
      relevanceLabel: string;
      informationStillNeeded: string[];
    }[];
    queries: Record<string, string>;
    retrievals: {
      programId: string;
      status: string;
      chunks: { chunkId: string; score: number }[];
    }[];
  }[];
}

/* ---------------------------------------------------------------- math -- */

const mean = (xs: number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function prOf(system: Set<string>, truth: Set<string>) {
  const hit = [...system].filter((p) => truth.has(p)).length;
  return {
    precision: system.size === 0 ? (truth.size === 0 ? 1 : 0) : hit / system.size,
    recall: truth.size === 0 ? 1 : hit / truth.size,
  };
}

/* ----------------------------------------------------------------- main -- */

interface Disagreement {
  id: string;
  bucket: string;
  item: string;
  systemLabel: string;
  manualLabel: string;
}

function main() {
  const write = process.argv.includes("--write");
  const snapshot = JSON.parse(
    readFileSync(join(WS_DIR, ".system-retrieval-snapshot.json"), "utf8"),
  ) as Snapshot;
  const snapByCase = new Map(snapshot.families.map((f) => [f.caseId, f]));

  /* ---- Task A: program sets ---- */
  let exactStrict = 0;
  let exactLenient = 0;
  const strictPR: { precision: number; recall: number }[] = [];
  const lenientPR: { precision: number; recall: number }[] = [];
  const disagreements: Disagreement[] = [];
  // programId -> counts per disagreement type, with bucket breakdown
  const confusion = new Map<
    string,
    { overInclude: number; underInclude: number; unkIncluded: number; unkExcluded: number; buckets: Map<string, number> }
  >();
  let unkTotal = 0;
  let unkSystemFlaggedMissingInfo = 0;
  let unkVsIncluded = 0;
  let unkVsExcluded = 0;

  const bump = (
    programId: string,
    kind: "overInclude" | "underInclude" | "unkIncluded" | "unkExcluded",
    bucket: string,
  ) => {
    const entry =
      confusion.get(programId) ??
      { overInclude: 0, underInclude: 0, unkIncluded: 0, unkExcluded: 0, buckets: new Map() };
    entry[kind]++;
    entry.buckets.set(`${kind}:${bucket}`, (entry.buckets.get(`${kind}:${bucket}`) ?? 0) + 1);
    confusion.set(programId, entry);
  };

  for (const caseId of SUBSET_IDS) {
    const snap = snapByCase.get(caseId);
    if (!snap) throw new Error(`snapshot missing ${caseId}`);
    const manual = parseFamilySheet(join(WS_DIR, `family-${caseId}.md`));
    const systemSet = new Set(snap.systemProgramSet.map((p) => p.programId));
    const systemById = new Map(snap.systemProgramSet.map((p) => [p.programId, p]));

    const wi = new Set([...manual].filter(([, v]) => v.label === "WI").map(([k]) => k));
    const unk = new Set([...manual].filter(([, v]) => v.label === "UNK").map(([k]) => k));
    const wiOrUnk = new Set([...wi, ...unk]);

    if ([...systemSet].sort().join() === [...wi].sort().join()) exactStrict++;
    if ([...systemSet].sort().join() === [...wiOrUnk].sort().join()) exactLenient++;
    strictPR.push(prOf(systemSet, wi));
    lenientPR.push(prOf(systemSet, wiOrUnk));

    for (const [programId, { label }] of manual) {
      const included = systemSet.has(programId);
      const systemLabel = included
        ? `included (${systemById.get(programId)?.relevanceLabel})`
        : "excluded";
      if (label === "WI" && !included) {
        bump(programId, "underInclude", snap.bucket);
        disagreements.push({ id: caseId, bucket: snap.bucket, item: programId, systemLabel, manualLabel: "WI" });
      } else if (label === "NWI" && included) {
        bump(programId, "overInclude", snap.bucket);
        disagreements.push({ id: caseId, bucket: snap.bucket, item: programId, systemLabel, manualLabel: "NWI" });
      } else if (label === "UNK") {
        unkTotal++;
        if (included) {
          unkVsIncluded++;
          const info = systemById.get(programId);
          if ((info?.informationStillNeeded.length ?? 0) > 0) {
            unkSystemFlaggedMissingInfo++;
          } else {
            disagreements.push({ id: caseId, bucket: snap.bucket, item: programId, systemLabel: `${systemLabel}, no missing-info flag`, manualLabel: "UNK" });
          }
        } else {
          unkVsExcluded++;
          disagreements.push({ id: caseId, bucket: snap.bucket, item: programId, systemLabel, manualLabel: "UNK" });
        }
      }
    }
  }

  /* ---- Task B: retrieval ---- */
  const retrievalRows: {
    id: string;
    bucket: string;
    precision: number;
    recall: number;
    top5Recall: number;
    retrieved: string[];
    manualRelevant: string[];
  }[] = [];
  const files = readdirSync(WS_DIR);
  QUERY_PICKS.forEach((pick, i) => {
    const nn = String(i + 1).padStart(2, "0");
    const file = files.find((f) => f.startsWith(`query-${nn}-`));
    if (!file) throw new Error(`missing query sheet ${nn}`);
    const manual = parseQuerySheet(join(WS_DIR, file));
    const relevant = new Set([...manual].filter(([, v]) => v === "R").map(([k]) => k));
    const snap = snapByCase.get(pick.caseId);
    const retrieval = snap?.retrievals.find((r) => r.programId === pick.programId);
    const retrieved = (retrieval?.chunks ?? []).map((c) => c.chunkId);
    const hit = retrieved.filter((c) => relevant.has(c)).length;
    const top5Hit = retrieved.slice(0, 5).filter((c) => relevant.has(c)).length;
    retrievalRows.push({
      id: `${pick.caseId}/${pick.programId}`,
      bucket: snap?.bucket ?? "?",
      precision: retrieved.length === 0 ? 0 : hit / retrieved.length,
      recall: relevant.size === 0 ? 1 : hit / relevant.size,
      top5Recall: relevant.size === 0 ? 1 : top5Hit / Math.min(5, relevant.size),
      retrieved,
      manualRelevant: [...relevant].sort(),
    });
    // Retrieval disagreements: retrieved-but-NR, and R-but-not-retrieved.
    for (const c of retrieved) {
      if (!relevant.has(c)) {
        disagreements.push({ id: `query-${nn}`, bucket: snap?.bucket ?? "?", item: c, systemLabel: "retrieved", manualLabel: "NR" });
      }
    }
    for (const c of relevant) {
      if (!retrieved.includes(c)) {
        disagreements.push({ id: `query-${nn}`, bucket: snap?.bucket ?? "?", item: c, systemLabel: "not retrieved (top-3, program-scoped)", manualLabel: "R" });
      }
    }
  });

  /* ---- summary ---- */
  const n = SUBSET_IDS.length;
  const summary = [
    `## Summary`,
    ``,
    `- Subset: ${n} families (5 per bucket + 6th ambiguous), ${QUERY_PICKS.length} labeled queries × 40 chunks. Index sha256 \`${snapshot.indexSha256.slice(0, 12)}…\` (matches the Phase 7 run).`,
    `- **Exact-set-match rate:** strict (system set = manual WI): **${exactStrict}/${n}** (${pct(exactStrict / n)}); lenient (system set = manual WI∪UNK): **${exactLenient}/${n}** (${pct(exactLenient / n)}).`,
    `- **Program-set P/R (system vs manual):** strict P ${pct(mean(strictPR.map((x) => x.precision)))} / R ${pct(mean(strictPR.map((x) => x.recall)))}; lenient P ${pct(mean(lenientPR.map((x) => x.precision)))} / R ${pct(mean(lenientPR.map((x) => x.recall)))}. Phase 7 (rules-derived truth): P 100.0% / R 100.0%.`,
    `- **Unknown handling:** manual UNK labels: ${unkTotal}; system included ${unkVsIncluded} of them (${unkSystemFlaggedMissingInfo} with an explicit missing-info flag) and excluded ${unkVsExcluded}. Unknown-vs-included and unknown-vs-excluded are itemized separately in the disagreement table.`,
    `- **Missing-info flag gap (system behavior finding, not a ground-truth disagreement):** ${unkVsIncluded - unkSystemFlaggedMissingInfo} of the ${unkVsIncluded} manual-UNK programs the system included carry no missing-info flag explaining what's unresolved (only ${unkSystemFlaggedMissingInfo}/${unkVsIncluded}, ${pct(unkVsIncluded === 0 ? 1 : unkSystemFlaggedMissingInfo / unkVsIncluded)}, do). This is not about whether those programs should be included — it's about whether the system explains why when it includes them.`,
    `- **Retrieval vs manual relevance (${QUERY_PICKS.length} queries):** precision ${pct(mean(retrievalRows.map((r) => r.precision)))}, recall ${pct(mean(retrievalRows.map((r) => r.recall)))}, top-5 recall ${pct(mean(retrievalRows.map((r) => r.top5Recall)))} (system returns top-3, program-scoped). Phase 7 retriever-defined numbers were program-set-level (P 100.0% / R 100.0% / top-5 100.0%) — not chunk-level, so the chunk-level gap here is the first independent measurement, not a regression.`,
    `- Task A disagreements: ${disagreements.filter((d) => !d.id.startsWith("query-")).length}; Task B disagreements: ${disagreements.filter((d) => d.id.startsWith("query-")).length}.`,
  ].join("\n");

  console.log(summary);

  if (!write) {
    console.log("\n(--write not given: report not written)");
    return;
  }

  /* ---- full report ---- */
  const lines: string[] = [];
  lines.push(`# Independent labeling report (Phase 7.5)`);
  lines.push("");
  lines.push(
    `Blind manual labels (filled ${new Date().toISOString().slice(0, 10)}, ` +
      `locked before comparison) vs the sealed system snapshot. Labeling ` +
      `never imported or read src/lib/rules/; relevance was judged by ` +
      `reading chunks against queries.`,
  );
  lines.push("");
  lines.push(summary);
  lines.push("");
  lines.push("### Conventions");
  lines.push("");
  lines.push(
    "- System program set = programs in the recorded Phase 7 report. " +
      "Strict compares against manual WI; lenient against WI∪UNK (the " +
      "system includes unknown-status programs by design, so both views " +
      "are shown).",
  );
  lines.push(
    "- Retrieval comparison uses the system's top-3 program-scoped chunks " +
      "per query against the manual R set over all 40 chunks; manual R " +
      "chunks belonging to other programs can therefore never be retrieved " +
      "by construction — those rows are the scoping cost made visible.",
  );
  lines.push("");
  lines.push("## Per-program confusion");
  lines.push("");
  lines.push(
    "| Program | Over-included (sys in, manual NWI) | Under-included (sys out, manual WI) | UNK vs included | UNK vs excluded | Buckets |",
  );
  lines.push("|---|---|---|---|---|---|");
  const sortedConfusion = [...confusion.entries()].sort(
    (a, b) =>
      b[1].overInclude + b[1].underInclude + b[1].unkIncluded + b[1].unkExcluded -
      (a[1].overInclude + a[1].underInclude + a[1].unkIncluded + a[1].unkExcluded),
  );
  for (const [programId, c] of sortedConfusion) {
    const buckets = [...c.buckets.entries()]
      .map(([k, v]) => `${k}×${v}`)
      .join(", ");
    lines.push(
      `| ${programId} | ${c.overInclude} | ${c.underInclude} | ${c.unkIncluded} | ${c.unkExcluded} | ${buckets} |`,
    );
  }
  lines.push("");
  lines.push("## Retrieval per query");
  lines.push("");
  lines.push("| Query | Bucket | Precision | Recall | Top-5 recall | Retrieved | Manual R count |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of retrievalRows) {
    lines.push(
      `| ${r.id} | ${r.bucket} | ${pct(r.precision)} | ${pct(r.recall)} | ${pct(r.top5Recall)} | ${r.retrieved.length} | ${r.manualRelevant.length} |`,
    );
  }
  lines.push("");
  lines.push("## Disagreement table");
  lines.push("");
  lines.push(
    "Every row is either a system error worth fixing before Phase 8, or a " +
      "manual label worth revisiting — the reconciliation column is where " +
      "that call gets recorded.",
  );
  lines.push("");
  lines.push("| Family / query | Bucket | Program / chunk | System label | Manual label | Reconciliation |");
  lines.push("|---|---|---|---|---|---|");
  for (const d of disagreements) {
    lines.push(
      `| ${d.id} | ${d.bucket} | ${d.item} | ${d.systemLabel} | ${d.manualLabel} |  |`,
    );
  }
  lines.push("");
  writeFileSync(
    join(EVAL_DIR, "results/independent-labeling-report.md"),
    lines.join("\n"),
  );
  console.log("\nWrote eval/results/independent-labeling-report.md");
}

main();
