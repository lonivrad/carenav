import { VoyageAIClient } from "voyageai";

import rawIndex from "@/lib/rag/index.json";
import { EMBEDDING_MODEL, type VectorIndex } from "@/lib/rag/ingest";
import type { Profile } from "@/lib/schema/profile";

/**
 * Layer 2 runtime: retrieve passages for candidate programs from the
 * prebuilt, committed index ONLY. The single network call is embedding the
 * query text — no external content is ever fetched at runtime.
 */

const index = rawIndex as unknown as VectorIndex;

/**
 * Quality guard: if a program's best chunk scores below this cosine
 * similarity, report retrieval failure instead of returning weak chunks.
 */
export const RETRIEVAL_SCORE_THRESHOLD = 0.45;

export const DEFAULT_TOP_K = 3;

export interface RetrievedChunk {
  chunkId: string;
  programId: string;
  documentId: string;
  docPath: string;
  heading: string;
  sourceUrls: string[];
  text: string;
  score: number;
}

export type ProgramRetrieval =
  | { programId: string; status: "ok"; chunks: RetrievedChunk[] }
  | { programId: string; status: "retrieval_failed"; bestScore: number | null };

export type QueryEmbedder = (queries: string[]) => Promise<number[][]>;

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Humanize the known parts of a profile; unknown fields are simply omitted. */
export function describeProfile(profile: Profile): string {
  const parts: string[] = [];
  if (profile.age !== "unknown") parts.push(`${profile.age}-year-old`);
  parts.push("adult in Washington state");
  if (profile.county !== "unknown") parts.push(`(${profile.county} County)`);
  if (profile.livingSituation !== "unknown") {
    const living: Record<string, string> = {
      own_home: "living in their own home",
      family_home: "living in a family member's home",
      assisted_living: "living in an assisted living facility",
      adult_family_home: "living in an adult family home",
      nursing_facility: "living in a nursing facility",
      other: "in another living situation",
    };
    parts.push(living[profile.livingSituation]);
  }
  if (profile.adlsNeedingHelp !== "unknown" && profile.adlsNeedingHelp.length > 0) {
    parts.push(`needing help with ${profile.adlsNeedingHelp.join(", ")}`);
  }
  if (profile.diagnosisCategory !== "unknown" && profile.diagnosisCategory !== "none") {
    parts.push(`diagnosed with ${profile.diagnosisCategory.replace(/_/g, " ")}`);
  }
  if (profile.veteran.isVeteran === true) {
    const era =
      profile.veteran.serviceEra !== "unknown" &&
      profile.veteran.serviceEra !== "not_applicable"
        ? ` (${profile.veteran.serviceEra.replace(/_/g, " ")} era)`
        : "";
    parts.push(`a military veteran${era}`);
  }
  if (profile.maritalStatus !== "unknown") parts.push(profile.maritalStatus);
  if (profile.monthlyIncomeBracket !== "unknown") {
    const income: Record<string, string> = {
      under_1000: "monthly income under $1,000",
      "1000_to_2999": "monthly income between $1,000 and $2,999",
      "3000_to_3999": "monthly income between $3,000 and $3,999",
      "4000_or_more": "monthly income of $4,000 or more",
    };
    parts.push(income[profile.monthlyIncomeBracket]);
  }
  if (profile.countableAssetsBracket !== "unknown") {
    const assets: Record<string, string> = {
      under_2000: "countable assets under $2,000",
      "2000_to_85000": "countable assets between $2,000 and $85,000",
      "85000_to_160000": "countable assets between $85,000 and $160,000",
      "160000_or_more": "countable assets of $160,000 or more",
    };
    parts.push(assets[profile.countableAssetsBracket]);
  }
  const coverage = (
    [
      ["medicare", "Medicare"],
      ["medicaid", "Medicaid (Apple Health)"],
      ["ltcInsurance", "long-term care insurance"],
      ["privateInsurance", "private insurance"],
    ] as const
  )
    .filter(([key]) => profile.insurance[key] === true)
    .map(([, label]) => label);
  if (coverage.length > 0) parts.push(`covered by ${coverage.join(" and ")}`);
  return parts.join(", ");
}

/** Program-scoped query: family situation + the sections we want to surface. */
export function buildProgramQuery(programId: string, profile: Profile): string {
  const programName = programId.replace(/-/g, " ");
  return (
    `Eligibility criteria, covered services, application process, and required ` +
    `documentation for ${programName} for a family caring for a ` +
    `${describeProfile(profile)}.`
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const defaultEmbedder: QueryEmbedder = async (queries) => {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set");
  const client = new VoyageAIClient({ apiKey });
  // One retry after a pause absorbs free-tier per-minute rate limits.
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await client.embed({
        input: queries,
        model: EMBEDDING_MODEL,
        inputType: "query",
      });
      const data = res.data ?? [];
      if (data.length !== queries.length || data.some((d) => !d.embedding)) {
        throw new Error("Voyage returned an unexpected embedding response");
      }
      return data.map((d) => d.embedding as number[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const rateLimited = message.includes("429") || /rate/i.test(message);
      if (!rateLimited || attempt >= 2) throw err;
      await sleep(22_000);
    }
  }
};

/** Score every chunk in the index against a query embedding (all programs). */
export function scoreAgainstIndex(queryEmbedding: number[]): RetrievedChunk[] {
  return index.chunks
    .map(({ embedding, ...rest }) => ({
      ...rest,
      score: cosine(queryEmbedding, embedding),
    }))
    .sort((a, b) => b.score - a.score);
}

export interface RetrieveOptions {
  topK?: number;
  threshold?: number;
  /** Injectable for tests; defaults to Voyage AI query embeddings. */
  embedQueries?: QueryEmbedder;
}

/**
 * For each candidate program, embed a profile-derived query and return the
 * top-k chunks scoped to that program's corpus doc, with full provenance.
 * Programs whose best chunk scores below the threshold come back as
 * retrieval_failed rather than surfacing weak evidence.
 */
export async function retrieveForPrograms(
  programIds: string[],
  profile: Profile,
  opts: RetrieveOptions = {},
): Promise<ProgramRetrieval[]> {
  const topK = opts.topK ?? DEFAULT_TOP_K;
  const threshold = opts.threshold ?? RETRIEVAL_SCORE_THRESHOLD;
  const embed = opts.embedQueries ?? defaultEmbedder;

  if (programIds.length === 0) return [];
  const queries = programIds.map((id) => buildProgramQuery(id, profile));
  const embeddings = await embed(queries);

  return programIds.map((programId, i) => {
    const scoped = scoreAgainstIndex(embeddings[i]).filter(
      (c) => c.programId === programId,
    );
    const best = scoped[0]?.score ?? null;
    if (best === null || best < threshold) {
      return { programId, status: "retrieval_failed" as const, bestScore: best };
    }
    return { programId, status: "ok" as const, chunks: scoped.slice(0, topK) };
  });
}
