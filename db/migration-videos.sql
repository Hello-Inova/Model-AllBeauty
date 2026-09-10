-- ---------------------------------------------------------------------------
-- Migração: seção de vídeos institucionais por empresa
--
-- Para quem JÁ TEM o banco em produção (schema.sql já foi rodado antes):
-- cole este arquivo inteiro no SQL Editor da Vercel/Neon e execute uma vez.
-- É seguro rodar mais de uma vez — usa IF NOT EXISTS.
--
-- Para um banco NOVO: não precisa rodar este arquivo — db/schema.sql já
-- inclui a tabela abaixo.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS business_videos (
  id           text PRIMARY KEY,
  business_id  text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  video        jsonb NOT NULL,
  title        text,
  "order"      integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS business_videos_business_id_idx ON business_videos (business_id);
