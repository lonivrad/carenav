import { beforeAll, describe, expect, it } from "vitest";

import rawIndex from "@/lib/rag/index.json";
import type { VectorIndex } from "@/lib/rag/ingest";
import { loadEnvLocal } from "@/lib/rag/local-env";
import {
  buildProgramQuery,
  retrieveForPrograms,
  scoreAgainstIndex,
  DEFAULT_TOP_K,
  RETRIEVAL_SCORE_THRESHOLD,
} from "@/lib/rag/retrieve";
import type { Profile } from "@/lib/schema/profile";

const index = rawIndex as unknown as VectorIndex;

const veteranProfile: Profile = {
  state: "WA",
  age: 79,
  county: "Pierce",
  livingSituation: "own_home",
  adlsNeedingHelp: ["bathing", "dressing", "mobility"],
  adlHelpCount: 3,
  diagnosisCategory: ["parkinsons"],
  veteran: { isVeteran: true, serviceEra: "vietnam", dischargeType: "honorable" },
  maritalStatus: "widowed",
  monthlyIncomeBracket: "1000_to_2999",
  countableAssetsBracket: "2000_to_85000",
  ownsHome: true,
  insurance: {
    medicare: true,
    medicaid: false,
    ltcInsurance: false,
    privateInsurance: false,
  },
  recentRelocation: false,
  waCaresParticipation: "not_contributing",
};

const ALL_PROGRAM_IDS = [
  "wa-medicaid-copes",
  "wa-medicaid-cfc",
  "wa-apple-health-ltc",
  "wa-cares-fund",
  "va-aid-attendance",
  "va-housebound",
  "medicare-home-health",
  "medicare-snf",
  "wa-pace",
  "wa-tsoa",
  "wa-mac",
  "wa-respite-care",
];

