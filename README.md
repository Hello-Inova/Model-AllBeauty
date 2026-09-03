# Plataforma White-Label de Catálogo e Agendamento Online

Uma base de produto reutilizável para catálogo de serviços e agendamento online, pensada para salões de beleza, barbearias, clínicas de estética, spas, studios de unhas/cílios/sobrancelhas, clínicas de massagem, centros de bem-estar e profissionais autônomos baseados em agendamento.

**A mesma base de código atende múltiplas empresas reais.** O que muda entre clientes são os dados, a identidade visual, os serviços, os profissionais, os horários e as imagens — nunca o código-fonte. Todas as empresas ficam em um único banco de dados Postgres, isoladas por `business_id`, com autenticação real (senha com hash bcrypt, sessão JWT em cookie `httpOnly`) e imagens hospedadas no Vercel Blob.

> Repositório oficial: https://github.com/Hello-Inova/Model-AllBeauty

---

## Índice

1. [Instalação e desenvolvimento](#instalação-e-desenvolvimento)
2. [Deploy na Vercel (produção)](#deploy-na-vercel-produção)
3. [Assinaturas e cobrança (Asaas)](#assinaturas-e-cobrança-asaas)
4. [Como criar uma nova empresa (sem código)](#como-criar-uma-nova-empresa-sem-código)
5. [Acessos gerados no seed](#acessos-gerados-no-seed)
6. [Arquitetura](#arquitetura)
7. [Estrutura de pastas](#estrutura-de-pastas)
8. [Segurança](#segurança)
9. [Backup e restauração](#backup-e-restauração)
10. [Evolução do produto](#evolução-do-produto)
11. [Checklist de entrega](#checklist-de-entrega)

---

## Instalação e desenvolvimento

Pré-requisitos: Node.js 20+ e npm.

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm run dev
```

Para o painel funcionar em desenvolvimento local, as variáveis de ambiente descritas em [Deploy na Vercel](#deploy-na-vercel-produção) (`POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, `JWT_SECRET`) precisam existir em um arquivo `.env.local` e o projeto precisa rodar com `vercel dev` (para que as funções em `/api` sejam servidas) em vez de `npm run dev` puro, que serve apenas o frontend estático.

### Build de produção

```bash
npm run build
```

Gera a pasta `/dist` com o frontend. As funções serverless em `/api` são publicadas automaticamente pela Vercel a partir do mesmo repositório — não fazem parte do `/dist`.

### Verificação de tipos das funções de API

Como `/api` não faz parte do projeto TypeScript do frontend (`tsconfig.app.json` só inclui `src`), existe uma verificação própria:

```bash
npm run typecheck:api
```

---

## Deploy na Vercel (produção)

O sistema usa **Vercel Postgres** (banco de dados) e **Vercel Blob** (armazenamento de imagens), com o frontend e as funções de API publicados no mesmo projeto Vercel a partir deste repositório GitHub.

### 1. Conectar o repositório

1. Em [vercel.com](https://vercel.com), **Add New → Project** e importe `Hello-Inova/Model-AllBeauty`.
2. A Vercel detecta o `vercel.json` deste repositório automaticamente (build `npm run build`, saída em `dist`, rewrites de SPA e funções em `/api`). Não é necessário configurar nada manualmente aqui.
3. Ainda não clique em "Deploy" definitivo — antes, configure o banco, o storage e as variáveis de ambiente abaixo (o primeiro deploy pode falhar sem elas, e isso é normal; basta fazer um redeploy depois).

### 2. Criar o banco de dados (Postgres)

1. No projeto na Vercel, aba **Storage → Create Database → Postgres** (via Neon, integração nativa da Vercel).
2. Depois de criado, a Vercel injeta automaticamente as variáveis `POSTGRES_URL` (ou `DATABASE_URL`, dependendo da versão da integração — o código já reconhece as duas) no projeto.
3. Abra o **Query** (console SQL) do banco pelo próprio painel da Vercel e cole o conteúdo do arquivo [`db/schema.sql`](./db/schema.sql) deste repositório. Execute. Isso cria todas as tabelas (`businesses`, `admin_users`, `categories`, `services`, `professionals`, `customers`, `appointments`, `blocked_dates`, `gallery_images`, `testimonials`, `banners`, `plans`, `billing_transactions`, `platform_settings`, `login_attempts`).
4. No mesmo console, cole o conteúdo do arquivo [`db/seed.sql`](./db/seed.sql) e execute. Isso cadastra a empresa de demonstração **Beauty Demo** (14 serviços, 7 categorias, 6 profissionais, clientes e agendamentos de exemplo) e um usuário **super admin**, com senhas já criptografadas (bcrypt) — as senhas em texto puro geradas nesse processo estão listadas em [Acessos gerados no seed](#acessos-gerados-no-seed) e não ficam salvas em nenhum arquivo do repositório.

> **Banco já existente (deploy anterior a este recurso)?** `schema.sql` só cria tabelas que ainda não existem — em um banco que já estava em produção antes da funcionalidade de assinaturas, as colunas e tabelas novas não aparecem sozinhas. Nesse caso, execute também o conteúdo de [`db/migration-billing.sql`](./db/migration-billing.sql) no mesmo console SQL — é uma migração idempotente (`ADD COLUMN IF NOT EXISTS`/`CREATE TABLE IF NOT EXISTS`), segura para rodar mesmo que parte da estrutura já exista.
>
> **Banco já existente (deploy anterior ao limite de tentativas de login)?** Execute também [`db/migration-login-attempts.sql`](./db/migration-login-attempts.sql) — cria a tabela `login_attempts` usada para bloquear logins após 3 tentativas incorretas por dia (veja [Segurança](#segurança)). Também idempotente (`CREATE TABLE IF NOT EXISTS`).

> Se quiser gerar um novo `db/seed.sql` com senhas diferentes (por exemplo, antes de entregar o sistema a um cliente), rode `npm run generate-seed` neste projeto — o script reaproveita os dados de demonstração já existentes em `src/data/demoData.ts`, gera senhas aleatórias novas e imprime as credenciais no terminal uma única vez.

### 3. Criar o armazenamento de imagens (Blob)

1. Aba **Storage → Create Database → Blob**.
2. A Vercel injeta automaticamente a variável `BLOB_READ_WRITE_TOKEN` no projeto.

### 4. Configurar as variáveis de ambiente

Em **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `JWT_SECRET` | Uma string longa e aleatória (ex: gere com `openssl rand -base64 48`). Usada para assinar as sessões de login — **nunca reutilize um valor de exemplo em produção**. |
| `ASAAS_API_KEY` | Chave de API da conta [Asaas](https://www.asaas.com) da Hello Inova (**Configurações → Integrações → API** dentro do painel Asaas). Usada para cobrar a mensalidade das empresas — veja [Assinaturas e cobrança (Asaas)](#assinaturas-e-cobrança-asaas). |
| `ASAAS_ENV` | `production` para cobrar de verdade, ou `sandbox` para testar sem movimentar dinheiro real. **Se não for definida, o sistema assume `sandbox` por padrão** (proteção contra deploy mal configurado cobrar dinheiro real por engano) — ou seja, é preciso definir explicitamente `production` quando estiver pronto para cobrar. |
| `ASAAS_WEBHOOK_TOKEN` | Um segredo qualquer definido por você (ex: gere com `openssl rand -hex 24`) — cadastrado tanto aqui quanto no webhook configurado no painel Asaas (passo 3 da seção de assinaturas), para o sistema confirmar que os avisos de pagamento recebidos realmente vieram do Asaas. |

As demais variáveis (`POSTGRES_URL`/`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`) já foram criadas automaticamente nos passos 2 e 3.

### 5. Deploy

Com o banco, o storage e as variáveis de ambiente configuradas, clique em **Deploy** (ou **Redeploy**, se o primeiro deploy tiver ocorrido antes desse passo). A partir daqui, **todo `git push` na branch `main` publica uma nova versão automaticamente** — não é necessário rodar nenhum comando de deploy manual.

### Roteamento

A aplicação usa **BrowserRouter** com URLs limpas (ex: `/empresa/beauty-demo`, sem `#`). O `vercel.json` já inclui a regra de rewrite necessária para que atualizar a página, compartilhar links diretos e navegar entre seções funcione corretamente em qualquer rota — inclusive dentro do `/api`, que é excluído do rewrite.

---

## Assinaturas e cobrança (Asaas)

Cada empresa cadastrada na plataforma paga uma mensalidade à Hello Inova para continuar usando o site e o painel administrativo. A cobrança é automática, via **cartão de crédito recorrente** processado pelo gateway [Asaas](https://www.asaas.com), com três planos:

| Plano | Valor cheio | Desconto | Valor cobrado |
|---|---|---|---|
| Mensal | R$ 119,00/mês | — | R$ 119,00/mês |
| Semestral | R$ 714,00 | R$ 71,40 | R$ 642,60 a cada 6 meses |
| Anual | R$ 1.428,00 | R$ 285,60 (20%) | R$ 1.142,40 a cada 12 meses |

Os valores acima são os que vêm cadastrados no `db/schema.sql`/`db/seed.sql` — **podem ser editados a qualquer momento pelo Super Admin**, em **Empresas na plataforma → Planos de assinatura**, sem precisar mexer no banco de dados nem redeployar.

### 1. Criar e configurar a conta Asaas

1. Crie (ou use) uma conta em [asaas.com](https://www.asaas.com) em nome da Hello Inova.
2. Em **Configurações → Integrações → API**, gere uma chave de API e configure-a como `ASAAS_API_KEY` (veja passo 4 do deploy, acima). Recomenda-se testar primeiro com `ASAAS_ENV=sandbox` e uma conta de testes do Asaas antes de apontar para produção.
3. Cadastre a **chave Pix** que a Hello Inova usa para receber pagamentos manuais (usada apenas nas mensagens de cobrança por WhatsApp — veja abaixo) em **Super Admin → Empresas na plataforma → Configurações da plataforma**.

### 2. Configurar o webhook

O Asaas avisa o sistema sempre que um pagamento é confirmado, recusado ou fica em atraso, via webhook. Sem isso, o status de assinatura das empresas não é atualizado automaticamente.

1. No painel Asaas, vá em **Integrações → Webhooks** e crie um novo webhook apontando para `https://<seu-domínio-vercel>/api/webhooks/asaas`.
2. Selecione (no mínimo) os eventos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`, `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED`.
3. Configure o **token de autenticação** do webhook com o mesmo valor definido em `ASAAS_WEBHOOK_TOKEN` — o sistema rejeita qualquer chamada que não apresente esse token no cabeçalho `asaas-access-token`, para que ninguém além do Asaas consiga forjar uma confirmação de pagamento.

### O que cada painel pode fazer

**Painel administrativo da empresa** (`/admin/<slug>/assinatura`):
- Ver o status da assinatura, o plano atual, a data da próxima cobrança e o cartão cadastrado (bandeira + últimos 4 dígitos — o número completo nunca é salvo neste sistema, veja [Segurança](#segurança)).
- Assinar ou trocar o cartão de pagamento a qualquer momento.
- Ver o histórico de cobranças.
- Um aviso fixo aparece no topo de **todas** as páginas do painel mostrando quantos dias faltam para o vencimento; a partir de 5 dias (ou já vencido), o aviso vira um alerta destacado com um botão **"Pagar agora"**.

**Super Admin** (`/super-admin`, em **Empresas na plataforma**):
- **Excluir uma empresa** (remove todos os dados dela do banco).
- **Cobrar via WhatsApp**: um botão por empresa abre o WhatsApp já com uma mensagem de cobrança pronta, incluindo o valor, o vencimento e a chave Pix da Hello Inova, para uso alternativo ao cartão automático.
- **Editar os planos** (valores e descontos de mensal/semestral/anual).
- **Trocar o plano de cada empresa** (mensal/semestral/anual) e o **tipo de cobrança**: `padrao` (cobra normalmente pelo plano) ou `isento` (empresa cortesia, nunca cobrada — some o aviso de vencimento e a página de assinatura do painel dela).
- **Gestão Financeira** (`/super-admin/financeiro`): painel somente-leitura com a receita da plataforma — MRR estimado (receita mensal recorrente das empresas ativas), total confirmado no mês e histórico, valores em aberto e atrasados, contagem de empresas por status de assinatura, gráfico dos últimos 12 meses e a lista completa de transações (filtrável por status e por empresa), alimentada pelas cobranças já registradas em `billing_transactions` via webhook do Asaas.

### Instalar o painel administrativo no celular ("Adicionar à Tela de Início")

O painel administrativo de cada empresa (`/admin/<slug>`) é uma PWA instalável, com um aviso que sugere adicioná-lo à tela de início quando aberto pelo navegador do celular — com o nome e a logo **da própria empresa**, não da plataforma:

- **Android/Chrome/Edge**: aparece uma faixa com o botão **"Instalar"**, que abre o prompt nativo do navegador.
- **iOS/Safari**: a Apple não expõe esse prompt automático para nenhum site — a faixa mostra o passo a passo manual (**Compartilhar → "Adicionar à Tela de Início"**).
- O aviso não aparece em desktop, some sozinho se o painel já estiver instalado, e quem dispensar (✕) só volta a vê-lo depois de 14 dias.

Tecnicamente, isso funciona trocando dinamicamente a tag `<link rel="manifest">` da página para `GET /api/manifest?slug=<slug>` (`api/manifest.ts`) assim que o painel de uma empresa é aberto — um manifesto gerado na hora, com o nome e a logo daquela empresa, servido separadamente do `public/manifest.webmanifest` estático usado pelo site público. Ver `src/utils/pwa.ts` e `src/components/admin/InstallAppPrompt.tsx`.

### Termos de uso, privacidade e cookies

No primeiro login de cada administrador de empresa, o sistema exige a aceitação dos **Termos de Uso**, da **Política de Privacidade (LGPD)** e da **Política de Cookies** antes de liberar o acesso ao painel (`src/components/admin/TermsGate.tsx`) — o aceite fica registrado com data/hora em `admin_users.terms_accepted_at`. O conteúdo desses documentos está em `src/pages/legal/` e também é acessível publicamente em `/legal/termos-de-uso`, `/legal/privacidade` e `/legal/cookies`. **Esse conteúdo foi gerado com apoio de IA com base na LGPD (Lei 13.709/2018), no Marco Civil da Internet (Lei 12.965/2014) e no Código de Defesa do Consumidor — recomenda-se revisão por um advogado antes do uso em produção**, especialmente se o negócio, os fornecedores (Asaas, Vercel) ou a forma de cobrança mudarem.

---

## Como criar uma nova empresa (sem código)

Não é necessário alterar uma linha de código para publicar o site de uma nova empresa. O cadastro de empresas é feito pelo dono da plataforma (Hello Inova) através do painel Super Admin — não existe cadastro público autoatendido.

1. Acesse **`/super-admin/login`** e entre com as credenciais de super admin (veja [Acessos gerados no seed](#acessos-gerados-no-seed)).
2. Clique em **"Nova empresa"**.
3. Siga o assistente de 10 passos:
   1. Nome e segmento da empresa
   2. Logo e identidade visual (cores)
   3. Contatos (telefone, WhatsApp, e-mail, Instagram)
   4. Endereço
   5. Horários de funcionamento
   6. Categorias de serviços
   7. Serviços
   8. Profissionais
   9. Configurações (plano e **acesso do administrador** — e-mail e senha que a empresa usará para entrar no próprio painel)
   10. Revisão e publicação
4. Ao concluir, a empresa já está no ar em `/empresa/<slug-da-empresa>` e pronta para receber agendamentos, com um login de administrador real (senha com hash bcrypt) já criado.
5. Repasse o e-mail e a senha definidos no passo 9 para o cliente. Recomende que ele troque a senha no primeiro acesso, em **Configurações → Alterar senha** no painel administrativo.
6. Use o **painel administrativo** (`/admin/<slug>/login`) para refinar tudo depois: adicionar mais serviços, fotos, profissionais, ajustar preços, políticas de agendamento etc. — tudo pelo navegador.

### O que pode ser personalizado pelo painel, sem código

Nome, logo, favicon, cores (primária/secundária/destaque/fundo), descrição, textos, serviços, categorias, preços, duração, profissionais e suas fotos, horários de funcionamento (com múltiplos períodos, ex: 08h–12h e 14h–18h), bloqueios e folgas, galeria de imagens, depoimentos, banners, WhatsApp, redes sociais, endereço e políticas de agendamento (antecedência mínima, prazo máximo, cancelamento, intervalo entre atendimentos, tolerância de atraso).

---

## Acessos gerados no seed

As credenciais abaixo são as que o `db/seed.sql` atualmente versionado neste repositório cria no banco (senha já em hash bcrypt — o texto puro só existe no momento em que o script `generate-seed` roda, e foi entregue separadamente a quem publicou o sistema). **Troque as duas senhas assim que possível** em **Configurações → Alterar senha** (empresa) e no painel do super admin.

| Painel | URL | Usuário |
|---|---|---|
| Admin da empresa demo (Beauty Demo) | `/admin/beauty-demo/login` | `contato@beautydemo.com.br` |
| Super Admin | `/super-admin/login` | `super@plataforma.com` |

Se as senhas originais foram perdidas, gere um novo `db/seed.sql` com `npm run generate-seed` (isso recria os dados de demonstração com senhas novas — não afeta empresas reais já cadastradas, já que o seed usa `ON CONFLICT ... DO NOTHING`) ou, mais simples, atualize a senha de um usuário específico diretamente no console SQL da Vercel gerando um novo hash bcrypt.

A empresa de demonstração **Beauty Demo** vem com dados completos: 14 serviços, 7 categorias, 6 profissionais, clientes e agendamentos de exemplo, imagens de galeria e depoimentos — todos com fotos reais licenciadas do Unsplash. Ela pode ser mantida como vitrine do produto ou removida do banco quando não for mais necessária.

---

## Arquitetura

```
MESMO SISTEMA
   ↓
DADOS DA EMPRESA (business_id)
   ↓
SITE + PAINEL DA EMPRESA
```

- **Multiempresa real:** toda entidade (serviços, categorias, profissionais, clientes, agendamentos, horários, bloqueios, galeria, depoimentos) é isolada por `business_id` em um único banco Postgres. Nunca há mistura de dados entre empresas.
- **Banco de dados real (Vercel Postgres):** schema relacional em [`db/schema.sql`](./db/schema.sql), com campos complexos (imagens, horários, políticas de agendamento) guardados como `jsonb` para espelhar de perto os tipos TypeScript do frontend.
- **Camada de dados única (`DataRepository`):** nenhum componente acessa o banco diretamente. Todos passam por `src/repositories/DataRepository.ts`, hoje implementado por `ApiProvider` (`src/repositories/providers/ApiProvider.ts`), que fala com as funções serverless em `/api` via `fetch`.
- **Camada de imagens (`ImageStorage`):** mesmo princípio, implementado por `ApiImageStorage`, que envia os arquivos para `/api/upload` e estes são armazenados no **Vercel Blob** — as URLs geradas são públicas e permanentes, acessíveis de qualquer dispositivo/rede.
- **Funções serverless (`/api`):** consolidadas em apenas 3 arquivos para não esbarrar em limites de quantidade de funções dos planos da Vercel — `api/auth/[...action].ts` (login, logout, sessão, troca de senha), `api/data/[...path].ts` (CRUD de todas as entidades) e `api/upload.ts` (upload/remoção de imagens no Blob). Lógica compartilhada fica em `api/_lib/` (conexão com o banco, autenticação/sessão, conversão linha↔objeto).
- **Autenticação real:** senha com hash **bcrypt** (nunca texto puro), sessão assinada em **JWT** e guardada em cookie `httpOnly`, `Secure`, `SameSite=Lax` — o token nunca fica acessível a JavaScript no navegador nem em `localStorage`.
- **Autorização por rota:** leitura pública apenas para o que o site institucional e o agendamento realmente precisam (catálogo, disponibilidade de horários); leitura completa de clientes/agendamentos e qualquer escrita fora da criação de agendamento exigem sessão de administrador da própria empresa ou do super admin.
- **Identidade visual dinâmica:** cada empresa define suas cores, que são injetadas como CSS Variables (`--color-primary`, `--color-secondary`, etc.) em tempo de execução — o mesmo CSS atende qualquer paleta.
- **Componente único de upload de imagem (`ImageUploader`):** usado em todas as áreas administrativas (logo, favicon, capa, hero, serviços, profissionais, galeria, depoimentos, banners), com suporte a URL e anexo de arquivo, preview, validação e fallback — nunca duplicado por módulo.
- **Tabelas com scroll obrigatório (`ScrollableTable`):** toda tabela do sistema usa esse componente, garantindo que nenhuma tabela jamais quebre o layout, com scroll horizontal e vertical contidos dentro do próprio componente.

---

## Estrutura de pastas

```
api/
├── _lib/             Conexão com o banco, autenticação/sessão, mapeamento linha↔objeto, cliente Asaas
├── auth/[...action].ts   Login, logout, sessão atual, troca de senha, aceite de termos
├── data/[...path].ts     CRUD de empresas, catálogo, clientes, agendamentos, planos, configurações da plataforma, relatório financeiro etc.
├── billing/[...action].ts  Assinar/atualizar cartão, consultar status de cobrança de uma empresa
├── webhooks/asaas.ts  Recebe confirmações de pagamento do Asaas e atualiza o status de assinatura
├── manifest.ts        Web App Manifest dinâmico do painel administrativo, com a marca de cada empresa
└── upload.ts         Upload e remoção de imagens no Vercel Blob

db/
├── schema.sql            DDL de todas as tabelas (rodar uma vez, na criação do banco)
├── migration-billing.sql Migração idempotente das tabelas/colunas de assinatura, para bancos já existentes
├── migration-login-attempts.sql Migração idempotente da tabela de limite de tentativas de login, para bancos já existentes
└── seed.sql              Dados de demonstração + super admin (gerado por scripts/generate-seed.mts)

scripts/
└── generate-seed.mts Gera db/seed.sql a partir de src/data/demoData.ts, com senhas novas

src/
├── components/       Componentes reutilizáveis (públicos, admin, legais e genéricos)
├── pages/            Páginas (public/, admin/, superadmin/, legal/)
├── layouts/           Layouts (público, admin, super admin)
├── repositories/      Camada de dados e de imagens (DataRepository, ImageStorage, providers/)
├── services/          Clientes de API para ações que não são CRUD simples (ex: billing.ts)
├── contexts/          BusinessContext, AuthContext, ToastContext
├── hooks/             Hooks de dados (useServices, useAppointments, useImage, ...)
├── types/             Tipos TypeScript de todas as entidades
├── utils/             Disponibilidade de horários, formatação, validação, WhatsApp, slugs, cobrança
├── config/            Constantes globais
├── themes/            Aplicação de tema/CSS variables
└── data/              Dados demonstrativos (empresa "Beauty Demo"), fonte do seed SQL
```

---

## Segurança

- Senhas de administradores **nunca** são armazenadas em texto puro — apenas o hash bcrypt (`api/_lib/auth.ts`).
- A sessão de login é um **JWT assinado** (chave em `JWT_SECRET`, configurada só no ambiente da Vercel, nunca no código), guardado em um cookie `httpOnly` + `Secure` + `SameSite=Lax`. Isso significa que o token de sessão não pode ser lido por JavaScript no navegador (mitiga XSS) e não é enviado em requisições de outros sites (mitiga CSRF básico).
- Toda escrita de dados administrativos (empresas, catálogo, clientes, configurações) exige sessão válida, verificada no servidor a cada requisição — nunca apenas no frontend.
- Leitura pública é limitada ao necessário para o site institucional e o agendamento (catálogo de serviços/profissionais, disponibilidade de horários). Dados de clientes (telefone, e-mail, anotações) e o conteúdo completo de agendamentos só são retornados para quem está autenticado na própria empresa ou é super admin.
- O `JWT_SECRET` deve ser um valor longo, aleatório e exclusivo deste ambiente de produção — nunca reutilize um valor de exemplo ou de desenvolvimento.
- **Dados de cartão de crédito nunca são armazenados neste sistema.** O número completo, a validade e o CVV informados na página de assinatura são recebidos pelo backend e repassados imediatamente ao Asaas via HTTPS, sem serem gravados em log nem no banco de dados — apenas a bandeira e os 4 últimos dígitos (devolvidos pelo próprio Asaas) ficam salvos, só para exibição.
- Os campos de cobrança de uma empresa (`billing_type`, `billing_plan`) só podem ser alterados pelo Super Admin, nunca pela própria empresa; os campos de status da assinatura (`subscription_status`, `plan_expires_at`, dados do cartão) não são editáveis por nenhuma rota genérica — só são escritos internamente pelo fluxo de cobrança (`api/billing`) e pelo webhook do Asaas (`api/webhooks/asaas`), este último protegido por um token compartilhado (`ASAAS_WEBHOOK_TOKEN`).
- **Limite de tentativas de login**: tanto o login do admin da empresa quanto o do Super Admin bloqueiam novas tentativas após **3 senhas incorretas no mesmo dia** (fuso `America/Sao_Paulo`), liberando novamente à meia-noite. O contador é identificado por uma chave derivada do e-mail/slug informado — inclusive tentativas contra e-mails ou empresas inexistentes são contabilizadas, para não permitir enumerar contas válidas por tentativa e erro (`api/_lib/auth.ts`, tabela `login_attempts`).

---

## Backup e restauração

Cada empresa pode exportar (**Painel → Backup → Exportar backup**) um arquivo `.json` com todos os seus dados (serviços, categorias, profissionais, clientes, agendamentos, galeria, depoimentos) e restaurá-lo depois pelo mesmo painel. Isso é útil como cópia de segurança adicional e para mover dados entre ambientes — o banco de dados na Vercel já é a fonte de verdade e não depende desses backups para funcionar no dia a dia.

---

## Evolução do produto

| Nível | Stack | Status |
|---|---|---|
| 1 — Demonstração | React + LocalStorage/IndexedDB | Superado — usado apenas durante o desenvolvimento inicial do produto |
| 2 — Backend real | React + Vercel Postgres + Vercel Blob + funções serverless + autenticação JWT/bcrypt | Superado pelo nível 3 |
| 3 — Backend real + cobrança recorrente (atual) | + assinaturas com cobrança automática por cartão via Asaas, planos editáveis, cobrança manual por WhatsApp, termos de uso/LGPD/cookies | **Em produção** |
| 4 — SaaS autoatendido | + cadastro público de novas empresas, domínios próprios por empresa, integração com WhatsApp API oficial | Não implementado — hoje o cadastro de empresas é feito pelo super admin (Hello Inova), por decisão de escopo |

A camada `DataRepository`/`ImageStorage` foi criada exatamente para permitir essas evoluções sem reescrever o frontend.

---

## Checklist de entrega

- [x] Build do frontend (`npm install && npm run build`) sem erros de TypeScript
- [x] Verificação de tipos das funções de API (`npm run typecheck:api`) sem erros
- [x] Site público completo (home, serviços, profissional, sobre, galeria, contato, agendamento)
- [x] Agendamento com cálculo de disponibilidade (duração, horários, folgas, bloqueios, conflitos)
- [x] Painel administrativo completo (dashboard, agenda, serviços, categorias, profissionais, clientes, galeria, depoimentos, configurações, backup)
- [x] Super Admin com criação de novas empresas via assistente, já com login de administrador real
- [x] Banco de dados Postgres real, multiempresa, com isolamento total de dados por `business_id`
- [x] Autenticação real (bcrypt + JWT + cookie httpOnly), substituindo a autenticação de demonstração
- [x] Upload de imagens real (Vercel Blob), substituindo base64/IndexedDB
- [x] Upload de imagens por URL e por anexo, com preview e fallback, em todas as áreas visuais
- [x] Tabelas com scroll obrigatório (nunca quebram o layout)
- [x] Empresa demonstrativa "Beauty Demo" completa, com fotos reais relacionadas ao conteúdo
- [x] PWA (manifest, ícones, service worker)
- [x] SEO dinâmico (title, meta description, Open Graph, schema.org, robots.txt, sitemap.xml)
- [x] Responsivo (mobile-first, auditado em 320px/375px em todas as rotas)
- [x] Deploy automático na Vercel a cada `push` na branch `main`
- [x] Assinatura por plano (mensal/semestral/anual) com cobrança recorrente automática por cartão via Asaas
- [x] Aviso fixo de vencimento em todas as páginas do painel administrativo, com alerta destacado nos últimos 5 dias
- [x] Super Admin: excluir empresa, cobrar via WhatsApp (com Pix), editar planos, editar plano/tipo de cobrança por empresa
- [x] Termos de Uso, Política de Privacidade (LGPD) e Política de Cookies, com aceite obrigatório no primeiro login

---

Feito para ser uma base de produto real e reutilizável — não um protótipo descartável.
