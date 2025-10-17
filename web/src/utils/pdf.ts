import { jsPDF } from "jspdf";
import type { LessonPlan } from "../api/generateLessonPlan";

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "plano-de-aula"
  );
}

export function generateLessonPdf(plan: LessonPlan["plan"]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;

  const primary = [15, 24, 56];
  const titleBlue = [30, 60, 140];
  const text = [20, 28, 48];

  let y = margin;

  function setBodyText() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(text[0], text[1], text[2]);
  }
  function setSectionTitle() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(titleBlue[0], titleBlue[1], titleBlue[2]);
  }

  function section(title: string) {
    setSectionTitle();
    doc.text(title, margin, y);
    y += 10;
    doc.setDrawColor(220);
    doc.setLineWidth(1);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
    setBodyText();
  }

  function addHeaderOnPages() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(plan.title, margin, 28, { maxWidth: contentW });
    doc.setDrawColor(230);
    doc.line(margin, 34, pageW - margin, 34);
    y = Math.max(y, 46);
    setBodyText();
  }
  function addFooter() {
    const page = String(doc.getNumberOfPages());
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      `Supaclass • ${new Date().toLocaleDateString()}`,
      margin,
      pageH - 24
    );
    doc.text(`p. ${page}`, pageW - margin, pageH - 24, { align: "right" });
    setBodyText();
  }
  function ensureSpace(h = 0) {
    if (y + h <= pageH - margin) return;
    addFooter();
    doc.addPage();
    y = margin;
    addHeaderOnPages();
  }

  function paragraph(txt: string, size = 12, leading = 16) {
    setBodyText();
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(txt, contentW);
    lines.forEach((ln) => {
      ensureSpace(leading);
      doc.text(ln, margin, y);
      y += leading;
    });
  }

  function bulletList(items: string[], size = 12, leading = 16) {
    setBodyText();
    doc.setFontSize(size);
    items.forEach((it) => {
      const lines = doc.splitTextToSize(it, contentW - 16);
      ensureSpace(leading);
      doc.circle(margin + 3, y - 3, 1.5, "F");
      doc.text(lines[0], margin + 12, y);
      y += leading;
      for (let i = 1; i < lines.length; i++) {
        ensureSpace(leading);
        doc.text(lines[i], margin + 12, y);
        y += leading;
      }
    });
  }

  function orderedWithDetails(steps: { step: string; details: string }[]) {
    setBodyText();
    const leading = 18;
    steps.forEach((s, idx) => {
      const full = `${idx + 1}. ${s.step}: ${s.details}`;
      const lines = doc.splitTextToSize(full, contentW);
      lines.forEach((ln) => {
        ensureSpace(leading);
        doc.text(ln, margin, y);
        y += leading;
      });
    });
  }

  const padX = 16;
  const padY = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  let titleLines = doc.splitTextToSize(plan.title, contentW - padX * 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const metaText = `${plan.metadata.topic} • ${plan.metadata.grade} • ${plan.metadata.durationMinutes} min`;
  const metaLines = doc.splitTextToSize(metaText, contentW - padX * 2);

  const titleLeading = 22;
  const metaLeading = 14;
  const bannerH =
    padY * 2 +
    titleLines.length * titleLeading +
    6 +
    metaLines.length * metaLeading;

  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.roundedRect(margin, y, contentW, bannerH, 12, 12, "F");

  let ty = y + padY + 6;
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  titleLines.forEach((ln) => {
    doc.text(ln, margin + padX, ty);
    ty += titleLeading;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(210);
  metaLines.forEach((ln) => {
    doc.text(ln, margin + padX, ty);
    ty += metaLeading;
  });

  y += bannerH + 18;
  setBodyText();

  if (plan.bnccCode || plan.resources) {
    section("Informações");
    if (plan.bnccCode) paragraph(`BNCC: ${plan.bnccCode}`);
    if (plan.resources) paragraph(`Recursos: ${plan.resources}`);
    y += 6;
  }

  section("Resumo");
  paragraph(plan.summary);
  y += 6;
  section("Introdução lúdica");
  paragraph(plan.playfulIntro);
  y += 6;

  section("Objetivo de aprendizagem (BNCC)");
  paragraph(
    plan.bnccLearningObjective +
      (plan.bnccCode ? ` (Código: ${plan.bnccCode})` : "")
  );
  y += 6;

  section("Rubrica de avaliação");
  plan.assessmentRubric.forEach((r) => {
    paragraph(`• ${r.criterion}`);
    paragraph(`   Excelente: ${r.indicators.excellent}`, 11, 15);
    paragraph(`   Bom: ${r.indicators.good}`, 11, 15);
    paragraph(`   Em desenvolvimento: ${r.indicators.developing}`, 11, 15);
    y += 4;
  });

  section("Objetivos");
  bulletList(plan.objectives);
  y += 6;

  section("Atividades");
  orderedWithDetails(plan.activities);

  addFooter();
  doc.save(`${slug(plan.title)}.pdf`);
}