describe("committed index structure", () => {
  it("contains chunks for all 12 programs with full provenance", () => {
    const programIds = new Set(index.chunks.map((c) => c.programId));
    for (const id of ALL_PROGRAM_IDS) expect(programIds).toContain(id);
    for (const chunk of index.chunks) {
      expect(chunk.chunkId).toBeTruthy();
      expect(chunk.docPath).toMatch(/^src\/data\/corpus\//);
      expect(chunk.heading).toBeTruthy();
      expect(chunk.sourceUrls.length).toBeGreaterThan(0);
      expect(chunk.text.length).toBeGreaterThan(0);
      expect(chunk.embedding).toHaveLength(index.dimensions);
    }
  });

  it("keeps chunks near the 300–600 token target (hard bounds 75–700)", () => {
    for (const chunk of index.chunks) {
      const tokens = Math.ceil(chunk.text.length / 4);
      expect(tokens).toBeGreaterThan(75);
      expect(tokens).toBeLessThan(700);
    }
  });
});

describe("retrieveForPrograms (deterministic, injected embedder)", () => {
  const chunkFor = (programId: string) =>
    index.chunks.find((c) => c.programId === programId)!;

  it("returns top-k chunks scoped to each requested program", async () => {
    // Query embedding = an actual VA chunk embedding → that chunk must rank
    // first within its program, and scoping must keep other programs out.
    const vaChunk = chunkFor("va-aid-attendance");
    const results = await retrieveForPrograms(
      ["va-aid-attendance"],
      veteranProfile,
      { embedQueries: async () => [vaChunk.embedding] },
    );
    expect(results).toHaveLength(1);
    const result = results[0];
    if (result.status !== "ok") throw new Error("expected ok retrieval");
    expect(result.chunks.length).toBeLessThanOrEqual(DEFAULT_TOP_K);
    expect(result.chunks[0].chunkId).toBe(vaChunk.chunkId);
    expect(result.chunks[0].score).toBeCloseTo(1, 5);
    for (const c of result.chunks) expect(c.programId).toBe("va-aid-attendance");
  });

  it("returns every chunk of a >3-chunk program in score order (top-k covers whole docs)", async () => {
    // wa-tsoa has 5 chunks — the Phase 7.5 truncation case. With k=5 the
    // whole doc comes back, ordered by score, with the guard still intact.
    const tsoaChunks = index.chunks.filter((c) => c.programId === "wa-tsoa");
    expect(tsoaChunks.length).toBeGreaterThan(3); // precondition for the test
    const results = await retrieveForPrograms(["wa-tsoa"], veteranProfile, {
      embedQueries: async () => [tsoaChunks[0].embedding],
    });
    const result = results[0];
    if (result.status !== "ok") throw new Error("expected ok retrieval");
    expect(result.chunks).toHaveLength(tsoaChunks.length);
    expect(new Set(result.chunks.map((c) => c.chunkId))).toEqual(
      new Set(tsoaChunks.map((c) => c.chunkId)),
    );
    for (let i = 1; i < result.chunks.length; i++) {
      expect(result.chunks[i - 1].score).toBeGreaterThanOrEqual(
        result.chunks[i].score,
      );
    }
  });

  it("still honors an explicit smaller topK option", async () => {
    const tsoaChunks = index.chunks.filter((c) => c.programId === "wa-tsoa");
    const results = await retrieveForPrograms(["wa-tsoa"], veteranProfile, {
      embedQueries: async () => [tsoaChunks[0].embedding],
      topK: 2,
    });
    const result = results[0];
    if (result.status !== "ok") throw new Error("expected ok retrieval");
    expect(result.chunks).toHaveLength(2);
  });

  it("scopes each program to its own docs even with an off-topic query", async () => {
    const waCaresChunk = chunkFor("wa-cares-fund");
    const results = await retrieveForPrograms(
      ["wa-cares-fund", "wa-mac"],
      veteranProfile,
      {
        embedQueries: async () => [waCaresChunk.embedding, waCaresChunk.embedding],
        // Disable the guard so scoping itself is what's under test.
        threshold: -1,
      },
    );
    const [waCares, mac] = results;
    if (waCares.status !== "ok" || mac.status !== "ok") throw new Error("expected ok");
    expect(waCares.chunks[0].chunkId).toBe(waCaresChunk.chunkId);
    for (const c of mac.chunks) expect(c.programId).toBe("wa-mac");
  });

  it("returns retrieval_failed instead of weak chunks when best score is below threshold", async () => {
    // Negating a real embedding produces strongly negative similarity to it
    // and near-inverted similarity everywhere else — nothing should pass.
    const negated = chunkFor("wa-tsoa").embedding.map((x) => -x);
    const results = await retrieveForPrograms(["wa-tsoa"], veteranProfile, {
      embedQueries: async () => [negated],
    });
    expect(results[0]).toEqual({
      programId: "wa-tsoa",
      status: "retrieval_failed",
      bestScore: expect.any(Number),
    });
    if (results[0].status === "retrieval_failed") {
      expect(results[0].bestScore).toBeLessThan(RETRIEVAL_SCORE_THRESHOLD);
    }
  });

  it("returns retrieval_failed with null score for a program with no chunks", async () => {
    const anyEmbedding = index.chunks[0].embedding;
    const results = await retrieveForPrograms(
      ["no-such-program"],
      veteranProfile,
      { embedQueries: async () => [anyEmbedding] },
    );
    expect(results[0]).toEqual({
      programId: "no-such-program",
      status: "retrieval_failed",
      bestScore: null,
    });
  });

  it("returns an empty result set for an empty program list without embedding", async () => {
    const results = await retrieveForPrograms([], veteranProfile, {
      embedQueries: async () => {
        throw new Error("must not be called");
      },
    });
    expect(results).toEqual([]);
  });

  it("builds queries that include known profile facts and skip unknowns", () => {
    const q = buildProgramQuery("va-aid-attendance", veteranProfile);
    expect(q).toContain("79-year-old");
    expect(q).toContain("veteran");
    expect(q).toContain("va aid attendance");
    expect(q).not.toContain("unknown");
  });
});

/**
 * Live smoke test — requires VOYAGE_API_KEY (loaded from .env.local).
 * Embeds a real query for a veteran profile and checks that, across the
 * WHOLE index (no program scoping), VA chunks rank at the top.
 */
beforeAll(() => loadEnvLocal());

describe.skipIf(!hasEnvLocalKey())("live retrieval smoke (Voyage API)", () => {
  it("ranks VA chunks top across the whole index for a veteran profile query", async () => {
    const results = await retrieveForPrograms(
      ["va-aid-attendance"],
      veteranProfile,
    );
    const result = results[0];
    if (result.status !== "ok") {
      throw new Error(`retrieval failed (bestScore=${result.bestScore})`);
    }
    expect(result.chunks[0].documentId).toBe("va-aid-attendance");
    expect(result.chunks[0].score).toBeGreaterThanOrEqual(
      RETRIEVAL_SCORE_THRESHOLD,
    );

    // Unscoped ranking: embed the same query, score every chunk in the
    // index, and confirm the top hit is a VA pension document.
    const query = buildProgramQuery("va-aid-attendance", veteranProfile);
    const { VoyageAIClient } = await import("voyageai");
    const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY! });
    const res = await client.embed({
      input: [query],
      model: index.embeddingModel,
      inputType: "query",
    });
    const embedding = res.data?.[0]?.embedding as number[];
    const ranked = scoreAgainstIndex(embedding);
    expect(["va-aid-attendance", "va-housebound"]).toContain(
      ranked[0].documentId,
    );
  }, 30_000);
});

function hasEnvLocalKey(): boolean {
  loadEnvLocal();
  return Boolean(process.env.VOYAGE_API_KEY);
}
