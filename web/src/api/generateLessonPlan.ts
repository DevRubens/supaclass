import { supabase } from "../lib/supabase";

export type LessonPayload = {
  subject: string;
  topic: string;
  grade: string;
  durationMinutes: number;
  bnccCode?: string | null;
  resources?: string | null;
  language?: "pt-BR" | "en-US";
};

export type LessonPlan = {
  plan: {
    title: string;
    summary: string;
    playfulIntro: string;
    bnccLearningObjective: string;
    objectives: string[];
    activities: { step: string; details: string }[];
    assessmentRubric: {
      criterion: string;
      indicators: { excellent: string; good: string; developing: string };
    }[];
    bnccCode: string | null;
    resources: string | null;
    metadata: {
      topic: string;
      grade: string;
      durationMinutes: number;
      subject: string | null;
      language: "pt-BR" | "en-US";
    };
  };
};

export async function generateLessonPlan(payload: LessonPayload) {
  if (!payload.topic?.trim() || !payload.grade?.trim()) {
    throw new Error("Preencha o tópico e o ano/série.");
  }
  if (!payload.durationMinutes || payload.durationMinutes <= 0) {
    throw new Error("A duração deve ser maior que 0.");
  }

  const { data, error } = await supabase.functions.invoke(
    "generate-lesson-plan",
    {
      body: {
        subject: payload.subject,
        topic: payload.topic,
        grade: payload.grade,
        durationMinutes: Number(payload.durationMinutes),
        bnccCode: payload.bnccCode?.toString() || null,
        resources: payload.resources?.toString() || null,
        language: payload.language ?? "pt-BR",
      },
    }
  );

  if (error) {
    throw new Error(error.message || "Falha ao invocar a função.");
  }
  return data as LessonPlan;
}
