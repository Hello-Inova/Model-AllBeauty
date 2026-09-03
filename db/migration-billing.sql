-- ---------------------------------------------------------------------------
-- Migração: Assinatura / cobrança recorrente (gateway Asaas)
--
-- Para quem JÁ TEM o banco em produção (schema.sql já foi rodado antes):
-- cole este arquivo inteiro no SQL Editor da Vercel/Neon e execute uma vez.
-- É seguro rodar mais de uma vez — todo comando usa IF NOT EXISTS / ON
-- CONFLICT DO NOTHING.
--
-- Para um banco NOVO: não precisa rodar este arquivo — db/schema.sql já
-- inclui tudo isso.
-- ---------------------------------------------------------------------------

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'padrao';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_plan text NOT NULL DEFAULT 'mensal';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'sem_assinatura';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS asaas_customer_id text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS card_last4 text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS card_brand text;

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

CREATE TABLE IF NOT EXISTS plans (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  cycle           text NOT NULL,
  months          integer NOT NULL,
  price_cents     integer NOT NULL DEFAULT 0,
  discount_cents  integer NOT NULL DEFAULT 0,
  active          boolean NOT NULL DEFAULT true,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
INSERT INTO plans (id, name, cycle, months, price_cents, discount_cents) VALUES
  ('mensal',    'Mensal',    'MONTHLY',      1,  11900,     0),
  ('semestral', 'Semestral', 'SEMIANNUALLY', 6,  71400,  7140),
  ('anual',     'Anual',     'YEARLY',       12, 142800, 28560)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS billing_transactions (
  id            text PRIMARY KEY,
  business_id   text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  value_cents   integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending',
  due_date      date,
  paid_at       timestamptz,
  raw_event     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS billing_transactions_business_id_idx ON billing_transactions (business_id);

CREATE TABLE IF NOT EXISTS platform_settings (
  id                   text PRIMARY KEY DEFAULT 'default',
  pix_key              text NOT NULL DEFAULT '',
  pix_key_owner_name   text NOT NULL DEFAULT '',
  updated_at           timestamptz NOT NULL DEFAULT now()
);
INSERT INTO platform_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
