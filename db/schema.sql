-- ---------------------------------------------------------------------------
-- Model-AllBeauty — schema Postgres (Vercel Postgres / Neon)
--
-- Como rodar: abra o projeto no dashboard da Vercel → aba Storage → seu banco
-- Postgres → aba "Query" (ou "Data" → "Query") e cole este arquivo inteiro,
-- depois execute. É seguro rodar mais de uma vez (todo CREATE usa
-- IF NOT EXISTS).
--
-- Estratégia: cada entidade complexa/aninhada do domínio (imagens, horários,
-- políticas de agendamento, listas de ids) é guardada como JSONB — o mesmo
-- formato que o frontend já usa em TypeScript — em vez de normalizada em
-- tabelas extras. Isso mantém a camada de API praticamente um espelho 1:1
-- dos tipos em src/types/index.ts, sem sacrificar consultas relacionais nas
-- colunas que realmente importam (business_id, slug, status, datas).
-- ---------------------------------------------------------------------------

-- ---- Empresas (tenants) ----------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
  id                 text PRIMARY KEY,
  slug               text UNIQUE NOT NULL,
  name               text NOT NULL DEFAULT '',
  display_name       text NOT NULL DEFAULT '',
  description        text NOT NULL DEFAULT '',
  segment            text NOT NULL DEFAULT '',
  logo               jsonb,
  favicon            jsonb,
  cover_image        jsonb,
  hero_image         jsonb,
  phone              text NOT NULL DEFAULT '',
  whatsapp           text NOT NULL DEFAULT '',
  email              text NOT NULL DEFAULT '',
  instagram          text,
  facebook           text,
  tiktok             text,
  youtube            text,
  website            text,
  address            text NOT NULL DEFAULT '',
  city               text NOT NULL DEFAULT '',
  state              text NOT NULL DEFAULT '',
  country            text NOT NULL DEFAULT 'Brasil',
  zip_code           text NOT NULL DEFAULT '',
  currency           text NOT NULL DEFAULT 'BRL',
  timezone           text NOT NULL DEFAULT 'America/Sao_Paulo',
  primary_color      text NOT NULL DEFAULT '#b3873e',
  secondary_color    text NOT NULL DEFAULT '#2b2320',
  accent_color       text NOT NULL DEFAULT '#d9a441',
  background_color   text NOT NULL DEFAULT '#ffffff',
  foreground_color   text NOT NULL DEFAULT '#1c1917',
  theme              text NOT NULL DEFAULT 'light',
  active             boolean NOT NULL DEFAULT true,
  demo               boolean NOT NULL DEFAULT false,
  plan               text NOT NULL DEFAULT 'basico',
  working_hours      jsonb NOT NULL DEFAULT '[]',
  booking_policies   jsonb NOT NULL DEFAULT '{}',
  -- ---- Assinatura / cobrança recorrente (gateway Asaas) --------------------
  -- billing_type: 'padrao' cobra pelo plano abaixo; 'isento' nunca é cobrada
  -- e não deve exibir página de assinatura nem alerta de vencimento.
  billing_type           text NOT NULL DEFAULT 'padrao',
  -- billing_plan: referencia plans.id — 'mensal' | 'semestral' | 'anual'.
  billing_plan            text NOT NULL DEFAULT 'mensal',
  -- subscription_status: sem_assinatura | ativa | atrasada | cancelada.
  -- Escrito apenas pelo backend de billing e pelo webhook do Asaas — nunca
  -- pelo PATCH genérico de empresas (ver api/data/[...path].ts).
  subscription_status     text NOT NULL DEFAULT 'sem_assinatura',
  plan_expires_at         timestamptz,
  asaas_customer_id       text,
  asaas_subscription_id   text,
  card_last4              text,
  card_brand              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---- Credenciais de acesso (autenticação real) -----------------------------
