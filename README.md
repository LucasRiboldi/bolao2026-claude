# 🏆 Bolão Copa do Mundo 2026

Aplicação web completa para gerenciar um bolão de palpites da **Copa do Mundo FIFA 2026**.  
Construída com HTML/CSS/JavaScript puro + Firebase — sem bundler, sem framework, sem build step.

[![Deploy Status](https://img.shields.io/badge/deploy-Firebase%20Hosting-orange?logo=firebase)](https://bolao2026-a76c7.web.app)
[![Firebase](https://img.shields.io/badge/backend-Firestore-yellow?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| 🔐 **Autenticação** | Cadastro e login via e-mail/senha (Firebase Auth) |
| ⚽ **Fase de Grupos** | 72 jogos, 12 grupos, draw oficial FIFA (dez/2025). Steppers +/− para inserir placares. Gols pré-preenchidos em 0. |
| ⚡ **Mata-Mata** | Bracket interativo R32 → Oitavas → Quartas → Semis → Final. Auto-gerado ao completar todos os grupos. |
| 🏅 **Ranking** | Placar em tempo real — calculado ao vivo com pontuação diferenciada |
| 📋 **Histórico** | Qualquer participante pode ver os palpites dos outros com status por jogo |
| 🔒 **Bloqueio de Apostas** | Apostas travadas após salvar; admin pode liberar individualmente |
| 📊 **Classificação Oficial** | Tabelas da copa via API externa (Standings) |
| 🔧 **Painel Admin** | Gestão de usuários: bloquear/liberar apostas, ver histórico, seed de teste |
| 📄 **Exportar Apostas** | Download do boletim HTML com todos os palpites para conferência |

---

## 🗂️ Estrutura do Projeto

```
bolao2026-claude/
├── index.html              # SPA — única página HTML
├── css/
│   └── styles.css          # Tema dark, variáveis CSS, mobile-first
├── js/
│   ├── config.js           # Inicialização do Firebase
│   ├── data.js             # Dados estáticos: times, grupos, bracket, scoring
│   ├── utils.js            # Helpers: showToast, showLoading, showSection
│   ├── db.js               # CRUD Firestore (bets, profile, ranking, results)
│   ├── auth.js             # Fluxo de autenticação (login/cadastro/logout)
│   ├── groupStage.js       # Renderização e lógica da fase de grupos
│   ├── knockout.js         # Bracket interativo mata-mata
│   ├── standings.js        # Classificação oficial (API externa)
│   ├── ranking.js          # Cálculo de pontuação e ranking de participantes
│   ├── admin.js            # Painel admin, histórico de apostas (modal)
│   └── app.js              # Controlador principal (roteamento de seções)
├── firestore.rules         # Regras de segurança Firestore
├── firebase.json           # Configuração de hosting e Firestore
├── seed-server.js          # Servidor Node local para seed de teste (Admin SDK)
├── seed.js                 # Script de seed alternativo (CLI)
├── test-seed.html          # UI de seed — simula 10 usuários com palpites aleatórios
└── package.json            # Dependências Node (firebase-admin — apenas para seed)
```

---

## 🃏 Arquitetura de Cards e UI

A interface é organizada em **seções navegáveis** (tabs) sem re-carregamento de página:

```
App (SPA)
├── Auth Screen
│   └── PublicRankingCard   — top 10 visível antes de logar
└── Dashboard Screen
    ├── Tab: Grupos
    │   ├── GroupCard [A-L]  — card por grupo com borda colorida
    │   │   └── GameRow      — linha por jogo: [Flag Team] [−][0][+] × [−][0][+] [Flag Team]
    │   └── KnockoutBracket  — colunas R32 / Oitavas / Quartas / Semis / Final
    ├── Tab: Classificação   — standings oficiais (API)
    ├── Tab: Ranking         — RankingRow com pts + botão 📋 histórico
    └── Tab: Admin (*)       — AdminUserRow: status + lock/unlock + histórico
```

> (\*) Visível apenas para o e-mail de admin configurado em `firestore.rules` e `js/admin.js`.

---

## 🗃️ Modelo de Dados (Firestore)

```
users/
  {uid}/
    profile/info           → { name, email, betsLocked, betsSavedAt, betsUnlockedAt }
    bets/groupStage        → { [gameId]: { homeGoals, awayGoals } }   // 72 jogos
    bets/knockout          → { [matchId]: teamId }                    // R32..Final

results/
  groupStage               → { [gameId]: { homeGoals, awayGoals } }   // preenchido pelo admin
  knockout                 → { [matchId]: teamId }                    // vencedor real por rodada

ranking/
  current                  → { entries: [{ uid, name, pts, breakdown }] }
```

---

## 🧮 Sistema de Pontuação

| Acerto | Pontos |
|--------|--------|
| Placar exato (grupos) | **+3 pts** |
| Resultado correto, placar errado (grupos) | **+1 pt** |
| Vencedor correto (mata-mata, qualquer rodada) | **+2 pts** |
| Bônus: campeão certo | **+5 pts** |

---

## 🔐 Regras de Segurança (Firestore)

```
users/{uid}/profile  →  R/W: próprio usuário ou admin
users/{uid}/bets     →  R: qualquer autenticado (bolão transparente)
                        W: próprio usuário ou admin
results/*            →  R: qualquer autenticado | W: somente admin
ranking/*            →  R: qualquer autenticado | W: somente admin
```

O admin é identificado pelo campo `request.auth.token.email` — configurar em `firestore.rules`.

---

## 🚀 Setup — Passo a Passo

### 1. Clonar o repositório

```bash
git clone https://github.com/LucasRiboldi/bolao2026-claude.git
cd bolao2026-claude
```

### 2. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. **Adicionar projeto** → nome → criar
3. Ative **Authentication → E-mail/Senha**
4. Crie o banco **Firestore** (modo produção)
5. Vá em **Project Settings → Seus apps → Web** → copie as credenciais

### 3. Configurar credenciais

Edite `js/config.js` com os valores do seu projeto:

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

### 4. Configurar admin

Em `firestore.rules` e `js/admin.js`, substitua o e-mail do admin:

```js
// js/admin.js
const ADMIN_EMAIL = 'seu-email@example.com';

// firestore.rules
&& request.auth.token.email == 'seu-email@example.com';
```

### 5. Instalar Firebase CLI e fazer deploy

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,hosting
```

### 6. Abrir no browser

Acesse `https://SEU_PROJETO.web.app` ou rode localmente com:

```bash
# Qualquer servidor estático funciona, ex:
npx serve .
# ou extensão Live Server no VS Code (porta padrão: 5500)
```

---

## 🧪 Seed de Teste (10 usuários simulados)

Útil para testar ranking e pontuação antes da competição.

### Requisitos
- Gere uma **Service Account** no Firebase Console → Project Settings → Service Accounts
- Salve como `service-account.json` na raiz (já no `.gitignore`)

```bash
npm install           # instala firebase-admin
node seed-server.js   # sobe servidor na porta 3001
```

Abra `test-seed.html` no browser (ou via `http://127.0.0.1:5500/test-seed.html`).  
Clique em **▶ Executar Seed** para criar 10 usuários com palpites e resultados aleatórios.

---

## 📦 Scripts disponíveis

```bash
node seed-server.js   # Servidor de seed com SSE (interface test-seed.html)
node seed.js          # Seed direto via terminal (sem UI)
```

---

## 🌐 Deploy Firebase (resumo rápido)

```bash
# Deploy completo (hosting + regras)
firebase deploy

# Apenas regras do Firestore
firebase deploy --only firestore:rules

# Apenas hosting
firebase deploy --only hosting
```

---

## 🤝 Contribuindo

Pull requests são bem-vindos. Para mudanças grandes, abra uma issue primeiro.

1. Fork → branch `feat/minha-feature`
2. Commit com mensagem descritiva
3. Pull Request para `main`

---

## 📄 Licença

MIT © [Lucas Riboldi](https://github.com/LucasRiboldi)
