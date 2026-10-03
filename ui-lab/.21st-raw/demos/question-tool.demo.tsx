// Source: 21st.dev — "Question Tool" by @serafimcloud (demo id 12421, demo "Multiple choice")
// https://21st.dev/@serafimcloud/components/question-tool
// Install: https://21st.dev/r/serafimcloud/question-tool
"use client";

import { useState } from "react";
import { QuestionTool } from "@/components/ui/question-tool";

const questions = [
  {
    kind: "multi" as const,
    title: "What should I include?",
    options: [
      { id: "tests", label: "Tests" },
      { id: "docs", label: "Docs" },
      { id: "refactor", label: "Refactor" },
    ],
    minSelections: 1,
  },
  {
    kind: "multi" as const,
    title: "Which environments should be covered?",
    options: [
      { id: "dev", label: "Development" },
      { id: "staging", label: "Staging" },
      { id: "prod", label: "Production" },
    ],
    minSelections: 1,
  },
];

export default function Demo() {
  const [questionIndex, setQuestionIndex] = useState(1);
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-white dark:bg-neutral-950">
      <div className="w-full max-w-[420px]">
        <QuestionTool
          questions={questions}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          onPreviousQuestion={() =>
            setQuestionIndex((prev) => Math.max(1, prev - 1))
          }
          onNextQuestion={() =>
            setQuestionIndex((prev) => Math.min(totalQuestions, prev + 1))
          }
          submitLabel="Submit"
          skipLabel="Skip"
          onSubmitAnswer={(answer) => console.log(answer)}
        />
      </div>
    </div>
  );
}
