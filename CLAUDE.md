# CLAUDE.md — Bolão Copa 2026

Lido automaticamente pelo Claude Code no início de cada sessão. Mantenha
sincronizado quando houver mudanças estruturais.

---

## 🎯 Visão geral

Bolão de palpites da Copa do Mundo FIFA 2026.

- **Stack:** React 18 + TypeScript 5 (strict) + Vite 5 + Firebase (Auth + Firestore + Hosting)
- **Admin:** `lucasriboldi.dev@gmail.com`
- **Firebase project:** `bolao2026-a76c7`
- **Live:** https://bolao2026-a76c7.web.app · [Style guide](https://bolao2026-a76c7.web.app/styleguide.html)
- **GitHub:** https://github.com/LucasRiboldi/bolao2026-claude

---

## 📁 Mapa do código

```
src/
├── main.tsx                  Entry: design-system.css → index.css → App
├── App.tsx                   Roteamento por seção (BetScreen eager, demais lazy)
├── index.css                 Reset + componentes atômicos (.btn, .input, .card, .badge, .skeleton, .toast, [data-tooltip], .section-label, .empty-state)
├── styles/
│   └── design-system.css     Single source of truth — 80+ tokens (color, space, type, radius, shadow, motion, z-index)
├── contexts/
│   └── AuthContext.tsx       Firebase Auth + admin flag + globalLocked do config
├── components/
│   ├── Flag.tsx              Bandeira CDN flagcdn.com
│   ├── TeamName.tsx          Responsivo: short (BRA) <640px, full (Brasil) ≥640px
│   └── layout/AppShell.tsx   Header sticky + bottom nav 5 ícones (Copa elevada)
├── data/                     Estáticos
│   ├── teams.ts              48 seleções (name, short, iso, flag)
│   ├── groups.ts             GROUPS (seeding oficial FIFA) + generateGroupGames + ALL_GROUP_GAMES
│   ├── bracket.ts            KNOCKOUT_SLOTS + KNOCKOUT_ROUNDS + DEFAULT_SCORING + buildR32 + resolveKnockoutRound
│   ├── fixtures.ts           Calendário oficial — 72 jogos grupos + 32 KO em horário Brasília
│   └── fifaRules2026.ts      Regras FIFA encodadas em TS (Art. 12-14 + Annexe C)
├── lib/
│   ├── firebase.ts           initializeApp + auth + db + ADMIN_EMAIL
│   ├── firestore.ts          Todas as operações DB (load*, save*, subscribe*, recomputeRanking debounced)
│   ├── compactBets.ts        Encode/decode "2x1" — reduz docs em ~70%
│   └── seedTest.ts           Seed 20 users teste + undo (client-side, sem servidor externo)
├── utils/
│   ├── scoring.ts            calculateScore + sortRanking
│   └── standings.ts          calcGroupStandings + getQualified + Annexe C bipartite matching
├── hooks/
│   ├── useGroupBets.ts       Estado + save (só globalLocked bloqueia)
│   ├── useKnockoutBets.ts    + KO_ROUND_MAX (limites de seleção por fase)
│   ├── useStandings.ts       Resultados oficiais + classificação
│   └── useRanking.ts         Real-time via subscribeRanking (onSnapshot)
├── screens/
│   ├── AuthScreen/           Login + register + Google + jogos do dia + ranking público
│   ├── BetScreen/            72 jogos com stepper + chips KO com cascade
│   ├── MyBetsScreen/         Read-only sheet com pontuação
│   ├── StandingsScreen/      12 tabelas + bracket
│   ├── RankingScreen/        Pódio + lista + my-position card
│   ├── InviteScreen/         Copiar link + WhatsApp + tutorial
│   └── AdminScreen/          Dashboard KPI + 4 tabs (Users, Results, Config, Tools)
└── types/index.ts            Todos os tipos TS exportados

public/
├── img/                      Logos
└── styleguide.html           Style guide standalone (47KB, sem React) — serve em /styleguide.html

tests/unit/                   Vitest — 61 testes de regra de negócio
├── standings.test.ts         Art. 13 tiebreaker recursivo + Annexe C
├── scoring.test.ts           calculateScore
├── data.test.ts              GROUPS + buildR32
└── compactBets.test.ts       encode/decode + backward compat

docs/                         Referências (não vão pro hosting, gitignored em parte)
├── MANUAL.txt                Manual do projeto em texto puro
├── FIFA_RULES_2026.txt       Regras FIFA aplicadas ao bolão
├── SCORING.md                Sistema matemático completo
├── DESIGN_QA.md              Auditoria WCAG + matriz A/B
├── FWC26_regulations_EN.pdf  PDF oficial FIFA (referência)
└── calendario.txt            Source para fixtures.ts

tools/seed/                   CLI seed legado (use o seed in-browser do AdminScreen)
```

---

## 🗃️ Estrutura Firestore

```
users/{uid}/
  profile/info         { name, email, betsLocked?, betsSavedAt?, betsUnlockedAt? }
  bets/groupStage      Compact: { "A_0": "2x1", "B_3": "0x0", ... }  ←  encodeGroupBets
  bets/knockout        { r32?: [], r16?: [], qf?: [], sf?: [], champion?, third? }

results/
  groupStage           Mesmo shape de bets/groupStage (admin escreve)
  knockout             { [matchId]: teamId }

ranking/
  current              { entries: [{ uid, name, pts, breakdown }] }

config/
  admin                { registrationOpen?, globalLocked?, ... }
  scoring              ScoringConfig (sobrescreve DEFAULT_SCORING)

blocked/
  emails               { [email]: true }  ←  banlist pública pra signup check
```

