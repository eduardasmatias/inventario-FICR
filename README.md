# InfraTrack — Inventário de Ativos de TI

Projeto Final da disciplina **Redes de Computadores e Cloud Computing** (FICR, 2026.2, Prof. Wagner Johnatan da Silva).

O InfraTrack é uma aplicação web para controlar o inventário de TI de uma empresa: equipamentos (notebooks, servidores, access points…), os setores onde estão, os responsáveis técnicos e as entregas de notebooks a colaboradores, com termo de responsabilidade em PDF.

O banco de dados é um **PostgreSQL gerenciado no Supabase**, o modelo de **Banco de Dados como Serviço (DBaaS)** pedido no projeto.

- **Aplicação online:** https://inventario-ficr.vercel.app/
- **Plataforma de nuvem:** Supabase (Plano Free)
- **Hospedagem do front-end:** Vercel

---

## Sumário

1. [Equipe](#equipe)
2. [Arquitetura](#arquitetura)
3. [Modelo de dados](#modelo-de-dados)
4. [Funcionalidades](#funcionalidades)
5. [Como rodar localmente](#como-rodar-localmente)
6. [Deploy na Vercel](#deploy-na-vercel)
7. [Checklist do projeto](#checklist-do-projeto)
8. [Roteiro da demonstração ao vivo (Parte 3)](#roteiro-da-demonstração-ao-vivo-parte-3)
9. [Segurança e Modelo de Responsabilidade Compartilhada](#segurança-e-modelo-de-responsabilidade-compartilhada)
10. [Conceitos de Cloud Computing aplicados](#conceitos-de-cloud-computing-aplicados)

---

## Equipe

| Integrante | Parte sob responsabilidade |
|---|---|
| Anna Eduarda | _(preencher)_ |
| Isabela | _(preencher)_ |
| Lucas Cardoso | _(preencher)_ |

Cada integrante tem conta individual no Supabase, na organização **Inventário de Ativos TI - FICR**.

---

## Arquitetura

```
┌──────────────────────┐   HTTPS (REST + WebSocket)   ┌───────────────────────────────┐
│  Navegador           │ ───────────────────────────▶ │  Supabase (nuvem)             │
│  React + Vite        │                              │  ├─ Auth (login e-mail/senha) │
│  (hospedado na       │ ◀─────────────────────────── │  ├─ PostgREST (API REST)      │
│   Vercel)            │   eventos Realtime           │  ├─ Realtime (WebSocket)      │
└──────────────────────┘                              │  └─ PostgreSQL + RLS          │
                                                      └───────────────────────────────┘
```

- **Front-end:** React 19 + Vite, estilizado com Tailwind (via CDN) e ícones `lucide-react`.
- **Comunicação com o banco:** SDK oficial `@supabase/supabase-js` ([src/supabaseClient.js](src/supabaseClient.js)). Cada operação da tela vira uma chamada à API do Supabase, por exemplo:
  - Create: `supabase.from('setor').insert([...])`
  - Read: `supabase.from('ativo').select('*, setor(nome, localizacao), responsavel(nome, email)')`
  - Update: `supabase.from('setor').update(...).eq('id_setor', id)`
  - Delete: `supabase.from('setor').delete().eq('id_setor', id)`
- **Tempo real:** a aplicação assina o canal `postgres_changes` do Supabase Realtime para as 4 tabelas. Qualquer alteração no banco (feita pelo app, por outro usuário ou direto no painel do Supabase) atualiza a tela na hora, sem recarregar a página. O selo **"Ao vivo"** no topo mostra que a conexão está ativa.
- **Autenticação:** Supabase Auth com e-mail e senha. Sem login, nenhuma tela de dados é exibida e a API não devolve nenhum registro, por causa do RLS.

Toda a lógica fica em [src/App.jsx](src/App.jsx).

---

## Modelo de dados

Banco relacional (PostgreSQL) com 4 tabelas no schema `public`:

```
setor (1) ──────< (N) ativo (N) >────── (1) responsavel

entrega_equipamento   (tabela independente: registro de entrega de notebook)
```

| Tabela | Colunas | Chaves |
|---|---|---|
| `setor` | `id_setor` int8, `nome` varchar, `localizacao` varchar | PK `id_setor` |
| `responsavel` | `id_responsavel` int8, `nome` varchar, `email` varchar, `telefone` varchar | PK `id_responsavel` |
| `ativo` | `id_ativo` int8, `nome` varchar, `tipo` varchar, `endereco_ip` inet, `endereco_mac` macaddr, `status` varchar, `data_cadastro` date, `id_setor` int8, `id_responsavel` int8 | PK `id_ativo`; FK `id_setor` → `setor`; FK `id_responsavel` → `responsavel` |
| `entrega_equipamento` | `id_entrega` int4, `colaborador` text, `email_colaborador` text, `usuario_rede` text, `modelo_maquina` text, `numero_serie` text, `data_entrega` date | PK `id_entrega` |

Os tipos `inet` e `macaddr` são nativos do PostgreSQL e garantem que IP e MAC sejam válidos, o que tem tudo a ver com a parte de Redes da disciplina.

Um setor que ainda tem ativos vinculados não pode ser excluído (a FK impede); o app mostra uma mensagem explicando isso.

---

## Funcionalidades

- **Login** com Supabase Auth.
- **Ativos de TI:** cadastro, listagem, edição e exclusão; busca por nome, IP ou setor; filtros por setor e status; painel com totais (ativos, operacionais, em manutenção, notebooks entregues).
- **Setores** e **Responsáveis TI:** CRUD completo.
- **Entregas / Termos:** registro da entrega de notebook a um colaborador e geração do **termo de responsabilidade** (copiar texto ou imprimir/salvar PDF).
- **Confirmação antes de excluir** qualquer registro.
- **Sincronização em tempo real** com o banco (Supabase Realtime).

---

## Como rodar localmente

Pré-requisitos: **Node.js 20+** e npm.

1. Clone o repositório e instale as dependências:

   ```bash
   git clone https://github.com/eduardasmatias/inventario-FICR.git
   cd inventario-FICR
   npm install
   ```

2. Crie o arquivo `.env` a partir do exemplo e preencha com a URL e a chave pública do projeto (Supabase → Project Settings → API):

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_SUA_CHAVE_PUBLICA
   ```

3. Rode o servidor de desenvolvimento e abra o endereço que aparecer (normalmente http://localhost:5173):

   ```bash
   npm run dev
   ```

Outros comandos: `npm run build` (gera a versão de produção em `dist/`), `npm run preview` (serve o build localmente) e `npm run lint` (Oxlint).

### Configuração do banco (uma vez só)

Para o tempo real funcionar, as tabelas precisam estar na publicação `supabase_realtime`. No **SQL Editor** do Supabase:

```sql
alter publication supabase_realtime
  add table public.ativo, public.setor, public.responsavel, public.entrega_equipamento;
```

Ou pelo painel: **Database → Publications → supabase_realtime** e marcar as 4 tabelas.

---

## Deploy na Vercel

1. Importe o repositório do GitHub na Vercel (framework detectado: **Vite**).
2. Em **Settings → Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. A cada push na branch `main`, a Vercel gera um novo deploy automaticamente.

As chaves ficam nas variáveis de ambiente da Vercel, nunca no repositório.

---

## Checklist do projeto

### Parte 1 — Modelo Conceitual e Lógico (1,0 pt)

- [x] Tema escolhido: inventário de ativos de TI
- [x] Modelo conceitual (DER) com entidades, atributos e cardinalidades
- [x] Modelo lógico com tabelas, tipos, PKs e FKs (seção [Modelo de dados](#modelo-de-dados))
- [x] PDF com a Ficha de Identificação do Trio e a plataforma escolhida (Supabase), entregue no AVA

### Parte 2 — Aplicação Web (1,0 pt)

- [x] Telas de cadastro, listagem, edição e exclusão para todas as entidades
- [x] Integração real com o Supabase pelo SDK oficial, sem dados mockados
- [x] Publicada online na Vercel: https://inventario-ficr.vercel.app/
- [x] Navegação sem erros críticos, com mensagens de sucesso e erro para o usuário

### Parte 3 — Banco de Dados em Nuvem funcionando (2,0 pts)

**CRUD em tempo real (1,0 pt)**
- [x] Create, Read, Update e Delete pela aplicação, refletindo na hora no Table Editor do Supabase
- [x] Caminho inverso: alteração feita no painel do Supabase aparece na aplicação sem recarregar (Supabase Realtime)

**Governança e IAM em trio (0,5 pt)**
- [x] Organização no Supabase com os 3 integrantes, cada um com conta própria
- [x] Papéis atribuídos (Owner e Administrator), sem compartilhar login e senha

**Segurança e boas práticas (0,5 pt)**
- [x] Row-Level Security ativo nas 4 tabelas, com políticas liberando acesso só para usuários autenticados
- [x] Sem login, a API devolve zero registros, mesmo com a chave pública
- [x] `.env` listado no `.gitignore` e nunca commitado; `.env.example` sem valores reais
- [x] Apenas a chave **pública** (publishable/anon) é usada no front-end; a chave secreta (`service_role`) nunca sai do painel do Supabase
- [x] Variáveis de produção configuradas na Vercel

---

## Roteiro da demonstração ao vivo (Parte 3)

Deixe a aplicação e o Supabase abertos lado a lado.

**1. CRUD do app para o banco**
1. Entre no InfraTrack e confira o selo **"Ao vivo"** no topo.
2. Em **Setores**, clique em **Adicionar** e crie um setor de teste.
3. No Supabase, abra **Table Editor → setor**: o registro está lá.
4. Edite o setor no app e mostre a alteração no Table Editor.
5. Exclua o setor no app (confirme a pergunta) e mostre que ele sumiu do Table Editor.

**2. Do banco para o app (tempo real)**
1. No **Table Editor → setor**, clique em **Insert → Insert row** e crie um registro.
2. Sem tocar no app, mostre que o novo setor apareceu sozinho na lista.
3. Edite ou apague a linha no Table Editor e mostre a tela do app mudando na hora.

**3. Governança e IAM**
- **Organization → Team:** os 3 integrantes com seus papéis.

**4. Segurança**
- **Database → Policies:** RLS ativo nas 4 tabelas, políticas aplicadas ao papel `authenticated`.
- Mostre o `.gitignore` com o `.env` e o repositório no GitHub sem esse arquivo.
- Explique que a chave pública pode ficar no navegador porque quem protege os dados é o RLS.

---

## Segurança e Modelo de Responsabilidade Compartilhada

No modelo de responsabilidade compartilhada, a nuvem e o cliente dividem a segurança:

| Responsabilidade do Supabase (provedor) | Responsabilidade da equipe (cliente) |
|---|---|
| Infraestrutura física, rede e servidores | Definir quem pode acessar cada tabela (RLS) |
| Disponibilidade e backups do PostgreSQL | Proteger chaves e variáveis de ambiente |
| Criptografia em trânsito (HTTPS/TLS) | Gerenciar membros e papéis da equipe (IAM) |
| Atualizações e patches do banco | Usar a chave certa no lugar certo (pública no front, secreta nunca) |

**Como a equipe cumpriu a sua parte:**

- **Row-Level Security (RLS):** ativado em `ativo`, `setor`, `responsavel` e `entrega_equipamento`. Cada tabela tem uma política `ALL` aplicada somente ao papel `authenticated`. Um visitante sem login, mesmo tendo a chave pública, recebe uma lista vazia.
- **Chaves e variáveis de ambiente:** a URL e a chave ficam no `.env` (local) e nas variáveis de ambiente da Vercel (produção). O `.env` está no `.gitignore` e nunca foi enviado ao GitHub.
- **IAM:** cada integrante acessa o painel com a própria conta, com papel definido, sem login compartilhado.

---

## Conceitos de Cloud Computing aplicados

**Modelos de serviço (XaaS) usados no projeto**

| Recurso | Modelo |
|---|---|
| Supabase Database (PostgreSQL gerenciado) | **DBaaS** |
| Supabase Auth (login de usuários) | **IDaaS** |
| Supabase como plataforma completa (API, Auth, Realtime) | **BaaS / PaaS** |
| Vercel (hospedagem do front-end) | **PaaS** |
| InfraTrack para o usuário final | **SaaS** |

**As 5 características essenciais do NIST**

| Característica | Onde aparece |
|---|---|
| Autoatendimento sob demanda | Projeto, banco e deploy criados pelo painel, sem falar com ninguém do provedor |
| Amplo acesso à rede | App e banco acessíveis de qualquer lugar via HTTPS |
| Agrupamento de recursos | O plano Free roda em infraestrutura compartilhada entre vários clientes |
| Elasticidade rápida | Supabase e Vercel escalam conforme a demanda, sem configurar servidores |
| Serviço mensurado | O painel mostra uso de banco, requisições e banda, dentro dos limites do plano gratuito |

**Plano gratuito:** o projeto roda 100% no Plano Free do Supabase e no plano Hobby da Vercel, sem cartão de crédito. Projetos Free do Supabase pausam após 7 dias sem uso; reative pelo painel antes da apresentação, se for preciso.
