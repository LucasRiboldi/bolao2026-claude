# CLAUDE.md — Contexto do Projeto Bolão Copa 2026

Este arquivo é lido automaticamente pelo Claude Code para carregar contexto do projeto
e economizar tokens em novas sessões. Atualize sempre que houver mudanças arquiteturais.

---

## 🎯 O que é este projeto

Bolão de palpites da Copa do Mundo FIFA 2026.
- **Stack:** HTML + CSS + JS puro (sem framework/bundler) + Firebase (Auth + Firestore + Hosting)
- **Admin:** lucasriboldi.dev@gmail.com
- **Firebase project:** bolao2026-a76c7
- **Hosting:** https://bolao2026-a76c7.web.app
- **GitHub:** https://github.com/LucasRiboldi/bolao2026-claude

---

## 📁 Mapa de Arquivos e Responsabilidades

| Arquivo | Responsabilidade |
|---------|-----------------|
| `index.html` | SPA única — toda a UI está aqui. Seções: auth-screen, dashboard-screen (grupos, standings, ranking, admin) |
| `css/styles.css` | Tema dark. Variáveis em `:root`. Mobile-first. Sem preprocessador. |
| `js/config.js` | `firebase.initializeApp()`, exporta `auth` e `db` globais |
| `js/data.js` | Dados estáticos: `TEAMS`, `GROUPS`, `KNOCKOUT_SLOTS`, `KNOCKOUT_ROUNDS`, `SCORING`, helpers: `generateGroupGames()`, `calcGroupStandings()`, `getQualified()`, `buildR32()`, `resolveKnockoutRound()` |
| `js/utils.js` | `showToast(msg, type)`, `showLoading()`, `hideLoading()`, `showScreen(id)`, `showSection(id)` |
| `js/db.js` | CRUD Firestore: `saveGroupBets`, `loadGroupBets`, `saveKnockoutBets`, `loadKnockoutBets`, `saveProfile`, `loadProfile`, `loadResults`, `loadAllUsersForRanking`, `updateRankingDoc`, `loadRanking`, `lockBets`, `unlockUserBets`, `loadUserBetsForHistory`, `loadAdminUserList` |
| `js/auth.js` | Formulário login/cadastro, `initAuth()`. Chama `_onLogin`/`_onLogout` de app.js |
| `js/groupStage.js` | Estado: `_groupBets` (obj), `_gsLocked` (bool). Funções públicas: `initGroupStage()`, `loadGroupBetsUI(uid)`, `setGroupStageLocked(bool)`, `getCurrentGroupBets()`, `isGroupStageLocked()`. Auto-simula bracket ao preencher 72 jogos. |
| `js/knockout.js` | Estado: `_koBets` (obj), `_r32Matches` (arr), `_koLocked` (bool). Funções: `initKnockout()`, `loadKnockoutBetsUI(uid)`, `setKnockoutLocked(bool)`, `getCurrentKnockoutBets()`. `_simulate()` é global. |
| `js/standings.js` | Busca classificação oficial em API externa. `initStandings()`. |
| `js/ranking.js` | `calculateScore(groupBets, knockoutBets, results)` → `{pts, breakdown}`. `initRanking(uid)`, `loadPublicRanking()`, `_computeRankingClient()`. |
| `js/admin.js` | `isAdmin()`, `initAdminUI()`, `initAdminPanel()`, `adminToggleLock(uid, lock, btn)`, `openBetHistory(uid, name)`, `closeBetHistory()`, `_renderBetHistory(...)`. ADMIN_EMAIL = 'lucasriboldi.dev@gmail.com' |
| `js/results.js` | **Admin only.** `initResultsPanel()` — painel com tabs ⚽ Grupos / ⚡ Mata-Mata para lançar resultados oficiais. Escreve em `results/groupStage` e `results/knockout` via merge. 100% independente de standings.js (API). Usa `FieldValue.delete()` para limpar entradas individualmente. |
| `js/app.js` | Entry point. `_onLogin(user)`, `_onLogout()`, `_refreshUserScore(uid)`. Orquestra navegação entre seções. |
| `firestore.rules` | `isAdmin()` verifica `request.auth.token.email`. Bets são public-read para bolão transparente. |
| `seed-server.js` | Servidor HTTP porta 3001 com SSE. Usa firebase-admin (Admin SDK). Rotas: `/api/ping`, `/api/seed`, `/api/clear` |
| `test-seed.html` | UI de seed — chama seed-server.js via EventSource. Simula 10 users (teste1@teste.com.br…teste10). |

