import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AuthForm from "./components/AuthForm";
import LessonForm from "./components/LessonForm";
import PlanCard from "./components/PlanCard";
import type { LessonPlan } from "./api/generateLessonPlan";

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<LessonPlan["plan"] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
      if (!s) setPlan(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logoutTopbar() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <header className="topbar">
        <div className="brand">
          <span className="logo">📘</span>
          <div>
            <h1>Supaclass</h1>
            <small>IA + Supabase • Planos de Aula</small>
          </div>
        </div>

        <div className="userbox">
          <span className="avatar">
            {email ? email[0]?.toUpperCase() : "?"}
          </span>
          <div className="userdata">
            <strong>{email ?? "Visitante"}</strong>
            <small>{email ? "Logado" : "Deslogado"}</small>
          </div>
          {email && (
            <button
              className="link"
              style={{ marginLeft: 8 }}
              onClick={logoutTopbar}
              disabled={busy}
            >
              {busy ? "..." : "Sair"}
            </button>
          )}
        </div>
      </header>

      <main className="content">
        {!email ? (
          <AuthForm />
        ) : (
          <>
            <LessonForm onResult={setPlan} />
            <PlanCard plan={plan} />
          </>
        )}
      </main>

      <footer className="foot">
        <span>Feito por Rubens • Supabase + Gemini</span>
      </footer>
    </div>
  );
}
