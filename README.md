# Bolão Copa do Mundo 2026

**Plataforma de palpites para a Copa do Mundo FIFA 2026** — ranking em tempo real, bracket interativo e painel admin completo. Construída sem framework, sem bundler, sem servidor de aplicação. Só Firebase.

[![Demo ao vivo](https://img.shields.io/badge/Demo%20ao%20vivo-bolao2026--a76c7.web.app-orange?logo=firebase&logoColor=white)](https://bolao2026-a76c7.web.app)
[![Stack](https://img.shields.io/badge/stack-HTML%20·%20CSS%20·%20JS%20puro-blue)](#)
[![Backend](https://img.shields.io/badge/backend-Firebase%20Auth%20·%20Firestore%20·%20Hosting-yellow?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Funcionalidades

| | Recurso | Descrição |
|---|---|---|
| 🔐 | **Autenticação** | Cadastro e login via e-mail/senha (Firebase Auth). Registro pode ser bloqueado pelo admin. |
| ⚽ | **Fase de Grupos** | 72 jogos, 12 grupos, sorteio oficial FIFA. Steppers +/− mobile-first para inserir placares. |
| ⚡ | **Mata-Mata** | Bracket interativo R32 → Oitavas → Quartas → Semis → Final. Gerado automaticamente ao completar os grupos. |
| 🏅 | **Ranking** | Calculado ao vivo ou via cache Firestore. Desempate por placares exatos, resultados, KO e nome. |
| 📋 | **Histórico de Apostas** | Modal com todos os palpites, resultado real de cada jogo e pontuação parcial detalhada. |
| 🔒 | **Bloqueio de Apostas** | Lock/unlock global (todos) ou individual por participante. Admin pode editar apostas de qualquer usuário. |
| 🔧 | **Painel Admin** | Gestão de usuários, lançamento de resultados, recálculo de ranking, controle de cadastro e WhatsApp. |
| 📊 | **Classificação Oficial** | Tabelas da copa via API externa, exibida em aba separada. |
| 📄 | **Exportar** | Download do boletim HTML com todos os palpites do participante. |

---

## Sistema de Pontuação

### Fase de Grupos

| Acerto | Pontos |
|--------|--------|
| Placar exato (ex: 2×1 = 2×1) | **+3 pts** |
| Resultado correto (ex: 3×0 quando real foi 2×1) | **+1 pt** |
| Resultado errado | 0 pts |

### Mata-Mata

O palpite pontua se o **time apostado avançou de fase** — independentemente de qual slot/partida específica ele disputou no bracket real.

| Acerto | Pontos |
|--------|--------|
| Time avançou para a próxima fase | **+2 pts** |
| Time foi eliminado | 0 pts |
| Acertou o campeão (Final) | **+2 pts + 5 pts bônus** |

> **Pontuação máxima possível:** 283 pts (216 grupos + 62 KO + 5 bônus).  
> Documentação matemática completa em [SCORING.md](SCORING.md).

---

## Estrutura do Projeto

```
bolao2026/
├── index.html              # SPA — única página HTML
├── css/
│   └── styles.css          # Tema dark, variáveis CSS, mobile-first
├── js/
│   ├── config.js           # Inicialização do Firebase
│   ├── data.js             # Times, grupos, bracket, scoring, helpers
│   ├── utils.js            # showToast, showLoading, escapeHtml, debounce
│   ├── db.js               # CRUD Firestore — bets, profile, ranking, results, config
│   ├── auth.js             # Fluxo de autenticação e controle de cadastro
│   ├── groupStage.js       # Fase de grupos — steppers, lock, auto-simulate
│   ├── knockout.js         # Bracket mata-mata interativo
│   ├── standings.js        # Classificação oficial via API externa
│   ├── ranking.js          # Cálculo de pontuação e ranking
│   ├── admin.js            # Painel admin, histórico, edição, toggle lock
│   ├── results.js          # Lançamento de resultados oficiais (admin)
│   └── app.js              # Controlador principal e navegação
├── firestore.rules         # Regras de segurança Firestore
├── firebase.json           # Configuração hosting e Firestore
├── seed-server.js          # Servidor Node local para seed de teste (porta 3001)
├── test-seed.html          # UI de seed — simula 10 usuários com apostas aleatórias
└── package.json            # Dependências Node (firebase-admin — apenas seed)
```

---

## Modelo de Dados (Firestore)

```
users/{uid}/
  profile/info    { name, email, betsLocked, betsSavedAt }
  bets/groupStage { [gameId]: { homeGoals, awayGoals } }   // 72 jogos
  bets/knockout   { [matchId]: teamId }                    // R32..Final

results/
  groupStage      { [gameId]: { homeGoals, awayGoals } }   // admin escreve
  knockout        { [matchId]: teamId }                    // admin escreve

ranking/
  current         { entries: [{ uid, name, pts, breakdown }] }

config/
  admin           { whatsapp, globalLocked, registrationOpen }
```

---

## Setup

### Pré-requisitos

- Conta Google e projeto Firebase (gratuito)
- Node.js 18+ (apenas para o seed de teste)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`

### 1. Clonar e instalar

```bash
git clone https://github.com/LucasRiboldi/bolao2026-claude.git
cd bolao2026-claude
npm install          # instala firebase-admin para o seed
```

### 2. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative **Authentication → E-mail/Senha**
4. Crie o banco **Firestore** em modo produção
5. Em **Project Settings → Web**, copie as credenciais

### 3. Configurar credenciais

Edite [`js/config.js`](js/config.js) com as credenciais do seu projeto:

```js
const FIREBASE_CONFIG = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "SEU_PROJETO.firebaseapp.com",
  projectId:         "SEU_PROJETO",
  storageBucket:     "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_SENDER_ID",
  appId:             "SEU_APP_ID"
};
```

### 4. Configurar o e-mail admin

Em [`js/admin.js`](js/admin.js) e [`firestore.rules`](firestore.rules):

```js
// js/admin.js
const ADMIN_EMAIL = 'seu@email.com';
```

```
// firestore.rules
&& request.auth.token.email == 'seu@email.com';
```

### 5. Deploy

```bash
firebase login
firebase deploy                        # completo (hosting + rules)
firebase deploy --only hosting         # só o frontend
firebase deploy --only firestore:rules # só as regras
```

---

## Seed de Teste (desenvolvimento)

Simula 10 participantes com apostas aleatórias e resultados calculados.

```bash
# 1. Gere o service account no Firebase Console →
#    Project Settings → Service Accounts → Gerar nova chave privada
#    Salve como service-account.json na raiz do projeto

# 2. Inicie o servidor de seed
node seed-server.js   # porta 3001

# 3. Abra no browser
open http://127.0.0.1:5500/test-seed.html
```

Endpoints disponíveis em `http://localhost:3001`:

| Endpoint | Ação |
|----------|------|
| `/api/ping` | Verifica conexão com o Firebase |
| `/api/seed` | Cria 10 usuários + simula resultados + ranking |
| `/api/clear` | Remove todos os dados de teste |
| `/api/recalc` | Recalcula ranking com resultados atuais |
| `/api/report` | Relatório completo de participação |
| `/api/audit` | Auditoria + testes unitários de pontuação |

---

## Regras de Segurança

```
users/{uid}/profile  →  leitura/escrita: próprio usuário ou admin
users/{uid}/bets     →  leitura: qualquer autenticado (bolão transparente)
                         escrita: próprio usuário ou admin
results/*            →  leitura: qualquer autenticado | escrita: só admin
ranking/*            →  leitura: qualquer autenticado | escrita: só admin
config/*             →  leitura: qualquer autenticado | escrita: só admin
```

---

## Licença

MIT © [Lucas Riboldi](https://github.com/LucasRiboldi)