-- business_id = NULL identifica o(s) usuário(s) super admin (gestor da
-- plataforma). Para os demais, business_id aponta para a empresa dona do
-- login. Senhas nunca são guardadas em texto puro — sempre um hash bcrypt.
CREATE TABLE IF NOT EXISTS admin_users (
  id             text PRIMARY KEY,
  business_id    text REFERENCES businesses(id) ON DELETE CASCADE,
  name           text NOT NULL DEFAULT '',
  email          text NOT NULL,
  password_hash  text NOT NULL,
  role           text NOT NULL DEFAULT 'owner', -- super_admin | owner | manager | staff
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_business_email_idx ON admin_users (business_id, email);
CREATE INDEX IF NOT EXISTS admin_users_business_id_idx ON admin_users (business_id);
-- Data em que este login aceitou os Termos de Uso, a Política de Privacidade
-- (LGPD) e a Política de Cookies. NULL = ainda não aceitou; o painel exibe um
-- gate bloqueando o acesso até o aceite, no primeiro login de cada usuário.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Limite de tentativas de login (3 por dia, fuso de Brasília) — protege tanto
-- o login de empresas quanto o do Super Admin contra força bruta. `scope`
-- identifica a combinação sendo tentada ANTES de qualquer consulta a
-- businesses/admin_users (ex: 'admin:<slug>:<email>' ou 'super:<email>'), de
-- propósito, para bloquear tentativas mesmo contra e-mails/empresas
-- inexistentes. Ver api/_lib/auth.ts.
CREATE TABLE IF NOT EXISTS login_attempts (
  scope         text PRIMARY KEY,
  attempt_date  date NOT NULL,
  count         integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Tokens de "esqueci minha senha" (login de empresa e Super Admin). Nunca
-- guardamos o token em texto puro — só o hash SHA-256 dele (mesmo raciocínio
-- de nunca guardar senha em texto puro), com validade curta e uso único. Ver
-- api/auth/[...action].ts (ações forgot-password / reset-password) e
-- api/_lib/resend.ts (envio do e-mail).
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id             text PRIMARY KEY,
  admin_user_id  text NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash     text NOT NULL,
  expires_at     timestamptz NOT NULL,
  used_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_token_hash_idx ON password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS password_reset_tokens_admin_user_id_idx ON password_reset_tokens (admin_user_id);

-- ---- Categorias -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id           text PRIMARY KEY,
  business_id  text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT '',
  slug         text NOT NULL DEFAULT '',
  description  text,
  icon         text,
  "order"      integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS categories_business_id_idx ON categories (business_id);

-- ---- Serviços -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id                  text PRIMARY KEY,
  business_id         text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id         text,
  name                text NOT NULL DEFAULT '',
  slug                text NOT NULL DEFAULT '',
  short_description   text NOT NULL DEFAULT '',
  description         text NOT NULL DEFAULT '',
  duration            integer NOT NULL DEFAULT 30,
  price               numeric(10,2) NOT NULL DEFAULT 0,
  promotional_price   numeric(10,2),
  image               jsonb,
  active              boolean NOT NULL DEFAULT true,
  featured            boolean NOT NULL DEFAULT false,
  "order"             integer NOT NULL DEFAULT 0,
  professional_ids    jsonb NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS services_business_id_idx ON services (business_id);

-- ---- Profissionais ----------------------------------------------------
CREATE TABLE IF NOT EXISTS professionals (
  id                   text PRIMARY KEY,
  business_id          text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name                 text NOT NULL DEFAULT '',
  photo                jsonb,
  description          text NOT NULL DEFAULT '',
  specialties          jsonb NOT NULL DEFAULT '[]',
  phone                text,
  email                text,
  service_ids          jsonb NOT NULL DEFAULT '[]',
  working_hours        jsonb NOT NULL DEFAULT '[]',
  use_business_hours   boolean NOT NULL DEFAULT true,
  active               boolean NOT NULL DEFAULT true,
  "order"              integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS professionals_business_id_idx ON professionals (business_id);

-- ---- Clientes -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id           text PRIMARY KEY,
  business_id  text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT '',
  phone        text NOT NULL DEFAULT '',
  whatsapp     text NOT NULL DEFAULT '',
  email        text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customers_business_id_idx ON customers (business_id);

-- ---- Agendamentos -----------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS appointment_seq START 1;

CREATE TABLE IF NOT EXISTS appointments (
  id               text PRIMARY KEY,
  business_id      text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  code             text NOT NULL,
  service_id       text NOT NULL,
  professional_id  text,
  customer_id      text NOT NULL,
  date             text NOT NULL,
  start_time       text NOT NULL,
  end_time         text NOT NULL,
  duration         integer NOT NULL DEFAULT 0,
  price            numeric(10,2) NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'pending',
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_business_id_idx ON appointments (business_id);
CREATE INDEX IF NOT EXISTS appointments_business_date_idx ON appointments (business_id, date);

-- ---- Bloqueios de agenda ------------------------------------------------
CREATE TABLE IF NOT EXISTS blocked_dates (
  id               text PRIMARY KEY,
  business_id      text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  professional_id  text,
  date             text NOT NULL,
  all_day          boolean NOT NULL DEFAULT true,
  start_time       text,
  end_time         text,
  reason           text
);
CREATE INDEX IF NOT EXISTS blocked_dates_business_id_idx ON blocked_dates (business_id);

-- ---- Galeria -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_images (
  id           text PRIMARY KEY,
  business_id  text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  image        jsonb NOT NULL,
  title        text,
  description  text,
  "order"      integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS gallery_images_business_id_idx ON gallery_images (business_id);

-- ---- Depoimentos -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
  id           text PRIMARY KEY,
  business_id  text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT '',
  photo        jsonb,
  text         text NOT NULL DEFAULT '',
  rating       integer NOT NULL DEFAULT 5,
  active       boolean NOT NULL DEFAULT true,
  demo         boolean NOT NULL DEFAULT false,
  "order"      integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS testimonials_business_id_idx ON testimonials (business_id);

-- ---- Banners -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS banners (
  id           text PRIMARY KEY,
  business_id  text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  image        jsonb NOT NULL,
  title        text,
  subtitle     text,
  link         text,
  active       boolean NOT NULL DEFAULT true,
  "order"      integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS banners_business_id_idx ON banners (business_id);

-- ---- Vídeos institucionais (até 3 por empresa, até 40s cada) --------------
CREATE TABLE IF NOT EXISTS business_videos (
  id           text PRIMARY KEY,
  business_id  text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  video        jsonb NOT NULL,
  title        text,
  "order"      integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS business_videos_business_id_idx ON business_videos (business_id);

-- ---- Planos de assinatura (catálogo global, editável pelo Super Admin) -----
-- id = 'mensal' | 'semestral' | 'anual'. cycle é o valor aceito pelo Asaas em
-- POST /v3/subscriptions (MONTHLY | SEMIANNUALLY | YEARLY). O preço final
-- cobrado é sempre price_cents - discount_cents (calculado na hora, nunca
-- guardado, para nunca ficar dessincronizado).
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

-- ---- Histórico de cobranças (espelho local dos eventos de webhook do Asaas)
-- id = o próprio id da cobrança no Asaas (ex: "pay_xxx") — garante upsert
-- idempotente mesmo que o Asaas reenvie o mesmo evento de webhook.
CREATE TABLE IF NOT EXISTS billing_transactions (
  id            text PRIMARY KEY,
  business_id   text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  value_cents   integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending', -- pending|confirmed|received|overdue|refused|refunded
  due_date      date,
  paid_at       timestamptz,
  raw_event     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS billing_transactions_business_id_idx ON billing_transactions (business_id);

-- ---- Configurações da plataforma (Hello Inova) ------------------------------
-- Linha única (id = 'default'). Guarda dados não-sensíveis usados para montar
-- a mensagem de cobrança via WhatsApp (chave Pix para pagamento alternativo).
-- Credenciais do Asaas (API key, token de webhook) NUNCA ficam aqui — são
-- variáveis de ambiente na Vercel (ver README).
CREATE TABLE IF NOT EXISTS platform_settings (
  id                   text PRIMARY KEY DEFAULT 'default',
  pix_key              text NOT NULL DEFAULT '',
  pix_key_owner_name   text NOT NULL DEFAULT '',
  updated_at           timestamptz NOT NULL DEFAULT now()
);
INSERT INTO platform_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
