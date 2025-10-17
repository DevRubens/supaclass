import React from "react";
import type { LessonPlan } from "../api/generateLessonPlan";
import { generateLessonPdf } from "../utils/pdf";

type Props = { plan: LessonPlan["plan"] | null };

function stripNumericPrefix(s: string) {
  return s.replace(/^\s*\d+\s*[\.\)\-–]\s*/, "").trim();
}

export default function PlanCard({ plan }: Props) {
  if (!plan) return null;

  return (
    <section className="card plan">
      <div
        className="card-header"
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: 2 }}>{plan.title}</h3>
          <p className="plan-meta">
            {plan.metadata.topic} • {plan.metadata.grade} •{" "}
            {plan.metadata.durationMinutes} min
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => generateLessonPdf(plan)}
        >
          Exportar PDF
        </button>
      </div>

      <div className="plan-row">
        <div className="plan-block">
          <h4>Introdução lúdica</h4>
          <p>{plan.playfulIntro}</p>
        </div>

        <div className="plan-block">
          <h4>Objetivo de aprendizagem (BNCC)</h4>
          <p>{plan.bnccLearningObjective}</p>
          {plan.bnccCode && (
            <p>
              <strong>Código BNCC:</strong> {plan.bnccCode}
            </p>
          )}
        </div>

        <div className="plan-block">
          <h4>Atividades</h4>
          <ol className="activities-ol">
            {plan.activities.map((a, i) => (
              <li key={i}>
                <strong>{stripNumericPrefix(a.step)}</strong>: {a.details}
              </li>
            ))}
          </ol>
        </div>

        <div className="plan-block">
          <h4>Rubrica de avaliação</h4>
          <ol className="rubric-ol">
            {plan.assessmentRubric.map((r, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>{r.criterion}</strong>
                <br />
                <em>Excelente:</em> {r.indicators.excellent}
                <br />
                <em>Bom:</em> {r.indicators.good}
                <br />
                <em>Em desenvolvimento:</em> {r.indicators.developing}
              </li>
            ))}
          </ol>
        </div>

        {(plan.bnccCode || plan.resources) && (
          <div className="plan-block">
            <h4>Complementos</h4>
            {plan.bnccCode && (
              <p>
                <strong>BNCC:</strong> {plan.bnccCode}
              </p>
            )}
            {plan.resources && (
              <p>
                <strong>Recursos:</strong> {plan.resources}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
