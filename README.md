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
| ⚽ **Fase de Grupos** | 72 jogos, 12 grupos, draw oficial FIFA (dez/2025). Steppers +/− para inserir placares. |
| ⚡ **Mata-Mata** | Bracket interativo R32 → Oitavas → Quartas → Semis → Final. Auto-gerado ao completar grupos. |
| 🏅 **Ranking** | Placar em tempo real calculado ao vivo com pontuação diferenciada |
| 📋 **Minhas Apostas** | Aba dedicada com histórico completo, status por jogo e pontuação parcial |
| 🔒 **Bloqueio** | Apostas travadas após salvar; admin pode liberar individualmente |
| 📊 **Classificação** | Tabelas oficiais da copa via API externa |
| 🔧 **Admin** | Gestão de usuários, toggle lock/unlock, WhatsApp de contato |
| 📄 **Exportar** | Download do boletim HTML com todos os palpites |

---

## 🗂️ Estrutura do Projeto

```
bolao2026/
├── index.html              # SPA — única página HTML
├── css/
│   └── styles.css          # Tema dark, variáveis CSS, mobile-first
├── js/
│   ├── config.js           # Inicialização do Firebase
│   ├── data.js             # Times, grupos, bracket, scoring, helpers
│   ├── utils.js            # showToast, showLoading, showSection
│   ├── db.js               # CRUD Firestore (bets, profile, ranking, results, config)
│   ├── auth.js             # Fluxo de autenticação
│   ├── groupStage.js       # Fase de grupos — steppers, lock, auto-simulate
│   ├── knockout.js         # Bracket mata-mata interativo
│   ├── standings.js        # Classificação oficial (API externa)
│   ├── ranking.js          # Cálculo de pontuação e ranking
│   ├── admin.js            # Painel admin, histórico, WhatsApp, toggle lock
│   └── app.js              # Controlador principal, navegação, WhatsApp
├── firestore.rules         # Regras de segurança Firestore
├── firebase.json           # Configuração hosting e Firestore
├── seed-server.js          # Servidor Node local para seed de teste
├── test-seed.html          # UI de seed — simula 10 usuários
└── package.json            # Dependências Node (firebase-admin — seed apenas)
```

---

## 🃏 Arquitetura de UI

```
App (SPA)
├── Auth Screen
│   └── PublicRankingCard   — top 10 visível antes de logar
└── Dashboard Screen
    ├── Tab: ⚽ Grupos
    │   ├── GroupCard [A-L]  — borda colorida por grupo
    │   │   └── GameRow      — [Flag Team] [−][0][+] × [−][0][+] [Flag Team]
    │   └── KnockoutBracket  — R32 / Oitavas / Quartas / Semis / Final
    ├── Tab: 📋 Apostas      — histórico inline do usuário logado
    ├── Tab: 📊 Classificação — standings oficiais (API)
    ├── Tab: 🏅 Ranking       — RankingRow + botão 📋 histórico de qualquer participante
    └── Tab: 🔧 Admin (*)     — toggle lock, WhatsApp, seed de teste
```

---

## 🗃️ Modelo de Dados (Firestore)

```
users/{uid}/
  profile/info    { name, email, betsLocked, betsSavedAt, betsUnlockedAt }
  bets/groupStage { [gameId]: { homeGoals, awayGoals } }   // 72 jogos
  bets/knockout   { [matchId]: teamId }                    // R32..Final

results/
  groupStage      { [gameId]: { homeGoals, awayGoals } }   // admin escreve
  knockout        { [matchId]: teamId }                    // admin escreve

ranking/
  current         { entries: [{ uid, name, pts, breakdown }] }

config/
  admin           { whatsapp: "5511999990000" }
```

---

## 🧮 Sistema de Pontuação — Auditoria Completa

Esta seção documenta **toda a lógica de cálculo** em formato matemático auditável.  
Código de referência: `js/data.js` (tabela grupos), `js/ranking.js` (bolão), `js/standings.js` (oficial).

---

### 1. Tabela Oficial da Copa — Fase de Grupos

