-- Habilitar extensões (caso não estejam ativas)
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Tabela principal de planos de aula
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  grade text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  objectives text,
  constraints text,
  model_used text not null default 'gemini-1.5-pro',
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.lesson_plans enable row level security;

-- Políticas:
-- 1) Usuário autenticado pode inserir registros próprios
create policy "Users can insert their own lesson plans"
on public.lesson_plans
for insert
to authenticated
with check (auth.uid() = user_id);

-- 2) Usuário autenticado pode selecionar apenas seus registros
create policy "Users can select their own lesson plans"
on public.lesson_plans
for select
to authenticated
using (auth.uid() = user_id);

-- 3) Usuário autenticado pode atualizar apenas seus registros (se precisar)
create policy "Users can update their own lesson plans"
on public.lesson_plans
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4) Usuário autenticado pode deletar apenas seus registros (se precisar)
create policy "Users can delete their own lesson plans"
on public.lesson_plans
for delete
to authenticated
using (auth.uid() = user_id);
