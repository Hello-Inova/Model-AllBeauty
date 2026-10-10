-- Período global de teste grátis para novas empresas.
-- Execute uma vez no SQL Editor da Vercel/Neon antes do deploy.
-- Seguro para repetir: IF NOT EXISTS preserva o valor já configurado.

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 7
  CHECK (trial_days BETWEEN 1 AND 90);