Cada grupo tem **4 times** disputando **6 jogos** (round-robin completo).

#### 1.1 Pontos por Resultado

```
Resultado          Mandante   Visitante
─────────────────────────────────────────
Vitória mandante   + 3 pts    + 0 pts
Empate             + 1 pt     + 1 pt
Vitória visitante  + 0 pts    + 3 pts
```

#### 1.2 Estatísticas por Time

```
GF(T) = Σ gols marcados por T em todos os jogos
GA(T) = Σ gols sofridos por T em todos os jogos
GD(T) = GF(T) − GA(T)          (Saldo de Gols)
P(T)  = Σ pontos obtidos nos jogos disputados
J(T)  = número de jogos disputados  (máx. 6)
```

#### 1.3 Critérios de Desempate (ordem de aplicação)

```
1°  P(T)   ↓  Pontos             (maior primeiro)
2°  GD(T)  ↓  Saldo de Gols      (maior primeiro)
3°  GF(T)  ↓  Gols Marcados      (maior primeiro)
```

> Implementado em `data.js → calcGroupStandings()`:
> ```js
> sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
> ```

#### 1.4 Classificação por Grupo

```
Posição 1°  →  Classificado direto R32   ×12 grupos = 12 times
Posição 2°  →  Classificado direto R32   ×12 grupos = 12 times
Posição 3°  →  Disputa vaga (melhor 3°)  ×12 grupos = 12 candidatos → 8 passam
Posição 4°  →  Eliminado                 ×12 grupos = 12 times
```

#### 1.5 Seleção dos 8 Melhores Terceiros

```
Pool: 12 terceiros colocados (1 por grupo)
Critérios de ordenação: P(T) ↓, GD(T) ↓, GF(T) ↓
Os 8 primeiros do ranking avançam.

Total classificados para R32: 12 + 12 + 8 = 32 times ✓
```

#### 1.6 Volume da Fase de Grupos

```
Jogos por grupo = C(4,2) = 4! / (2! × 2!) = 6 jogos
Total de jogos  = 12 grupos × 6 = 72 jogos
```

---

### 2. Pontuação do Bolão — Fase de Grupos

Para cada um dos **72 jogos** com resultado real registrado pelo admin:

#### 2.1 Variáveis

```
bH = gols apostados (mandante)
bA = gols apostados (visitante)
rH = gols reais    (mandante)
rA = gols reais    (visitante)
```

#### 2.2 Função sign — Determina o Resultado

```
sign(x) = +1   se x > 0   → vitória do mandante
sign(x) =  0   se x = 0   → empate
sign(x) = −1   se x < 0   → vitória do visitante
```

#### 2.3 Regras de Pontuação por Jogo

```
Condição                                              Pontos
──────────────────────────────────────────────────────────────
bH = rH  E  bA = rA                                   +3 pts   (placar exato)
sign(bH−bA) = sign(rH−rA)  E  NÃO (bH=rH ∧ bA=rA)   +1 pt    (resultado correto)
sign(bH−bA) ≠ sign(rH−rA)                             +0 pts   (resultado errado)
Jogo sem resultado real registrado                     +0 pts   (aguardando)
```

#### 2.4 Exemplos

```
Aposta: BRA 2×1 ARG   Real: BRA 2×1 ARG
→ 2=2 e 1=1  →  Exato                                 +3 pts ✅

Aposta: BRA 3×0 ARG   Real: BRA 2×1 ARG
→ sign(3−0)=+1 = sign(2−1)=+1, mas placar diferente   +1 pt  ✓

Aposta: BRA 0×1 ARG   Real: BRA 2×1 ARG
→ sign(0−1)=−1 ≠ sign(2−1)=+1                         +0 pts ❌

Aposta: BRA 1×1 ARG   Real: BRA 2×1 ARG
→ sign(1−1)=0 ≠ sign(2−1)=+1                          +0 pts ❌
```

#### 2.5 Pontuação Máxima — Grupos

```
72 jogos × 3 pts = 216 pts  (se acertar todos os placares exatos)
```

