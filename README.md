# Supaclass (Supabase + Gemini + React)

## 0) Pré-requisitos

* Node 18+ e npm
* Conta no **Supabase** (chave da API do Supabase)
* Conta no **Google AI Studio** (chave da API do Gemini)

---

## 1) Criar o projeto no Supabase

1. Acesse o Supabase Studio → **New project**.

2. Anote:

   * **Project URL**: `https://<slug>.supabase.co`
   * **Publishable key** (API Keys → “Publishable key”: inicia com `sb_publishable_...`)
   * (Opcional) **Project Ref**: aparece no canto superior ou nas URLs de API.

3. Em **Authentication → URL configuration**, coloque:

   * **Site URL**: `http://localhost:5173`

---

## 2) Banco de dados — rodar as migrações

No **SQL Editor** do Supabase, rode o script abaixo:

```sql
create table if not exists lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  summary text not null,
  playful_intro text,
  bncc_learning_objective text, 
  objectives text[] not null,
  activities jsonb not null,
  assessment_rubric jsonb,   
  bncc_code text,
  resources text,
  metadata jsonb not null,   
  created_at timestamp with time zone default now()
);

alter table lesson_plans enable row level security;

create policy "select own or public" on lesson_plans
for select using (auth.uid() = user_id or user_id is null);

create policy "insert as owner" on lesson_plans
for insert with check (auth.uid() = user_id);

create policy "update own" on lesson_plans
for update using (auth.uid() = user_id);

create policy "delete own" on lesson_plans
for delete using (auth.uid() = user_id);
```

---

## 3) Edge Function (Supabase Functions) — Gemini

### 3.1 Código

Na pasta do projeto, o arquivo já está em:

```
supabase/functions/generate-lesson-plan/index.ts
```

Ele:

* recebe os campos do formulário;
* chama o **Gemini** forçando **JSON**;
* prioriza **BNCC** e **Recursos** (se vierem);
* retorna o plano completo.

### 3.2 Secrets da função

No terminal, na raiz do projeto:

```bash
# entre na pasta do projeto
supabase functions deploy generate-lesson-plan

# defina secrets do projeto
supabase secrets set GEMINI_API_KEY="SUA_CHAVE_DO_AI_STUDIO"
# opcional: escolher modelo que existe na sua conta
supabase secrets set GEMINI_MODEL="gemini-2.5-flash"
```

### 3.3 URL da função
* Base Functions URL: `https://<slug>.functions.supabase.co`
* Rota: `/generate-lesson-plan`
  → **endpoint final:** `https://<slug>.functions.supabase.co/generate-lesson-plan`

Teste rápido (PowerShell):

```powershell
$body = @{
  subject="Matemática"
  topic="Equações do 1º grau"
  grade="9º ano"
  durationMinutes=50
  bnccCode="EF09MA01"
  resources="livro didático cap. 3; projetor"
  language="pt-BR"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://<slug>.functions.supabase.co/generate-lesson-plan" `
  -Headers @{ "Content-Type"="application/json" } `
  -Body $body
```

---

## 4) Chave do Gemini (Google AI Studio)

1. Abra **Google AI Studio → API Keys → Create API key**.
2. Copie a chave.
3. Já salvamos acima via `supabase secrets set GEMINI_API_KEY="..."`.

---

## 5) Frontend (React + Vite)

### 5.1 Variáveis de ambiente do **web**

Crie/edite `web/.env`:

```
VITE_SUPABASE_URL=https://<slug>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_XXXXXXXXXXXXXXXXXXXX   # Publishable key
VITE_FUNCTIONS_BASE_URL=https://<slug>.functions.supabase.co
VITE_FUNCTION_ROUTE=/generate-lesson-plan
VITE_SITE_URL=http://localhost:5173
```

### 5.2 Instalação e dev

```bash
cd web
npm i
npm run dev
# abre: http://localhost:5173
```

---

## 6) Testar a aplicação

1. Abra `http://localhost:5173`.
2. **Autenticação**: crie conta com e-mail/senha.
3. Preencha o formulário:

   * Disciplina, Tópico, Série, Duração;
   * (Opcional) **BNCC** e **Recursos** — se preencher, a IA **alinha** e **usa** esses dados;
4. Clique **Gerar plano com IA**.
5. Visualize:

   * **Introdução lúdica**
   * **Objetivo de aprendizagem (BNCC)**
   * **Atividades**
6. Clique **Exportar PDF** para baixar o plano.

---

## 7) Build/Deploy do front (opcional)

```bash
npm run build
```

---

# Como o projeto atende

* **Objetivo:** Gerar **planos de aula personalizados com IA** (Gemini) — ✔️
* **Componentes exigidos:**

  * **Introdução lúdica** — ✔️ (campo dedicado `playfulIntro`)
  * **Objetivo de aprendizagem da BNCC** — ✔️ (campo `bnccLearningObjective` + alinhamento ao `bnccCode`)
  * **Passo a passo da atividade** — ✔️ (`activities: { step, details }[]`)
  * **Rubrica de avaliação** — ✔️ (`assessmentRubric`)
* **Stack obrigatória:** Supabase (DB/Auth), Google AI Studio / Gemini, Front livre — ✔️
* **Fluxo funcional:** formulário → prompt estruturado → chamada ao Gemini (JSON) → **salvar** e **exibir** plano → exportar **PDF** — ✔️
* **Entrega:** código + instruções de setup e scripts SQL ✔️

---

## Checklist rápido

* [ ] Supabase criado; peguei **URL** e **Publishable key**
* [ ] Migrações rodadas no SQL Editor
* [ ] `supabase secrets set GEMINI_API_KEY=...`
* [ ] `supabase functions deploy generate-lesson-plan`
* [ ] `web/.env` preenchido com URL/keys do projeto online
* [ ] `npm i && npm run dev`
* [ ] Formulário → Gerar → Exportar PDF
