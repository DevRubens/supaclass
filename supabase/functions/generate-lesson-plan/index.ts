import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Body = {
  subject?: string;
  topic?: string;
  grade?: string;
  durationMinutes?: number;
  bnccCode?: string | null;
  resources?: string | null;
  language?: "pt-BR" | "en-US";
};

type AiPlan = {
  title: string;
  summary: string;
  playfulIntro: string;
  bnccLearningObjective: string;
  objectives: string[];
  activities: { step: string; details: string }[];
  assessmentRubric: {
    criterion: string;
    indicators: {
      excellent: string;
      good: string;
      developing: string;
    };
  }[];
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

function requireEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val || !val.trim()) throw new Error(`Missing env: ${name}`);
  return val;
}

function buildPrompt(p: {
  subject?: string | null;
  topic: string;
  grade: string;
  durationMinutes: number;
  bnccCode?: string | null;
  resources?: string | null;
  language: "pt-BR" | "en-US";
}) {
  const lang = p.language === "en-US" ? "English" : "Português do Brasil";
  const hasBNCC = !!(p.bnccCode && p.bnccCode.trim());
  const hasRes = !!(p.resources && p.resources.trim());

  return `
You are a lesson-plan assistant. Reply ONLY in JSON matching this TypeScript type:

type AiPlan = {
  title: string;
  summary: string;
  playfulIntro: string; // short, creative hook to start the class
  bnccLearningObjective: string; // one learning objective aligned to BNCC code when provided
  objectives: string[]; // 10-15 measurable goals (student-facing)
  activities: { step: string; details: string }[]; // 15-20 steps; UI format: "1. <step>: <details>"
  assessmentRubric: {
    criterion: string;
    indicators: { excellent: string; good: string; developing: string };
  }[];
};

Language: ${lang}

Context:
Subject: ${p.subject ?? "N/A"}
Topic: ${p.topic}
Grade: ${p.grade}
Duration: ${p.durationMinutes} minutes
BNCC provided: ${hasBNCC ? p.bnccCode : "none"}
Resources provided: ${hasRes ? p.resources : "none"}

Strict rules:
- If a BNCC code is provided, the "bnccLearningObjective" MUST be aligned to it (do not invent codes; use only the given code as reference) and activities/objectives must reflect that alignment.
- If resources are provided, USE THEM explicitly in the "playfulIntro" and/or in the activities (say how/when).
- Keep everything feasible for the duration and classroom-ready.
- Return VALID JSON only (no markdown fences or extra text).
`.trim();
}

async function callGeminiJSON(prompt: string): Promise<AiPlan> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const preferred = (Deno.env.get("GEMINI_MODEL") || "").trim();
  const candidates = [
    preferred,
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-002",
  ].filter(Boolean);

  let lastErr: unknown = null;

  for (const model of candidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6 },
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        if (res.status === 404) {
          console.warn(`Model 404 for ${model} on v1beta. Trying next…`);
          lastErr = new Error(`404 for ${model}: ${txt}`);
          continue;
        }
        throw new Error(`Gemini HTTP ${res.status}: ${txt}`);
      }

      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data ??
        "";

      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as AiPlan;

      if (
        !parsed ||
        typeof parsed.title !== "string" ||
        !Array.isArray(parsed.objectives) ||
        !Array.isArray(parsed.activities)
      ) {
        throw new Error("Gemini JSON missing required fields");
      }

      return parsed;
    } catch (e) {
      lastErr = e;
      console.warn(`Gemini call failed for model "${model}":`, e);
    }
  }

  throw lastErr ?? new Error("All Gemini model attempts failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);

  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const subject = body.subject?.trim() || null;
    const topic = body.topic?.trim();
    const grade = body.grade?.trim();
    const durationMinutes = Number(body.durationMinutes ?? 0);
    const bnccCode = body.bnccCode?.toString() || null;
    const resources = body.resources?.toString() || null;
    const language = (body.language ?? "pt-BR") as "pt-BR" | "en-US";

    if (!topic || !grade || !durationMinutes || durationMinutes <= 0) {
      return json(
        { error: "Campos obrigatórios: topic, grade, durationMinutes (>0)" },
        400
      );
    }

    const hasKey = !!(Deno.env.get("GEMINI_API_KEY") || "").trim();
    console.log("GEMINI_API_KEY set?", hasKey);
    if (!hasKey) {
      return json(
        {
          error:
            "GEMINI_API_KEY ausente na Edge Function. Configure o .env/secrets.",
        },
        500
      );
    }

    const prompt = buildPrompt({
      subject,
      topic,
      grade,
      durationMinutes,
      bnccCode,
      resources,
      language,
    });

    const ai = await callGeminiJSON(prompt);

    const plan = {
      title: ai.title,
      summary: ai.summary,
      playfulIntro: ai.playfulIntro,
      bnccLearningObjective: ai.bnccLearningObjective,
      objectives: ai.objectives,
      activities: ai.activities,
      assessmentRubric: ai.assessmentRubric,
      bnccCode,
      resources,
      metadata: { topic, grade, durationMinutes, subject, language },
    };

    return json({ ok: true, plan });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Erro interno";
    return json({ error: msg }, 500);
  }
});
