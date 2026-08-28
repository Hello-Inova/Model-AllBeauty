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
