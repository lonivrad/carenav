export interface UnknownsPanelProps {
  unknowns: string[];
}

/** Surfaces missing answers explicitly — the report never guesses. */
export function UnknownsPanel({ unknowns }: UnknownsPanelProps) {
  void unknowns;
  return <section>{/* TODO */}</section>;
}
