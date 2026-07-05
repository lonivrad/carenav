import type { UnknownEntry } from "@/lib/schema/report";

export interface UnknownsPanelProps {
  unknowns: UnknownEntry[];
}

/** Surfaces missing answers explicitly — the report never guesses. */
export function UnknownsPanel({ unknowns }: UnknownsPanelProps) {
  void unknowns;
  return <section>{/* TODO */}</section>;
}
