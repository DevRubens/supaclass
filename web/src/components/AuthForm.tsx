import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Mode = "login" | "signup" | "reset";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setMsg(null);
    supabase.auth
      .getUser()
      .then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserEmail(s?.user?.email ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { emailRedirectTo: import.meta.env.VITE_SITE_URL },
      });
      if (error) throw error;
      setMsg(
        "Cadastro realizado! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada."
      );
      setMode("login");
    } catch (err: any) {
      setMsg(err?.message ?? "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      setMsg("Login efetuado!");
    } catch (err: any) {
      setMsg(err?.message ?? "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: import.meta.env.VITE_SITE_URL,
      });
      if (error) throw error;
      setMsg(
        "Se o e-mail existir, enviaremos instruções para redefinir a senha."
      );
    } catch (err: any) {
      setMsg(err?.message ?? "Erro ao solicitar redefinição.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMsg("Sessão encerrada.");
    } catch (err: any) {
      setMsg(err?.message ?? "Erro ao sair.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>{userEmail ? "Sua conta" : "Acessar"}</h2>
        <p>
          {userEmail
            ? `Logado como ${userEmail}`
            : "Entre com e-mail e senha ou crie sua conta."}
        </p>
      </div>

      {!userEmail ? (
        <>
          <div className="tabs" style={{ marginTop: 12 }}>
            <button
              type="button"
              className={`tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`tab ${mode === "signup" ? "active" : ""}`}
              onClick={() => setMode("signup")}
            >
              Cadastro
            </button>
            <button
              type="button"
              className={`tab ${mode === "reset" ? "active" : ""}`}
              onClick={() => setMode("reset")}
            >
              Esqueci a senha
            </button>
          </div>

          {mode !== "reset" && (
            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="form-bar"
              style={{ marginTop: 12 }}
            >
              <div className="form-item wide">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-item small">
                <label>Senha</label>
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </div>
              <div className="actions-right">
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : mode === "login" ? (
                    "Entrar"
                  ) : (
                    "Cadastrar"
                  )}
                </button>
              </div>
            </form>
          )}

          {mode === "reset" && (
            <form
              onSubmit={handleReset}
              className="form-bar"
              style={{ marginTop: 12 }}
            >
              <div className="form-item wide">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="actions-right">
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <span className="spinner" /> : "Enviar instruções"}
                </button>
              </div>
            </form>
          )}

          {msg && <div className="alert">{msg}</div>}
        </>
      ) : (
        <>
          <div
            className="actions"
            style={{ justifyContent: "flex-start", marginTop: 12 }}
          >
            <button
              className="btn-primary"
              type="button"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Sair"}
            </button>
          </div>
          {msg && (
            <div className="alert" style={{ marginTop: 10 }}>
              {msg}
            </div>
          )}
        </>
      )}
    </section>
  );
}
