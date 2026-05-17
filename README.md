<div align="center">

<img src="https://img.shields.io/badge/⚽-Copa_do_Mundo_2026-brightgreen?style=for-the-badge" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" />
<img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase" />
<img src="https://img.shields.io/badge/Testes-189_✓-success?style=for-the-badge" />

# Bolão Copa 2026

### _Quem sabe mais de futebol no grupo? Chegou a hora de provar!_ ⚽🔥

Aposte nos **72 jogos** da fase de grupos, monte seu **bracket completo** até o campeão e suba no **ranking ao vivo** com seus amigos. Rápido, grátis e feito para funcionar no celular.

[![▶ Jogar agora](https://img.shields.io/badge/▶%20Jogar%20agora-bolao2026--a76c7.web.app-FF6B35?style=for-the-badge&logo=firebase&logoColor=white)](https://bolao2026-a76c7.web.app)

</div>

---

## Funcionalidades

| Tela | O que faz |
|------|-----------|
| **APOSTAR** | 72 jogos da fase de grupos com steppers +/−, bracket interativo do R32 até a final, auto-simulação ao completar os grupos |
| **BETS** | Resumo read-only das suas apostas, contador de preenchimento, exportar boletim via WhatsApp |
| **COPA** | Classificação oficial calculada pelos resultados lançados pelo admin — tabelas dos 12 grupos + mata-mata |
| **RANKING** | Pontuação ao vivo de todos os participantes, destaque da posição do usuário logado, avatares com iniciais |
| **CONVIDAR** | Copiar link do bolão, compartilhar no WhatsApp, guia de 4 passos para convidar amigos |
| **ADMIN** | Lançar resultados (grupos e mata-mata), gerenciar usuários (travar/destravar/deletar), recalcular ranking, configurar pontuação, seed de dados de teste |

### Sistema de pontuação padrão

| Acerto | Pontos |
|--------|--------|
| Placar exato (fase de grupos) | **17** |
| Resultado correto (vitória/empate/derrota) | **8** |
| Vencedor R32 | **5** |
| Vencedor Oitavas (R16) | **11** |
| Vencedor Quartas (QF) | **20** |
| Vencedor Semifinal (SF) | **40** |
| Campeão | **71** |
| Finalista bônus | **26** |

> A pontuação é configurável pelo admin em tempo real sem necessidade de redeploy.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + TypeScript 5 (strict) |
| Build | Vite 5 |
| Backend | Firebase Auth + Firestore |
| Hosting | Firebase Hosting |
| Testes | Vitest + Testing Library (189 testes) |

---

## Como rodar localmente

### Pré-requisitos

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Conta no Firebase com um projeto criado (ou usar o projeto existente `bolao2026-a76c7`)

### Instalação

```bash
git clone https://github.com/LucasRiboldi/bolao2026-claude.git
cd bolao2026-claude
npm install
```

### Desenvolvimento

```bash
npm run dev
# App disponível em http://localhost:5173
```

### Testes

```bash
npm run test              # rodar todos os testes uma vez
npm run test:watch        # modo watch (reexecuta ao salvar)
npm run test:coverage     # relatório de cobertura em ./coverage/
```

### Build de produção

```bash
npm run build
# Saída em ./dist/ — pronto para deploy
```

### Seed de dados de teste

Para popular o Firestore com usuários e apostas simuladas:

```bash
# Terminal 1 — deixar rodando
npm run seed:server
# Servidor SSE em http://localhost:3001

# Terminal 2
npm run seed        # cria 10 usuários de teste com apostas aleatórias
npm run seed:clear  # remove todos os dados de teste
```

Ou acesse a aba **Admin → Dados de Teste** no próprio app enquanto o seed server estiver rodando.

---

## Configuração de elementos críticos

### 1. Firebase

Edite `src/lib/firebase.ts` com as credenciais do seu projeto Firebase:

```ts
const firebaseConfig = {
  apiKey:            'sua-api-key',
  authDomain:        'seu-projeto.firebaseapp.com',
  projectId:         'seu-projeto',
  storageBucket:     'seu-projeto.firebasestorage.app',
  messagingSenderId: 'seu-sender-id',
  appId:             'seu-app-id',
}
```

> As credenciais do SDK web do Firebase são seguras para ficarem no código — elas são restritas pelas Firestore Security Rules e pelas configurações do Firebase Console.

### 2. E-mail do administrador

O admin tem acesso exclusivo ao painel de resultados, gerenciamento de usuários e configurações. Configure em **dois lugares**:

**`src/lib/firebase.ts`**
```ts
export const ADMIN_EMAIL = 'seu-email@dominio.com'
```

**`firestore.rules`**
```js
function isAdmin() {
  return request.auth != null
      && request.auth.token.email == 'seu-email@dominio.com';
}
```

Após alterar as rules, faça o deploy delas:
```bash
firebase deploy --only firestore:rules
```

### 3. Pontuação padrão

Os pontos iniciais do sistema estão em `src/data/bracket.ts`:

```ts
export const DEFAULT_SCORING = {
  exactScore:    17,  // placar exato
  correctResult:  8,  // resultado certo (V/E/D)
  r32Winner:      5,  // vencedor R32
  r16Winner:     11,  // vencedor oitavas
  qfWinner:      20,  // vencedor quartas
  sfWinner:      40,  // vencedor semis
  championScore: 71,  // campeão
  finalistBonus: 26,  // finalista
}
```

O admin pode alterar esses valores em tempo real pela tela de administração (aba Configurações → Pontuação) sem precisar de redeploy.

### 4. Firebase Admin SDK (seed)

Para o seed server funcionar, crie um arquivo `service-account.json` na raiz do projeto com a Service Account Key do Firebase Console:

> Firebase Console → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada

```bash
# Nunca commitar este arquivo — já está no .gitignore
service-account.json
```

---

## Como enviar ao GitHub

```bash
# Primeira vez
git remote add origin https://github.com/LucasRiboldi/bolao2026-claude.git

# Commit e push
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

---

## Como fazer deploy

### Deploy completo (hosting + rules)

```bash
npm run build
firebase deploy
```

### Apenas o app (hosting)

```bash
npm run build
firebase deploy --only hosting
```

### Apenas as regras do Firestore

```bash
firebase deploy --only firestore:rules
```

### Primeiro deploy (projeto novo)

```bash
firebase login
firebase use --add          # selecionar o projeto
npm run build
firebase deploy
```

---

## Estrutura do projeto

```
src/
├── contexts/        # AuthContext (usuário logado, perfil, loading)
├── data/            # Equipes (48), grupos (12), bracket, pontuação
├── hooks/           # useGroupBets, useKnockoutBets, useRanking, useStandings
├── lib/             # firebase.ts (config), firestore.ts (CRUD)
├── screens/
│   ├── AdminScreen/     # Usuários, Resultados, Configurações
│   ├── AuthScreen/      # Login Google
│   ├── BetScreen/       # Apostar (grupos + mata-mata)
│   ├── InviteScreen/    # Convidar amigos
│   ├── MyBetsScreen/    # Minhas apostas (read-only)
│   ├── RankingScreen/   # Ranking ao vivo
│   └── StandingsScreen/ # Classificação oficial
├── types/           # Tipos TypeScript compartilhados
└── utils/           # scoring.ts (cálculo de pontos)

tests/
└── unit/            # 189 testes (Vitest + Testing Library)

tools/
└── seed/            # seed.js, seed-server.js (dados de teste)
```

### Estrutura do Firestore

```
users/{uid}/
  profile/info      { name, email, betsLocked, betsSavedAt }
  bets/groupStage   { [gameId]: { homeGoals, awayGoals } }
  bets/knockout     { [matchId]: "teamId" }

results/
  groupStage        { [gameId]: { homeGoals, awayGoals } }   ← admin
  knockout          { [matchId]: "teamId" }                  ← admin

ranking/
  current           { entries: [{ uid, name, pts, breakdown }] }
```

---

## Metas de atualização

### Alta prioridade
- [ ] **Notificações push** — avisar participantes quando o ranking atualizar após o admin lançar resultados
- [ ] **Link do boletim individual** — URL pública para cada participante compartilhar as próprias apostas (ex: `/boletim/uid`)
- [ ] **Recálculo automático** — Cloud Function que recalcula o ranking automaticamente quando `results/` é atualizado, sem precisar do botão manual

### Funcionalidades novas
- [ ] **PWA / instalável** — manifesto + service worker para instalar no celular como app nativo
- [ ] **Grupos privados** — modo multi-bolão onde diferentes grupos de amigos jogam separados com link de convite único
- [ ] **Histórico de posições** — gráfico de evolução da posição no ranking ao longo da Copa
- [ ] **Chat / reações** — seção de comentários ou reações por rodada
- [ ] **Modo espectador** — visualizar apostas de outros participantes antes do resultado (opcional, configurável pelo admin)

### Qualidade e dev experience
- [ ] **Testes E2E** — Playwright para fluxos críticos (login → apostar → salvar → ver ranking)
- [ ] **CI/CD** — GitHub Actions com build + test + deploy automático no push para `main`
- [ ] **Monitoramento** — Firebase Performance + Crashlytics para erros em produção
- [ ] **Code splitting** — separar AdminScreen e dados do bracket em chunks lazy-loaded
- [ ] **Dark/light theme** — respeitar `prefers-color-scheme` e permitir toggle manual

---

## Comandos rápidos

```bash
npm run dev               # servidor local (localhost:5173)
npm run test              # 189 testes
npm run build             # build de produção
firebase deploy           # deploy completo
npm run seed:server       # servidor de seed (localhost:3001)
```

---

<div align="center">

Feito com ❤️ para a Copa do Mundo 2026 🏆

</div>
