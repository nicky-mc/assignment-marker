"use client";

import { useState } from "react";
import ResultCard from "@/components/ResultCard";
import { EXAMPLE_RESULT } from "@/content/how-to";

// The real result card, filled with made-up data so people can see how to read one. Nothing is sent anywhere.
export default function ExampleResult() {
  const draft = [
    EXAMPLE_RESULT.feedback.recognition,
    "",
    EXAMPLE_RESULT.feedback.explanation,
    "",
    "Next steps:",
    ...EXAMPLE_RESULT.feedback.nextSteps.map((s) => `- ${s}`),
    "",
    EXAMPLE_RESULT.feedback.motivation,
  ].join("\n");
  const [text, setText] = useState(draft);
  const [copied, setCopied] = useState(false);
  return (
    <ResultCard
      result={EXAMPLE_RESULT}
      editableFeedback={text}
      onFeedbackChange={setText}
      aiDraft={draft}
      onCopy={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      copied={copied}
    />
  );
}
