import type { Intake } from "@/lib/schema/intake";

export interface ReviewScreenProps {
  intake: Intake;
}

/** Lets the family review answers before submitting. */
export function ReviewScreen({ intake }: ReviewScreenProps) {
  void intake;
  return <section>{/* TODO */}</section>;
}