---

### 3. Pontuação do Bolão — Fase Mata-Mata

Para cada um dos **31 jogos** do bracket com vencedor real registrado:

#### 3.1 Regra por Jogo

```
Condição                               Pontos
──────────────────────────────────────────────
Apostou no time vencedor correto       +2 pts
Apostou no time vencedor errado        +0 pts
Sem resultado real registrado          +0 pts
```

#### 3.2 Bônus Campeão — Aplicado Separadamente

```
Se aposta_final = campeão_real:
  +2 pts  (regra KO normal pelo acerto da Final)
  +5 pts  (bônus especial acumulativo)
  ─────────────────
  +7 pts  total pela Final correta

Se aposta_final ≠ campeão_real:
  +0 pts
```

> Implementado em `ranking.js → calculateScore()`:
> ```js
> // Varredura KO (inclui a Final)
> for (const [matchId, winnerId] of Object.entries(koResults)) {
>   if (knockoutBets[matchId] === winnerId) pts += 2;
> }
> // Bônus extra se acertou o campeão
> if (champion && knockoutBets['final'] === champion) pts += 5;
> ```

#### 3.3 Pontos Máximos por Fase

```
Fase             Jogos   × Pts/jogo   = Máx. fase
────────────────────────────────────────────────────
Rodada de 32      16     ×    2       =   32 pts
Oitavas de Final   8     ×    2       =   16 pts
Quartas de Final   4     ×    2       =    8 pts
Semifinais         2     ×    2       =    4 pts
Final              1     ×    2       =    2 pts
                  ──                  ──────────
Subtotal KO       31                  =   62 pts
Bônus Campeão      —                  +    5 pts
────────────────────────────────────────────────────
Total Máximo KO                       =   67 pts
```

---

### 4. Pontuação Total Máxima do Bolão

```
Componente                  Cálculo          Máximo
────────────────────────────────────────────────────
Fase de Grupos (exatos)     72 × 3           216 pts
Mata-Mata (vencedores)      31 × 2            62 pts
Bônus Campeão                1 × 5             5 pts
────────────────────────────────────────────────────
TOTAL MÁXIMO POSSÍVEL       216 + 62 + 5     283 pts
```

---

### 5. Fórmula Consolidada

```
P(u) = Σ[i=1..72] G(i)  +  Σ[j=1..31] K(j)  +  B

Onde:

G(i) = 3   se (bH_i = rH_i) ∧ (bA_i = rA_i)
     = 1   se sign(bH_i − bA_i) = sign(rH_i − rA_i)  ∧  G(i) ≠ 3
     = 0   caso contrário

K(j) = 2   se aposta_j = vencedor_real_j
     = 0   caso contrário

B    = 5   se aposta_final = campeão_real
     = 0   caso contrário
```

---

## 🔐 Regras de Segurança (Firestore)

```
users/{uid}/profile  →  R/W: próprio usuário ou admin
users/{uid}/bets     →  R: qualquer autenticado (bolão transparente)
                        W: próprio usuário ou admin
results/*            →  R: qualquer autenticado | W: somente admin
ranking/*            →  R: qualquer autenticado | W: somente admin
config/*             →  R: qualquer autenticado | W: somente admin
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

Edite `js/config.js`:

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

Em `firestore.rules` e `js/admin.js`, substitua o e-mail:

```js
// js/admin.js
const ADMIN_EMAIL = 'seu-email@example.com';

// firestore.rules
&& request.auth.token.email == 'seu-email@example.com';
```

### 5. Deploy

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

---

## 🧪 Seed de Teste

```bash
# Gere service-account.json no Firebase Console → Project Settings → Service Accounts
npm install
node seed-server.js   # sobe na porta 3001
# Abrir test-seed.html no browser
```

---

## 🌐 Deploy Firebase

```bash
firebase deploy                          # completo
firebase deploy --only firestore:rules   # só regras
firebase deploy --only hosting           # só hosting
```

---

## 📄 Licença

MIT © [Lucas Riboldi](https://github.com/LucasRiboldi)
