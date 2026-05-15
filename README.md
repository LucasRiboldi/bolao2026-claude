<div align="center">

<img src="https://img.shields.io/badge/⚽-Copa_do_Mundo_2026-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/🔥-Bolão_dos_Amigos-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/🏆-Quem_vai_ganhar%3F-yellow?style=for-the-badge" />

# 🎉 Bolão Copa 2026

### _Quem sabe mais de futebol no grupo? Chegou a hora de provar!_ ⚽🔥

Aposte nos **72 jogos** da fase de grupos, monte seu **bracket completo** até o campeão e suba no **ranking ao vivo** com seus amigos.
É rápido, é grátis, é divertido — e você vai querer mandar o link agora mesmo no WhatsApp. 📲

[![🚀 Jogar agora!](https://img.shields.io/badge/▶%20Jogar%20agora!-bolao2026--a76c7.web.app-FF6B35?style=for-the-badge&logo=firebase&logoColor=white)](https://bolao2026-a76c7.web.app)

</div>

---

## 🎮 O que tem de bom aqui

> Tudo que um bolão decente precisa — sem complicação, sem planilha de Excel, sem dor de cabeça.

| | O que é | Como funciona |
|:---:|---|---|
| ⚽ | **72 jogos de grupos** | Aposte no placar de cada jogo dos 12 grupos. Botõezinhos +/− que funcionam no celular. Sem teclado numérico, juro! |
| ⚡ | **Bracket interativo** | Clique e arraste seus favoritos do R32 até a Grande Final. Veja seu bracket ganhar vida! |
| 🏅 | **Ranking ao vivo** | O admin lança os resultados e os pontos aparecem na hora. Quem tá na frente não dorme. |
| 👀 | **Apostas transparentes** | Todo mundo vê o palpite de todo mundo. Aquele amigo que diz "eu já sabia" não tem mais escapatória. |
| 🔒 | **Trava automática** | Admin trava as apostas antes da Copa começar. Sem editar depois, sem desculpa! |
| 🛠️ | **Painel admin completo** | Resultados, ranking, usuários, bloqueio individual — tudo numa tela só. |
| 📊 | **Exportar boletim** | Baixe seus palpites em HTML pra mostrar que você acertou desde o começo. |

---

## 🏆 Como ganhar pontos

### ⚽ Fase de Grupos — 72 jogos para pontuar!

| Você apostou | Deu | Resultado | Pontos |
|:---:|:---:|:---:|:---:|
| `2 × 1` | `2 × 1` | ✅ **Placar exato** — você é um vidente | **+17** |
| `3 × 0` | `2 × 0` | ✓ **Resultado certo** — pelo menos a direção tava certa | **+8** |
| `1 × 0` | `0 × 2` | ❌ **Errou feio** — sem pontos, sem choro | **0** |

> ℹ️ Acertou o placar exato? Recebe os **17 pontos** — não acumula com o de resultado. Já é suficiente! 😄

---

### ⚡ Mata-Mata — aposte na trajetória dos times!

Aqui você aposta **quem vai avançar** em cada confronto. Se o time que você escolheu passar de fase, você pontua — não importa de qual posição do chaveamento ele veio!

| Fase | Pontos por time acertado |
|------|:---:|
| 🟤 Time avança para os **32-avos** | **+5** |
| 🔵 Time avança para os **16-avos** | **+11** |
| 🟣 Time avança para as **Quartas** | **+20** |
| 🟠 Time avança para a **Semi** | **+40** |
| 🥉 Acertou o **3º lugar** | **+5** |
| 🏆 Acertou o **Campeão** | **+71** |
| 🎊 Acertou os **dois finalistas** | **+26 bônus!** |

> 🤯 Pontuação máxima possível? É muita coisa. [Ver cálculo completo em SCORING.md](SCORING.md)

---

## 🚀 Quero rodar na minha máquina!

```bash
# Clone o projeto
git clone https://github.com/LucasRiboldi/bolao2026-claude.git
cd bolao2026-claude

# Instala dependências (só pra ferramentas de dev)
npm install

# Sobe o frontend
npx serve .
# Acesse: http://localhost:3000
```

Pronto! É só isso. Sem webpack, sem Vite, sem magia negra. HTML + CSS + JS puro e Firebase. 🙏

---

## ⚙️ Quero criar o meu próprio bolão!

Quer fazer um bolão com seus amigos e usar seu próprio Firebase? Segue o passo a passo:

### 1️⃣ Cria o projeto no Firebase

1. Vai em [console.firebase.google.com](https://console.firebase.google.com) → **Criar projeto**
2. Ativa **Authentication → E-mail/Senha**
3. Cria o banco **Firestore** em modo produção
4. Em **Project Settings → Apps → Web**, copia as credenciais

### 2️⃣ Cola as credenciais no projeto

Edita [`js/config.js`](js/config.js):

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

### 3️⃣ Define quem é o admin

Em [`js/admin.js`](js/admin.js) e [`firestore.rules`](firestore.rules) — troca o e-mail pelo seu:

```js
// js/admin.js
const ADMIN_EMAIL = 'seu@email.com';
```
```
// firestore.rules — linha da função isAdmin()
&& request.auth.token.email == 'seu@email.com'
```

### 4️⃣ Faz o deploy e chama os amigos!

```bash
npm install -g firebase-tools
firebase login
firebase deploy
# 🎉 Tá no ar!
```

---

## 🌱 Seed de teste — simula participantes reais

Quer testar sem precisar de 10 amigos online agora? O seed cria usuários fictícios com apostas aleatórias!

```bash
# 1. Baixa a chave do Firebase:
#    Console → Project Settings → Service Accounts → Gerar nova chave privada
#    Salva como service-account.json na raiz (já tá no .gitignore, pode ficar tranquilo)

# 2. Sobe o servidor de seed
node seed-server.js

# 3. Abre no browser
http://localhost:5500/test-seed.html
```

O `test-seed.html` tem 5 abas que fazem de tudo:

| Aba | O que faz |
|:---:|---|
| 🌱 **Seed** | Cria 10 usuários falsos + apostas aleatórias + resultados + ranking |
| 🔄 **Recalcular** | Recalcula ranking com os resultados atuais do Firestore |
| 📊 **Relatório** | Histograma de pontos, quem apostou em qual campeão |
| 🔍 **Auditoria** | Verifica se está tudo consistente no banco |
| 🧪 **Testes** | 32 testes automáticos rodando ao vivo — green = tá ótimo |

---

## 🗂️ Mapa do projeto

```
bolao2026/
├── 📄 index.html           → SPA completa — toda a UI num arquivo só
├── 🎨 css/styles.css       → Tema dark, animações, mobile-first
├── ⚙️ js/
│   ├── config.js           → Firebase init
│   ├── data.js             → Times, grupos, bracket, pontuação
│   ├── utils.js            → Toast, loading, helpers
│   ├── db.js               → CRUD Firestore
│   ├── auth.js             → Login e cadastro
│   ├── groupStage.js       → Fase de grupos (72 jogos)
│   ├── knockout.js         → Bracket mata-mata
│   ├── standings.js        → Classificação oficial (API externa)
│   ├── ranking.js          → Cálculo de pontuação + ranking
│   ├── admin.js            → Painel completo do admin
│   ├── results.js          → Lançar resultados reais (só admin)
│   └── app.js              → Orquestrador central
├── 🔐 firestore.rules      → Quem pode ler/escrever o quê
├── 🔧 firebase.json        → Hosting + Firestore config
├── 🌱 seed-server.js       → Servidor local de seed (porta 3001)
├── 🧪 test-seed.html       → UI de teste com 5 abas
└── 📊 SCORING.md           → Sistema de pontuação completo
```

---

## 🔐 Estrutura do banco de dados (Firestore)

```
users/{uid}/
  profile/info    → { name, email, betsLocked, betsSavedAt }
  bets/groupStage → { [gameId]: { homeGoals, awayGoals } }   // 72 apostas
  bets/knockout   → { [matchId]: teamId }                    // R32 até Final

results/
  groupStage → { [gameId]: { homeGoals, awayGoals } }   // admin lança
  knockout   → { [matchId]: teamId }                    // admin lança

ranking/
  current → { entries: [{ uid, name, pts, breakdown }] }  // pré-calculado

config/
  scoring → { exactScore, correctResult, r32Winner, ... }  // pontuação do admin
  admin   → { whatsapp, globalLocked, registrationOpen }
```

**Quem acessa o quê:**

```
apostas de qualquer usuário  →  qualquer pessoa logada pode ver (bolão transparente!)
resultados e ranking         →  leitura: logado  |  escrita: só admin
configurações                →  leitura: logado  |  escrita: só admin
```

---

## 🛠️ Stack

Nada de framework, nada de bundler. Só o essencial:

| Tecnologia | Por quê |
|---|---|
| **HTML + CSS + JS puro** | Roda em qualquer lugar, sem build step |
| **Firebase Auth** | Login sem dor de cabeça |
| **Firebase Firestore** | Banco em tempo real, regras de segurança declarativas |
| **Firebase Hosting** | Deploy em segundos com CDN global |
| **flag-icon-css** | Bandeirinhas bonitinhas dos 48 países |
| **API-Football** | Placar ao vivo dos jogos de hoje |

---

<div align="center">

**Feito com ☕ muito café e ⚽ paixão pelo futebol**

[![MIT License](https://img.shields.io/badge/Licença-MIT-green?style=flat-square)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Vanilla JS](https://img.shields.io/badge/Zero-Frameworks-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

MIT © [Lucas Riboldi](https://github.com/LucasRiboldi) — pode usar, pode copiar, pode melhorar! 🙌

</div>
