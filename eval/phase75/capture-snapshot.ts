/**
 * Phase 7.5, step 1 — sealed system-side snapshot.
 *
 * Re-derives, for the stratified subset of families, exactly what the system
 * retrieved: the verbatim per-program query strings and the ranked chunk
 * lists. The programs queried per family are taken from the recorded Phase 7
 * reports (report.programs equals the surviving candidate set by cross-check
 * construction) — this script does NOT import src/lib/rules/.
 *
 * The output file is the SYSTEM side of the later comparison. It is sealed:
 * the operator must not open it until all worksheets are filled and locked.
 *
 * Run: npx tsx eval/phase75/capture-snapshot.ts
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildProgramQuery,
  retrieveForPrograms,
} from "@/lib/rag/retrieve";
import { loadEnvLocal } from "@/lib/rag/local-env";
import { normalize } from "@/lib/schema/normalize";
import type { Report } from "@/lib/schema/report";

import { SUBSET_IDS, QUERY_PICKS } from "./subset";
import type { EvalCase } from "../testset/generate";

loadEnvLocal();

const EVAL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const families = (
    JSON.parse(
      readFileSync(join(EVAL_DIR, "testset/families.json"), "utf8"),
    ) as { cases: EvalCase[] }
  ).cases;
  const runLatest = JSON.parse(
    readFileSync(join(EVAL_DIR, "results/run-latest.json"), "utf8"),
  ) as { systemRecords: { caseId: string; ok: boolean; report?: Report }[] };

  const indexRaw = readFileSync(join(EVAL_DIR, "../src/lib/rag/index.json"));
  const indexSha256 = createHash("sha256").update(indexRaw).digest("hex");

  const subset = SUBSET_IDS.map((id) => {
    const fam = families.find((f) => f.id === id);
    if (!fam) throw new Error(`subset family not in families.json: ${id}`);
    return fam;
  });

  const perFamily = [];
  for (const fam of subset) {
    const rec = runLatest.systemRecords.find((r) => r.caseId === fam.id);
    if (!rec?.ok || !rec.report) throw new Error(`no recorded report for ${fam.id}`);
    // The report's program list IS the queried candidate set (cross-checked).
    const programIds = rec.report.programs.map((p) => p.programId);
    const profile = normalize(fam.intake);
    const queries = Object.fromEntries(
      programIds.map((id) => [id, buildProgramQuery(id, profile)]),
    );
    const retrievals = await retrieveForPrograms(programIds, profile);
    perFamily.push({
      caseId: fam.id,
      bucket: fam.category,
      systemProgramSet: rec.report.programs.map((p) => ({
        programId: p.programId,
        relevanceLabel: p.relevanceLabel,
        status: p.status,
        informationStillNeeded: p.informationStillNeeded,
      })),
      reportUnknowns: rec.report.unknowns,
      queries,
      retrievals: retrievals.map((r) => ({
        programId: r.programId,
        status: r.status,
        chunks:
          r.status === "ok"
            ? r.chunks.map((c) => ({ chunkId: c.chunkId, score: c.score }))
            : [],
        bestScore: r.status === "retrieval_failed" ? r.bestScore : undefined,
      })),
    });
    console.log(`captured ${fam.id} (${programIds.length} queries)`);
  }

  // Every Task B pick must reference a query the system actually ran.
  for (const pick of QUERY_PICKS) {
    const fam = perFamily.find((f) => f.caseId === pick.caseId);
    if (!fam) throw new Error(`query pick references non-subset family ${pick.caseId}`);
    if (!(pick.programId in fam.queries)) {
      throw new Error(
        `query pick ${pick.caseId}/${pick.programId} was not queried by the system`,
      );
    }
  }

  const out = {
    capturedAt: new Date().toISOString(),
    indexSha256,
    note:
      "SEALED — system-side snapshot for Phase 7.5. Do not open until all " +
      "worksheets in eval/worksheets/ are filled and locked.",
    subsetIds: SUBSET_IDS,
    queryPicks: QUERY_PICKS,
    families: perFamily,
  };
  const outDir = join(EVAL_DIR, "worksheets");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, ".system-retrieval-snapshot.json"),
    JSON.stringify(out, null, 2) + "\n",
  );
  console.log(
    `\nSealed snapshot written: eval/worksheets/.system-retrieval-snapshot.json`,
  );
  console.log(`index.json sha256: ${indexSha256}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
