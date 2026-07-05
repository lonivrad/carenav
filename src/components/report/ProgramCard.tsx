import type { ProgramEntry } from "@/lib/schema/report";

export interface ProgramCardProps {
  entry: ProgramEntry;
}

/** One program that appears worth investigating. Never asserts eligibility. */
export function ProgramCard({ entry }: ProgramCardProps) {
  void entry;
  return <article>{/* TODO */}</article>;
}
