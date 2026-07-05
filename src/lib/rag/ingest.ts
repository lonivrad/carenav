import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VoyageAIClient } from "voyageai";

import { loadEnvLocal } from "./local-env";

/**
 * Layer 2 build step (npm run ingest): chunk the curated corpus by heading
 * section, embed with Voyage AI, and write the prebuilt vector index to
 * src/lib/rag/index.json. Runs offline at build time — runtime retrieval
 * reads the committed index and never fetches external content.
 */

export const EMBEDDING_MODEL = "voyage-3.5";

/** Approximate section size targets, in tokens (~4 chars/token). */
const MIN_SECTION_TOKENS = 150;
const MAX_SECTION_TOKENS = 600;

export interface CorpusChunk {
  chunkId: string;
  programId: string;
  documentId: string;
  docPath: string;
  heading: string;
  sourceUrls: string[];
  text: string;
  embedding: number[];
}

export interface VectorIndex {
  version: number;
  embeddingModel: string;
  dimensions: number;
  createdAt: string;
  chunks: CorpusChunk[];
}

interface DocMeta {
  programId: string;
  programName: string;
  sourceUrls: string[];
}

interface Section {
  heading: string;
  text: string;
}

const approxTokens = (s: string): number => Math.ceil(s.length / 4);

export function parseFrontmatter(raw: string): { meta: DocMeta; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  if (!match) throw new Error("corpus doc is missing frontmatter");
  const yaml = match[1];
  const programId = /^programId:\s*(.+)$/m.exec(yaml)?.[1]?.trim();
  const programName = /^programName:\s*(.+)$/m.exec(yaml)?.[1]?.trim();
  const sourceUrls = [...yaml.matchAll(/^\s*-\s*(https?:\/\/\S+)\s*$/gm)].map(
    (m) => m[1],
  );
  if (!programId || !programName || sourceUrls.length === 0) {
    throw new Error("corpus frontmatter must include programId, programName, sources");
  }
  return {
    meta: { programId, programName, sourceUrls },
    body: raw.slice(match[0].length),
  };
}

