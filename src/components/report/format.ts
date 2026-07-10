/**
 * Presentation-only text helpers for the report UI. These never change report
 * data — they only clean how existing strings are displayed.
 */

/**
 * Internal corpus chunk ids (e.g. "wa-medicaid-cfc#0012") occasionally leak
 * into LLM prose. Strip them from user-facing text so readers never see
 * internal identifiers — real citations are surfaced separately as [n] links.
 * Matches a hyphenated slug followed by "#digits", with optional wrapping
 * brackets/parens, then tidies the leftover whitespace and punctuation.
 */
const CHUNK_ID = /\s*[[(]?\b[a-z0-9]+(?:-[a-z0-9]+)+#\d+[\])]?/gi;

export function stripChunkIds(text: string): string {
  return text
    .replace(CHUNK_ID, "")
    .replace(/\(\s*\)|\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

/** A readable host + section label for a source URL, e.g. "hca.wa.gov · long-term-services". */
export function sourceLabel(url: string): { host: string; slug: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? "";
    const slug = last.length > 42 ? `${last.slice(0, 42)}…` : last;
    return { host, slug };
  } catch {
    return { host: url, slug: "" };
  }
}

/** Splits a dense summary into a lead sentence + the remainder, for readability. */
export function splitLead(text: string): { lead: string; rest: string } {
  const match = text.match(/^([\s\S]*?[.!?])\s+([\s\S]*)$/);
  if (!match) return { lead: text.trim(), rest: "" };
  return { lead: match[1].trim(), rest: match[2].trim() };
}
