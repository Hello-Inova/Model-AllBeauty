# Plataforma White-Label de Catálogo e Agendamento Online

Uma base de produto reutilizável para catálogo de serviços e agendamento online, pensada para salões de beleza, barbearias, clínicas de estética, spas, studios de unhas/cílios/sobrancelhas, clínicas de massagem, centros de bem-estar e profissionais autônomos baseados em agendamento.

**A mesma base de código atende múltiplas empresas.** O que muda entre clientes são os dados, a identidade visual, os serviços, os profissionais, os horários e as imagens — nunca o código-fonte.

> Repositório oficial: https://github.com/Hello-Inova/Model-AllBeauty

---

## Índice

1. [Instalação e desenvolvimento](#instalação-e-desenvolvimento)
2. [Deploy no GitHub Pages](#deploy-no-github-pages)
3. [Como criar uma nova empresa (sem código)](#como-criar-uma-nova-empresa-sem-código)
4. [Acessos de demonstração](#acessos-de-demonstração)
5. [Arquitetura](#arquitetura)
6. [Estrutura de pastas](#estrutura-de-pastas)
7. [Limitações do modo GitHub Pages](#limitações-do-modo-github-pages)
8. [Segurança](#segurança)
9. [Evolução para SaaS](#evolução-para-saas)
10. [Checklist de entrega](#checklist-de-entrega)

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

### Build de produção

```bash
npm run build
```

Gera a pasta `/dist`, pronta para publicação em qualquer hospedagem estática (não depende de Node.js, PHP, banco de dados ou backend próprio em produção).

### Pré-visualizar o build

```bash
npm run preview
```

---

## Deploy no GitHub Pages

Este repositório já inclui um workflow do GitHub Actions (`.github/workflows/deploy.yml`) que builda e publica o site automaticamente a cada `push` na branch `main`.

**Passo a passo:**

1. Envie este código para o repositório `https://github.com/Hello-Inova/Model-AllBeauty` (branch `main`).
2. No GitHub, acesse **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **GitHub Actions**.
4. Aguarde a Action "Deploy to GitHub Pages" concluir (aba **Actions** do repositório).
5. O site ficará disponível em `https://hello-inova.github.io/Model-AllBeauty/`.

O workflow builda o projeto com `VITE_BASE_PATH=/Model-AllBeauty/`, garantindo que CSS, JavaScript, imagens e ícones carreguem corretamente dentro do subcaminho do repositório. Caso o repositório seja publicado como um site raiz de usuário/organização (`https://hello-inova.github.io/`), ajuste essa variável para `/` no arquivo do workflow.

### Roteamento

A aplicação usa **HashRouter** (URLs como `/#/empresa/beauty-demo`). Isso é proposital: hospedagem estática como o GitHub Pages não suporta rewrites de servidor, e o HashRouter garante que **atualizar a página, compartilhar links diretos e navegar entre seções sempre funcione**, sem necessidade de configuração adicional. Como reforço extra, o workflow também copia `index.html` para `404.html` no build.

---

## Como criar uma nova empresa (sem código)

Não é necessário alterar uma linha de código para publicar o site de uma nova empresa.

1. Acesse **`/#/super-admin/login`** e entre com as credenciais de demonstração (veja abaixo).
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
   9. Configurações (plano)
   10. Revisão e publicação
4. Ao concluir, a empresa já está no ar em `/#/empresa/<slug-da-empresa>` e pronta para receber agendamentos.
5. Use o **painel administrativo** (`/#/admin/<slug>/login`) para refinar tudo depois: adicionar mais serviços, fotos, profissionais, ajustar preços, políticas de agendamento etc. — tudo pelo navegador.

### O que pode ser personalizado pelo painel, sem código

Nome, logo, favicon, cores (primária/secundária/destaque/fundo), descrição, textos, serviços, categorias, preços, duração, profissionais e suas fotos, horários de funcionamento (com múltiplos períodos, ex: 08h–12h e 14h–18h), bloqueios e folgas, galeria de imagens, depoimentos, banners, WhatsApp, redes sociais, endereço e políticas de agendamento (antecedência mínima, prazo máximo, cancelamento, intervalo entre atendimentos, tolerância de atraso).

---

## Acessos de demonstração

> ⚠️ Autenticação de demonstração — válida apenas para avaliar o produto neste ambiente local/estático. Veja [Segurança](#segurança).

| Painel | URL | Usuário | Senha |
|---|---|---|---|
| Admin da empresa demo | `/#/admin/beauty-demo/login` | qualquer e-mail | `demo123` |
| Super Admin | `/#/super-admin/login` | `super@plataforma.com` | `superadmin123` |

A empresa de demonstração **Beauty Demo** já vem com dados completos: 14 serviços, 7 categorias, 6 profissionais, 12 clientes, 12 agendamentos (com status variados), 12 imagens na galeria e 6 depoimentos — todos claramente identificados como **dados demonstrativos**, com fotos reais licenciadas do Unsplash relacionadas a cada conteúdo (cabelo, unhas, sobrancelhas, cílios, massagem, skincare etc.).

---

## Arquitetura

```
MESMO SISTEMA
   ↓
DADOS DA EMPRESA (business_id)
   ↓
SITE + PAINEL DA EMPRESA
```

- **Multiempresa real:** toda entidade (serviços, categorias, profissionais, clientes, agendamentos, horários, bloqueios, galeria, depoimentos) é isolada por `businessId`. Nunca há mistura de dados entre empresas.
- **Camada de dados única (`DataRepository`):** nenhum componente acessa `localStorage` diretamente. Todos passam por `src/repositories/DataRepository.ts`, hoje implementado por `LocalStorageProvider`. Trocar para um backend real (Supabase, Firebase, API REST) significa criar um novo provider que implementa a mesma interface — **o frontend não muda**.
- **Camada de imagens (`ImageStorage`):** mesmo princípio. Hoje implementado por `LocalImageStorage` (IndexedDB para anexos, URL direta para imagens externas). Preparado para `SupabaseImageStorage` / `FirebaseImageStorage` / `CloudinaryImageStorage` no futuro.
- **Identidade visual dinâmica:** cada empresa define suas cores, que são injetadas como CSS Variables (`--color-primary`, `--color-secondary`, etc.) em tempo de execução — o mesmo CSS atende qualquer paleta.
- **Componente único de upload de imagem (`ImageUploader`):** usado em todas as áreas administrativas (logo, favicon, capa, hero, serviços, profissionais, galeria, depoimentos, banners), com suporte a URL e anexo de arquivo, preview, validação e fallback — nunca duplicado por módulo.
- **Tabelas com scroll obrigatório (`ScrollableTable`):** toda tabela do sistema usa esse componente, garantindo que nenhuma tabela jamais quebre o layout, com scroll horizontal e vertical contidos dentro do próprio componente.

---

## Estrutura de pastas

```
src/
├── components/       Componentes reutilizáveis (públicos, admin e genéricos)
├── pages/            Páginas (public/, admin/, superadmin/)
├── layouts/           Layouts (público, admin, super admin)
├── repositories/      Camada de dados e de imagens (DataRepository, ImageStorage, providers/)
├── contexts/          BusinessContext, AuthContext, ToastContext
├── hooks/             Hooks de dados (useServices, useAppointments, useImage, ...)
├── types/             Tipos TypeScript de todas as entidades
├── utils/             Disponibilidade de horários, formatação, validação, WhatsApp, slugs
├── config/            Constantes globais
├── themes/            Aplicação de tema/CSS variables
└── data/              Dados demonstrativos (empresa "Beauty Demo")
```

---

## Limitações do modo GitHub Pages

Este modo (Nível 1 da arquitetura) é adequado para **demonstração, protótipo, MVP, uso local e apresentação comercial**.

Como o armazenamento é local ao navegador (localStorage + IndexedDB para imagens anexadas):

- **Os dados não sincronizam automaticamente entre computadores, navegadores ou celulares.** Cada dispositivo/navegador tem sua própria cópia dos dados.
- Limpar os dados do navegador apaga os dados da(s) empresa(s) — **faça backups regulares** pelo painel administrativo (Backup → Exportar).
- Múltiplos atendentes usando o painel ao mesmo tempo em dispositivos diferentes **não veem as mudanças um do outro** em tempo real.
- WhatsApp e o mapa incorporado dependem de conexão com a internet.

Para uma operação comercial real com múltiplos usuários simultâneos, é necessário evoluir para o **Nível 2/3** (veja abaixo): backend, banco de dados, autenticação real, API e armazenamento de arquivos. **O armazenamento local não deve ser apresentado como solução definitiva para produção multiusuário.**

---

## Segurança

O login administrativo deste build é **autenticação de demonstração**, feita inteiramente no frontend (sem servidor). Ela impede acesso casual à interface, mas **não é segurança real** — qualquer pessoa com acesso ao navegador/DevTools pode contornar essa proteção. Não use dados sensíveis de clientes reais neste modo sem estar ciente dessa limitação.

Ao evoluir para backend, substitua `src/contexts/AuthContext.tsx` por autenticação real (Supabase Auth, Firebase Auth ou JWT via API), com controle de acesso aplicado no servidor — nunca apenas no cliente.

---

## Evolução para SaaS

O projeto foi desenhado em três níveis:

| Nível | Stack | Objetivo |
|---|---|---|
| 1 — GitHub Pages (este build) | React + LocalStorage/IndexedDB + PWA | MVP funcional e demonstração |
| 2 — Backend | + Supabase/Firebase/API REST | Banco centralizado e sincronização real |
| 3 — SaaS | + multi-tenancy no backend, autenticação real, pagamentos (Asaas/Mercado Pago/Stripe), planos, domínios próprios, WhatsApp API, storage de imagens em nuvem | Produto comercial completo |

Nenhuma dessas evoluções exige reescrever o frontend: a camada `DataRepository`/`ImageStorage` foi criada exatamente para isso.

---

## Checklist de entrega

- [x] Build (`npm install && npm run build`) sem erros de TypeScript
- [x] Site público completo (home, serviços, profissional, sobre, galeria, contato, agendamento)
- [x] Agendamento com cálculo de disponibilidade (duração, horários, folgas, bloqueios, conflitos)
- [x] Painel administrativo completo (dashboard, agenda, serviços, categorias, profissionais, clientes, galeria, depoimentos, configurações, backup)
- [x] Super Admin com criação de novas empresas via assistente
- [x] Upload de imagens por URL e por anexo, com preview e fallback, em todas as áreas visuais
- [x] Tabelas com scroll obrigatório (nunca quebram o layout)
- [x] Multiempresa com isolamento total de dados
- [x] Empresa demonstrativa "Beauty Demo" completa, com fotos reais relacionadas ao conteúdo
- [x] PWA (manifest, ícones, service worker)
- [x] SEO dinâmico (title, meta description, Open Graph, schema.org, robots.txt, sitemap.xml)
- [x] Responsivo (mobile-first)
- [x] GitHub Actions para deploy automático no GitHub Pages
- [x] Arquitetura preparada para backend real (Supabase/Firebase/API)

---

Feito para ser uma base de produto real e reutilizável — não um protótipo descartável.