/** Split a doc body into `## `-heading sections; the preamble becomes "Overview". */
function splitByHeading(body: string): Section[] {
  const parts = body.split(/\n(?=## )/);
  return parts
    .map((part) => {
      const trimmed = part.trim();
      if (trimmed.startsWith("## ")) {
        const newline = trimmed.indexOf("\n");
        const heading = trimmed.slice(3, newline === -1 ? undefined : newline).trim();
        return { heading, text: trimmed };
      }
      return { heading: "Overview", text: trimmed };
    })
    .filter((s) => s.text.length > 0);
}

/** Merge undersized sections forward so chunks stay near the 300–600 token target. */
function mergeSmall(sections: Section[]): Section[] {
  const merged: Section[] = [];
  for (const section of sections) {
    const prev = merged[merged.length - 1];
    const sectionIsSmall = approxTokens(section.text) < MIN_SECTION_TOKENS;
    const prevIsSmall = prev !== undefined && approxTokens(prev.text) < MIN_SECTION_TOKENS;
    if (prev && (sectionIsSmall || prevIsSmall)) {
      prev.heading = `${prev.heading} / ${section.heading}`;
      prev.text = `${prev.text}\n\n${section.text}`;
    } else {
      merged.push({ ...section });
    }
  }
  return merged;
}

/** Split oversized sections at paragraph boundaries near the middle. */
function splitLarge(section: Section): Section[] {
  if (approxTokens(section.text) <= MAX_SECTION_TOKENS) return [section];
  const paragraphs = section.text.split(/\n\n+/);
  if (paragraphs.length < 2) return [section];
  // Split at the paragraph boundary whose left half is closest to the middle,
  // so neither side degenerates to a tiny fragment.
  const half = Math.ceil(section.text.length / 2);
  let acc = 0;
  let splitAt = 1;
  let bestDiff = Infinity;
  for (let i = 0; i < paragraphs.length - 1; i++) {
    acc += paragraphs[i].length + 2;
    const diff = Math.abs(acc - half);
    if (diff < bestDiff) {
      bestDiff = diff;
      splitAt = i + 1;
    }
  }
  const first: Section = {
    heading: `${section.heading} (part 1)`,
    text: paragraphs.slice(0, splitAt).join("\n\n"),
  };
  const second: Section = {
    heading: `${section.heading} (part 2)`,
    text: paragraphs.slice(splitAt).join("\n\n"),
  };
  return [...splitLarge(first), ...splitLarge(second)].map((s, _, arr) =>
    arr.length === 1 ? { ...s, heading: section.heading } : s,
  );
}

export function chunkDocument(raw: string): { meta: DocMeta; sections: Section[] } {
  const { meta, body } = parseFrontmatter(raw);
  const sections = mergeSmall(splitByHeading(body)).flatMap(splitLarge);
  return { meta, sections };
}

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Small batches + backoff keep the one-time ingest under Voyage's free-tier
// rate limits (~3 requests and 10K tokens per minute for new keys).
async function embedBatched(
  client: VoyageAIClient,
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  const embeddings: number[][] = [];
  const BATCH = 16;
  const MAX_ATTEMPTS = 6;
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    let attempt = 0;
    for (;;) {
      try {
        const res = await client.embed({
          input: batch,
          model: EMBEDDING_MODEL,
          inputType,
        });
        const data = res.data ?? [];
        if (data.length !== batch.length) {
          throw new Error(`Voyage returned ${data.length} embeddings for ${batch.length} inputs`);
        }
        for (const item of data) {
          if (!item.embedding) throw new Error("Voyage returned an empty embedding");
          embeddings.push(item.embedding);
        }
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const rateLimited = message.includes("429") || /rate/i.test(message);
        attempt += 1;
        if (!rateLimited || attempt >= MAX_ATTEMPTS) throw err;
        const waitMs = 25_000 * attempt;
        console.log(`  rate limited; retrying batch in ${waitMs / 1000}s (attempt ${attempt}/${MAX_ATTEMPTS})`);
        await sleep(waitMs);
      }
    }
    if (i + BATCH < texts.length) await sleep(21_000);
    console.log(`  embedded ${Math.min(i + BATCH, texts.length)}/${texts.length} chunks`);
  }
  return embeddings;
}

export async function ingestCorpus(rootDir: string = process.cwd()): Promise<VectorIndex> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");
  const client = new VoyageAIClient({ apiKey });

  const dataDir = path.join(rootDir, "src", "data");
  const manifest = JSON.parse(
    readFileSync(path.join(dataDir, "corpus-manifest.json"), "utf8"),
  ) as { documents: { id: string; file: string }[] };

  const pending: Omit<CorpusChunk, "embedding">[] = [];
  for (const doc of manifest.documents) {
    const docPath = path.posix.join("src/data", doc.file);
    const raw = readFileSync(path.join(dataDir, doc.file), "utf8");
    const { meta, sections } = chunkDocument(raw);
    if (meta.programId !== doc.id) {
      throw new Error(`manifest id ${doc.id} != frontmatter programId ${meta.programId}`);
    }
    sections.forEach((section, i) => {
      pending.push({
        chunkId: `${doc.id}#${String(i).padStart(2, "0")}-${slug(section.heading)}`,
        programId: meta.programId,
        documentId: doc.id,
        docPath,
        heading: section.heading,
        sourceUrls: meta.sourceUrls,
        text: section.text,
      });
    });
  }

  const embeddings = await embedBatched(
    client,
    pending.map((c) => c.text),
    "document",
  );

  const chunks: CorpusChunk[] = pending.map((c, i) => ({
    ...c,
    embedding: embeddings[i],
  }));

  return {
    version: 1,
    embeddingModel: EMBEDDING_MODEL,
    dimensions: chunks[0]?.embedding.length ?? 0,
    createdAt: new Date().toISOString().slice(0, 10),
    chunks,
  };
}

/* CLI entry: npm run ingest */
const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  loadEnvLocal();
  ingestCorpus()
    .then((index) => {
      const out = path.join(process.cwd(), "src", "lib", "rag", "index.json");
      writeFileSync(out, JSON.stringify(index));
      const perProgram = new Map<string, number>();
      for (const c of index.chunks) {
        perProgram.set(c.programId, (perProgram.get(c.programId) ?? 0) + 1);
      }
      console.log(`Wrote ${index.chunks.length} chunks (${index.dimensions}d, ${index.embeddingModel}) to ${out}`);
      for (const [id, n] of perProgram) console.log(`  ${id}: ${n} chunks`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
