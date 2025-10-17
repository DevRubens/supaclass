import React, { useMemo, useState } from "react";
import {
  generateLessonPlan,
  LessonPayload,
  LessonPlan,
} from "../api/generateLessonPlan";

type Props = { onResult: (plan: LessonPlan["plan"]) => void };

const subjects = [
  "Língua Portuguesa",
  "Literatura",
  "Redação",
  "Língua Inglesa",
  "Arte",
  "Educação Física",
  "Matemática",
  "Ciências",
  "Biologia",
  "Física",
  "Química",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Ensino Religioso",
  "Espanhol",
  "Tecnologia e Robótica",
  "Educação Financeira",
  "Projeto de Vida",
];

const grades = [
  "1º ano",
  "2º ano",
  "3º ano",
  "4º ano",
  "5º ano",
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
  "1º EM",
  "2º EM",
  "3º EM",
];

export default function LessonForm({ onResult }: Props) {
  const [subject, setSubject] = useState("Matemática");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("6º ano");
  const [duration, setDuration] = useState(50);
  const [bncc, setBncc] = useState("");
  const [resources, setResources] = useState("");
  const [lang, setLang] = useState<"pt-BR" | "en-US">("pt-BR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () =>
      topic.trim().length > 0 &&
      grade.trim().length > 0 &&
      duration > 0 &&
      !loading,
    [topic, grade, duration, loading]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: LessonPayload = {
        subject,
        topic: topic.trim(),
        grade,
        durationMinutes: Number(duration),
        bnccCode: bncc.trim() || null,
        resources: resources.trim() || null,
        language: lang,
      };
      const data = await generateLessonPlan(payload);
      onResult(data.plan);
    } catch (err: any) {
      setError(err?.message || "Erro ao gerar plano.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <div className="card-header">
        <h2>Gerador de Plano de Aula (Supabase + Gemini)</h2>
        <p>
          Formulário simples + IA poderosa = plano de aula pronto para exportar
          em PDF.
        </p>
      </div>

      <div className="form-bar">
        <div className="form-item small">
          <label>Disciplina</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-item">
          <label>Tópico</label>
          <input
            type="text"
            placeholder="Ex.: Equações do 1º grau"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
        </div>

        <div className="form-item small">
          <label>Ano/Série</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          >
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="form-item small">
          <label>Duração (min)</label>
          <div className="range-inline">
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
            <span className="badge">{duration} min</span>
          </div>
        </div>

        <div className="form-item small">
          <label>Idioma</label>
          <select value={lang} onChange={(e) => setLang(e.target.value as any)}>
            <option value="pt-BR">Português</option>
            <option value="en-US">English</option>
          </select>
        </div>

        <div className="form-item">
          <label>BNCC (opcional)</label>
          <input
            type="text"
            placeholder="Ex.: EF09MA01 — se informado, os objetivos/atividades serão alinhados a este código."
            value={bncc}
            onChange={(e) => setBncc(e.target.value)}
          />
        </div>

        <div className="form-item wide full">
          <label>Recursos (opcional)</label>
          <textarea
            placeholder="Liste recursos específicos (ex.: livro X cap. 3, projetor, laboratório) — a IA usará isso no plano."
            rows={2}
            value={resources}
            onChange={(e) => setResources(e.target.value)}
          />
        </div>

        <div className="actions-right">
          <button className="btn-primary" type="submit" disabled={!canSubmit}>
            {loading ? <span className="spinner" /> : "Gerar plano com IA"}
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
    </form>
  );
}