---

## 🗃️ Estrutura Firestore

```
users/{uid}/
  profile/info      { name, email, betsLocked, betsSavedAt, betsUnlockedAt }
  bets/groupStage   { [gameId]: { homeGoals: "2", awayGoals: "1" } }
  bets/knockout     { [matchId]: "teamId" }

results/
  groupStage        { [gameId]: { homeGoals, awayGoals } }   ← admin escreve
  knockout          { [matchId]: "teamId" }                  ← admin escreve

ranking/
  current           { entries: [{ uid, name, pts, breakdown }] }
```

### Game IDs
- Grupos: `A_0`…`A_5`, `B_0`…`L_5` (12 grupos × 6 jogos = 72 total)
- R32: `r32_01`…`r32_16`
- Oitavas: `r16_01`…`r16_08`
- Quartas: `qf_01`…`qf_04`
- Semis: `sf_01`, `sf_02`
- Final: `final`

---

## 🔑 Padrões de Código

- **Sem módulos ES** — tudo em escopo global. Scripts carregam em ordem no `index.html`.
- **Estado local** — cada módulo tem suas próprias variáveis privadas com `_` prefix.
- **Funções públicas** — sem underscore, declaradas no final ou marcadas como exports (comentário).
- **Firebase compat SDK v10** — usa `firebase.auth()` e `firebase.firestore()`, não o modular.
- **Flags** — biblioteca `flag-icon-css` (CDN). Usar `fi fi-{iso}` onde `iso` vem de `TEAMS[id].iso`.
- **Escocia** → `iso: 'gb-sct'`, **Inglaterra** → `iso: 'gb-eng'` (não `gb`).
- **Bloqueio** — `betsLocked: true` em `profile/info`. `_gsLocked` e `_koLocked` controlam a UI localmente.

---

## 🎨 CSS — Variáveis Principais

```css
--bg          /* fundo principal */
--surface     /* cards e painéis */
--surface2    /* hover e headers */
--border      /* bordas */
--text        /* texto principal */
--text-muted  /* texto secundário */
--accent      /* verde (#238636) */
--gold        /* dourado (#d29922) */
--radius      /* 10px */
--radius-sm   /* 6px */
--transition  /* .15s ease */
```

---

## ⚙️ Comandos Frequentes

```bash
# Rodar localmente (extensão Live Server no VS Code, porta 5500)
# ou:
npx serve .

# Deploy completo
firebase deploy

# Apenas regras Firestore
firebase deploy --only firestore:rules

# Apenas hosting
firebase deploy --only hosting

# Seed de teste (deixar rodando em terminal separado)
node seed-server.js
# Depois abrir test-seed.html no browser

# Push para GitHub
git add -A && git commit -m "feat: descrição" && git push
```

---

## 🚫 O que NÃO fazer

- Não usar `localStorage` — app usa Firestore para tudo
- Não importar módulos ES (`import/export`) — scripts são globais
- Não usar `firestore.rules` em modo test (`allow read, write: if true`) em produção
- Não commitar `service-account.json` (está no `.gitignore`)
- Não usar `firebase.initializeApp` mais de uma vez sem nome — seed usa `firebase.initializeApp(config, 'seed')`
- `seed-server.js` e `seed.js` são ferramentas de desenvolvimento — não fazem parte do hosting

---

## 📋 Tarefas Concluídas (histórico)

1. Remover tabela de classificação por grupo → lista compacta de partidas
2. Steppers +/− para gols (mobile-first)
3. Fase de mata-mata abaixo dos grupos (mesma tela)
4. Aba Classificação Oficial (API externa)
5. Firestore rules + Admin SDK
6. test-seed.html com 10 usuários simulados + seed-server.js
7. Histórico de apostas (modal 📋), bloqueio de campos, painel admin, botão seed
8. Bracket mais compacto (138px/col), auto-simular ao completar grupos, ranking ao vivo na tela inicial, gols pré-preenchidos com 0, cores por grupo (A-L), botão exportar apostas

---

## 🔮 Possíveis próximas features

- Resultados reais: admin preenche `results/groupStage` e `results/knockout` via painel
- Notificações push quando ranking atualizar
- Compartilhar link do próprio boletim de apostas
- Modo multi-bolão (várias competições)
