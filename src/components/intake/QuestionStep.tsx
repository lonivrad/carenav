export interface QuestionStepProps {
  questionId: string;
  prompt: string;
}

/** One step of the intake questionnaire. */
export function QuestionStep({ questionId, prompt }: QuestionStepProps) {
  return (
    <fieldset data-question={questionId}>
      <legend>{prompt}</legend>
      {/* TODO: input controls */}
    </fieldset>
  );
}