### Game IDs
- Grupos: `A_0`..`A_5`, `B_0`..`L_5` (12 × 6 = 72)
- R32: `r32_01`..`r32_16` · R16: `r16_01`..`r16_08` · QF: `qf_01`..`qf_04`
- SF: `sf_01`, `sf_02` · Final: `final` · 3º lugar: `third`

---

## 🔑 Padrões de código

- **TypeScript strict** — sempre. Sem `any` salvo necessidade real.
- **CSS puro tokenizado** — todo valor visual via `var(--token)`. Nada de hex hardcoded. Tokens em `src/styles/design-system.css`.
- **Aliases legacy preservados** — `--gold`, `--surface2`, `--green` etc. ainda funcionam (apontam pra tokens novos).
- **Estado** — hooks (`useGroupBets`, `useKnockoutBets`, etc.). Sem Redux/Zustand.
- **Firestore SDK modular v10** — `import { doc, getDoc, onSnapshot } from 'firebase/firestore'`.
- **Bandeiras** — `<Flag iso="br" />` via flagcdn.com. Escócia → `gb-sct`, Inglaterra → `gb-eng`.
- **Bloqueio de apostas** — só via `globalLocked` (admin liga em Config). `profile.betsLocked` por-user existe no DB mas NÃO afeta o BetScreen do próprio user.
- **Auto-recompute do ranking** — debounced 2s em `scheduleRankingRecompute`, disparado por todo save de resultado.
- **Real-time ranking** — `subscribeRanking(onSnapshot)` no `useRanking`. Sem polling.
- **Compactação de bets** — sempre `encodeGroupBets`/`decodeGroupBets` em writes/reads (formato "2x1"). Backward compat para docs no formato antigo.
- **Limites KO** — em `KO_ROUND_MAX` (r32: 16, r16: 8, qf: 4, sf: 2). UI bloqueia adicionar quando atinge.

---

## 🎨 Design System

Single source: `src/styles/design-system.css`.

Identidade: **dark + gold + green**. Brand colors:
- `--color-gold-500` (#d4aa2c) — conquista, seleção, marca
- `--color-green-700` (#1a7f37) — sucesso, primary CTA
- `--color-focus` (info-blue) — focus rings (separado do gold para hierarquia)

Componentes atômicos em `src/index.css`: `.btn` (5 variantes), `.input`, `.card`, `.badge`, `.skeleton`, `.toast`, `[data-tooltip]`, `.spinner`, `.section-label`, `.empty-state`, `.team-name--responsive`.

Style guide visualizável: https://bolao2026-a76c7.web.app/styleguide.html

---

## ⚙️ Comandos

```bash
# Dev local
npm run dev              # Vite em http://localhost:5173

# Build
npm run build            # TypeScript check + Vite production build

# Testes
npm test                 # Vitest watch
npm run test:run         # Vitest single pass
npx vitest run tests/unit/standings.test.ts  # arquivo específico

# Deploy
firebase deploy --only hosting             # Front
firebase deploy --only firestore:rules     # Rules
firebase deploy                            # Tudo

# Git
git add -A && git commit -m "feat: x" && git push
```

---

## 🚫 O que NÃO fazer

- **Não criar `*.md` documentando** sem pedido explícito. README/CLAUDE.md/docs/ já cobrem.
- **Não usar `firestore.rules` em modo permissivo** (`allow read, write: if true`) em prod.
- **Não commitar** `service-account.json` (gitignored).
- **Não introduzir** novas dependências sem aprovação.
- **Não hardcodar cores/spacing/sizes** — sempre `var(--token-*)` do design system.
- **Não trocar nomes de class/id/handler** sem motivo — quebra integração JS↔CSS↔testes.
- **Não usar `<span class="title">`** quando o correto é `<h2>` (afeta a11y).
- **Não reabrir o seed-server externo** (`tools/seed/seed-server.js`) — use o seed in-browser do AdminScreen → Ferramentas.

---

## 🧪 Quality gates

Antes de qualquer deploy:
1. `npm run build` deve passar (TypeScript strict)
2. `npx vitest run tests/unit/{standings,scoring,data,compactBets}.test.ts` — 61/61 testes de regra de negócio devem passar
3. Para mudanças em rules: `firebase deploy --only firestore:rules` antes do hosting

Testes UI (`*.test.tsx`) têm falhas pré-existentes não-bloqueantes — focar nos testes de business logic.

---

## 📚 Referências

- `docs/MANUAL.txt` — manual completo em texto puro
- `docs/SCORING.md` — sistema matemático com fórmulas e exemplos
- `docs/FIFA_RULES_2026.txt` — regras FIFA aplicadas (Art. 12-14 + Annexe C)
- `docs/DESIGN_QA.md` — auditoria WCAG + matriz A/B de breakpoints
- `docs/calendario.txt` — calendário oficial FIFA (source para `src/data/fixtures.ts`)
- `docs/FWC26_regulations_EN.pdf` — PDF oficial FIFA (~940KB, só referência)
