/**
 * Phase 7.5, step 2 — blind worksheets.
 *
 * Generates, into eval/worksheets/:
 *   - README.md                — blind-fill protocol
 *   - chunk-reference.md       — all corpus chunks, full text (Task B reading)
 *   - family-<id>.md           — one per subset family: attributes + 12-program
 *                                three-way checklist with why-lines (Task A)
 *   - query-<nn>-<...>.md      — one per Task B pick: verbatim query + 40-chunk
 *                                relevant/not-relevant checklist
 *
 * Independence: this script reads families.json (attributes + bucket only),
 * corpus-manifest.json (program list), the RAG index (chunk text — the corpus
 * in chunked form), and ONLY the verbatim query strings from the sealed
 * snapshot. It does not import src/lib/rules/, does not read ground-truth
 * labels from families.json, and prints no system output on any worksheet.
 *
 * Run: npx tsx eval/phase75/make-worksheets.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SUBSET_IDS, QUERY_PICKS } from "./subset";

const EVAL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(EVAL_DIR, "worksheets");

interface RawFamily {
  id: string;
  category: string;
  intake: Record<string, unknown>;
}

interface ManifestDoc {
  id: string;
  name: string;
}

interface IndexChunk {
  chunkId: string;
  programId: string;
  heading: string;
  text: string;
}

const LABELS: Record<string, string> = {
  careRecipientAge: "Age of person needing care",
  county: "Washington county",
  livingSituation: "Living situation",
  adlsNeedingHelp: "Daily activities needing help",
  diagnosisCategory: "Diagnosis",
  isVeteran: "Veteran",
  serviceEra: "Service era",
  dischargeType: "Discharge type",
  maritalStatus: "Marital status",
  monthlyIncomeBracket: "Monthly income bracket",
  countableAssetsBracket: "Countable assets bracket",
  homeOwnership: "Home ownership",
  currentInsurance: "Current coverage",
  recentRelocation: "Moved to WA in past 5 years",
  waCaresParticipation: "WA Cares participation",
  additionalNotes: "Family note (free text)",
};

function fmtValue(v: unknown): string {
  if (v === undefined) return "—";
  if (Array.isArray(v)) return v.length === 0 ? "none of the listed" : v.join(", ");
  if (v === "unknown" || v === "prefer_not_to_say") return `(declined: ${v})`;
  return String(v);
}

function familySheet(family: RawFamily, programs: ManifestDoc[]): string {
  const lines: string[] = [];
  lines.push(`# Worksheet A — ${family.id}`);
  lines.push("");
  lines.push(`Bucket: **${family.category}**`);
  lines.push("");
  lines.push("## Family attributes");
  lines.push("");
  lines.push("| Attribute | Answer |");
  lines.push("|---|---|");
  for (const [key, label] of Object.entries(LABELS)) {
    if (key in family.intake || key === "additionalNotes") {
      const value = fmtValue(family.intake[key]);
      lines.push(`| ${label} | ${value.replace(/\|/g, "\\|")} |`);
    }
  }
  lines.push("");
  lines.push("## Program judgments");
  lines.push("");
  lines.push(
    "Read the 12 corpus docs in `src/data/corpus/` against the attributes " +
      "above. For each program write exactly one label in the Label column:",
  );
  lines.push("");
  lines.push("- `WI` — worth-investigating");
  lines.push("- `NWI` — not-worth-investigating");
  lines.push(
    "- `UNK` — unknown-need-more-info (the docs plus these attributes do not settle it)",
  );
  lines.push("");
  lines.push("| Program | Label (WI / NWI / UNK) | Why (one line) |");
  lines.push("|---|---|---|");
  for (const p of programs) {
    lines.push(`| ${p.id} — ${p.name.replace(/\|/g, "\\|")} |  |  |`);
  }
  lines.push("");
  return lines.join("\n");
}

function querySheet(
  n: number,
  pick: { caseId: string; programId: string },
  query: string,
  chunks: IndexChunk[],
): { filename: string; content: string } {
  const nn = String(n).padStart(2, "0");
  const filename = `query-${nn}-${pick.caseId}-${pick.programId}.md`;
  const lines: string[] = [];
  lines.push(`# Worksheet B — query ${nn}`);
  lines.push("");
  lines.push(`Family: ${pick.caseId} · Program: ${pick.programId}`);
  lines.push("");
  lines.push("## Query (verbatim, as the system embedded it)");
  lines.push("");
  lines.push("```");
  lines.push(query);
  lines.push("```");
  lines.push("");
  lines.push("## Chunk relevance");
  lines.push("");
  lines.push(
    "Read each chunk's full text in `chunk-reference.md` and judge it " +
      "against the query above. Write `R` (relevant) or `NR` (not relevant) " +
      "for every chunk — leave none blank. Judge by reading the chunk, not " +
      "by guessing what a retriever would do.",
  );
  lines.push("");
  lines.push("| Chunk | Heading | R / NR |");
  lines.push("|---|---|---|");
  for (const c of chunks) {
    lines.push(`| ${c.chunkId} | ${c.heading.replace(/\|/g, "\\|")} |  |`);
  }
  lines.push("");
  return { filename, content: lines.join("\n") };
}

function chunkReference(chunks: IndexChunk[]): string {
  const lines: string[] = [];
  lines.push("# Chunk reference — full text of every corpus chunk");
  lines.push("");
  lines.push(
    "Shared reading material for the Worksheet B relevance sheets. " +
      "Chunks are the corpus docs in `src/data/corpus/`, split by heading.",
  );
  lines.push("");
  for (const c of chunks) {
    lines.push(`## ${c.chunkId}`);
    lines.push("");
    lines.push(`*Program: ${c.programId} · Heading: ${c.heading}*`);
    lines.push("");
    lines.push(c.text.trim());
    lines.push("");
    lines.push("---");
    lines.push("");
  }
  return lines.join("\n");
}

function readme(familyCount: number, queryCount: number, chunkCount: number): string {
  return `# Phase 7.5 blind worksheets

${familyCount} family worksheets (Task A) and ${queryCount} query relevance
sheets (Task B) over ${chunkCount} corpus chunks.

## Blind-fill protocol — read before starting

1. Fill every worksheet BEFORE looking at any system output for that family
   or query. Do not open \`.system-retrieval-snapshot.json\`, any report in
   \`eval/results/\`, or the app itself while filling. Seeing the system's
   answer first anchors your judgment and destroys the independence this
   exercise exists to establish.
2. Task A (family-*.md): for each family, read the 12 corpus docs
   (\`src/data/corpus/\`) against the attributes table and mark every program
   WI / NWI / UNK with a one-line why. UNK is a real answer — use it whenever
   the docs plus the attributes do not settle the question.
3. Task B (query-*.md): for each query, read all chunks in
   \`chunk-reference.md\` and mark every row R or NR. Relevance means "this
   chunk's text helps answer this query," decided by reading — never by
   whether a retriever would plausibly return it.
4. Do not consult \`src/lib/rules/\` or any CareNav code while labeling. The
   corpus docs are the only source of truth.
5. When every sheet is filled, say the word — labels lock at that point and
   only then does the comparison script run.
`;
}

function main() {
  const families = (
    JSON.parse(readFileSync(join(EVAL_DIR, "testset/families.json"), "utf8")) as {
      cases: RawFamily[];
    }
  ).cases;
  const manifest = JSON.parse(
    readFileSync(join(EVAL_DIR, "../src/data/corpus-manifest.json"), "utf8"),
  ) as { documents: ManifestDoc[] };
  const index = JSON.parse(
    readFileSync(join(EVAL_DIR, "../src/lib/rag/index.json"), "utf8"),
  ) as { chunks: IndexChunk[] };
  const snapshot = JSON.parse(
    readFileSync(join(OUT_DIR, ".system-retrieval-snapshot.json"), "utf8"),
  ) as { families: { caseId: string; queries: Record<string, string> }[] };

  const programs = manifest.documents.map((d) => ({ id: d.id, name: d.name }));
  const chunks = [...index.chunks].sort((a, b) =>
    a.chunkId.localeCompare(b.chunkId),
  );

  mkdirSync(OUT_DIR, { recursive: true });

  let familyCount = 0;
  for (const id of SUBSET_IDS) {
    const fam = families.find((f) => f.id === id);
    if (!fam) throw new Error(`subset family missing: ${id}`);
    writeFileSync(join(OUT_DIR, `family-${id}.md`), familySheet(fam, programs));
    familyCount++;
  }

  let queryCount = 0;
  QUERY_PICKS.forEach((pick, i) => {
    const snap = snapshot.families.find((f) => f.caseId === pick.caseId);
    const query = snap?.queries[pick.programId];
    if (!query) throw new Error(`no captured query for ${pick.caseId}/${pick.programId}`);
    const { filename, content } = querySheet(i + 1, pick, query, chunks);
    writeFileSync(join(OUT_DIR, filename), content);
    queryCount++;
  });

  writeFileSync(join(OUT_DIR, "chunk-reference.md"), chunkReference(chunks));
  writeFileSync(
    join(OUT_DIR, "README.md"),
    readme(familyCount, queryCount, chunks.length),
  );

  console.log(
    `Wrote ${familyCount} family worksheets, ${queryCount} query sheets, ` +
      `chunk-reference.md (${chunks.length} chunks), README.md → eval/worksheets/`,
  );
}

main();
