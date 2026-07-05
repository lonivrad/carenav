import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Minimal .env.local loader for scripts and tests run outside Next.js
 * (which loads env files itself). Never overrides variables already set.
 */
export function loadEnvLocal(rootDir: string = process.cwd()): void {
  const file = path.join(rootDir, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
