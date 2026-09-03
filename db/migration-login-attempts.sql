-- ---------------------------------------------------------------------------
-- Migração: limite de tentativas de login (3 por dia)
--
-- Para quem JÁ TEM o banco em produção (schema.sql já foi rodado antes):
-- cole este arquivo inteiro no SQL Editor da Vercel/Neon e execute uma vez.
-- É seguro rodar mais de uma vez — usa IF NOT EXISTS.
--
-- Para um banco NOVO: não precisa rodar este arquivo — db/schema.sql já
-- inclui tudo isso.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS login_attempts (
  scope         text PRIMARY KEY,
  attempt_date  date NOT NULL,
  count         integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
