<div align="center">

# 🏆 Bolão Copa 2026

**Dispute com amigos quem conhece mais de futebol.**  
Aposte nos 72 jogos, monte seu bracket e suba no ranking ao vivo.

[![Demo ao vivo](https://img.shields.io/badge/▶%20Jogar%20agora-bolao2026--a76c7.web.app-orange?style=for-the-badge&logo=firebase&logoColor=white)](https://bolao2026-a76c7.web.app)

</div>

---

## ✨ O que tem no bolão

| | Funcionalidade | Detalhe |
|---|---|---|
| ⚽ | **72 jogos de grupos** | Todos os jogos dos 12 grupos, com stepper +/− para celular |
| ⚡ | **Bracket interativo** | Clique para avançar times do R32 até a Final |
| 🏅 | **Ranking em tempo real** | Atualiza a cada resultado lançado pelo admin |
| 📋 | **Ver apostas de todos** | Bolão 100% transparente — veja o palpite de qualquer participante |
| 🔒 | **Bloqueio de apostas** | Admin trava antes da Copa começar; desbloqueio individual disponível |
| 🔧 | **Painel admin completo** | Resultados, ranking, usuários, editar apostas de qualquer um |
| 📄 | **Exportar boletim** | Download em HTML com todos os seus palpites |

---

## 🎯 Como pontua

### Fase de grupos

| Acerto | Pontos |
|--------|:------:|
| ✅ Placar exato — ex: apostou `2×1`, saiu `2×1` | **+3** |
| ✓ Resultado certo — ex: apostou `3×0`, saiu `2×1` (Brasil ganhou nos dois) | **+1** |
| ❌ Errou o vencedor | 0 |

### Mata-mata

O palpite vale se o **time que você escolheu avançar de fase avançou**, independente do slot no bracket.

| Acerto | Pontos |
|--------|:------:|
| ⚡ Time avançou para a próxima fase | **+2** |
| 🥉 Acertou o vencedor do 3° lugar (exato) | **+2** |
| 🏆 Acertou o campeão (exato) | **+2 +5 bônus** |

> **Pontuação máxima:** 285 pts — [ver cálculo completo em SCORING.md](SCORING.md)

---

## 🚀 Rodar localmente

```bash
# 1. Clone
git clone https://github.com/LucasRiboldi/bolao2026-claude.git
cd bolao2026-claude

# 2. Instale as dependências do seed (Node.js, apenas dev)
npm install

# 3. Sirva o frontend (qualquer servidor estático)
npx serve .
# → http://localhost:3000
```

---

## ⚙️ Configurar seu próprio bolão

### 1. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) → **Criar projeto**
2. Ative **Authentication → E-mail/Senha**
3. Crie banco **Firestore** em modo produção
4. Em **Project Settings → Apps → Web**, copie as credenciais

### 2. Colar credenciais

Edite [`js/config.js`](js/config.js):

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

### 3. Definir o e-mail admin

Em [`js/admin.js`](js/admin.js) e [`firestore.rules`](firestore.rules):

```js
// js/admin.js
const ADMIN_EMAIL = 'seu@email.com';
```
```
// firestore.rules
&& request.auth.token.email == 'seu@email.com'
```

### 4. Deploy

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

---

## 🧪 Seed de teste

Simula 10 participantes com apostas aleatórias para testar o sistema sem usuários reais.

```bash
# 1. Baixe o service account:
#    Firebase Console → Project Settings → Service Accounts → Gerar nova chave
#    Salve como service-account.json na raiz (já está no .gitignore)

# 2. Inicie o servidor de seed
node seed-server.js

# 3. Abra no browser
open http://localhost:5500/test-seed.html
```

**O que você encontra em `test-seed.html`:**

| Aba | O que faz |
|-----|-----------|
| 🌱 Seed | Cria 10 usuários + simula resultados + calcula ranking |
| 🔄 Recalcular | Recalcula ranking com os resultados atuais do Firestore |
| 📊 Relatório | Histograma de pontos, distribuição de palpites de campeão |
| 🔍 Auditoria | Verifica Firebase, completude de dados e consistência |
| 🧪 Testes Unitários | 32 testes automáticos com resultado ao vivo |

---

## 🗂️ Estrutura do projeto

```
bolao2026/
├── index.html           # SPA — toda a UI
├── css/styles.css       # Tema dark, variáveis CSS, mobile-first
├── js/
│   ├── config.js        # Firebase init
│   ├── data.js          # Times, grupos, bracket, pontuação, H2H
│   ├── utils.js         # Toast, loading, escapeHtml
│   ├── db.js            # CRUD Firestore
│   ├── auth.js          # Login/cadastro
│   ├── groupStage.js    # Fase de grupos
│   ├── knockout.js      # Bracket mata-mata
│   ├── standings.js     # Classificação oficial (API)
│   ├── ranking.js       # Cálculo de pontuação
│   ├── admin.js         # Painel admin
│   ├── results.js       # Lançamento de resultados (admin)
│   └── app.js           # Orquestrador
├── firestore.rules      # Regras de segurança
├── firebase.json        # Hosting + Firestore config
├── seed-server.js       # Servidor local de seed (porta 3001)
├── test-seed.html       # UI de teste com 5 abas
└── SCORING.md           # Sistema matemático completo
```

---

## 🔐 Modelo de dados (Firestore)

```
users/{uid}/
  profile/info    → { name, email, betsLocked, betsSavedAt }
  bets/groupStage → { [gameId]: { homeGoals, awayGoals } }   // 72 jogos
  bets/knockout   → { [matchId]: teamId }                    // R32 → Final

results/
  groupStage → { [gameId]: { homeGoals, awayGoals } }  // admin escreve
  knockout   → { [matchId]: teamId }                   // admin escreve

ranking/
  current → { entries: [{ uid, name, pts, breakdown }] }

config/
  admin → { whatsapp, globalLocked, registrationOpen }
```

### Regras de acesso resumidas

```
users/{uid}/bets     → leitura: qualquer autenticado (bolão transparente)
results/*            → leitura: autenticado  ·  escrita: só admin
ranking/current      → leitura: autenticado  ·  escrita: só admin
config/admin         → leitura: autenticado  ·  escrita: só admin
```

---

## 📜 Licença

MIT © [Lucas Riboldi](https://github.com/LucasRiboldi)
