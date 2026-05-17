# ⚽ Bolão Copa 2026

Bolão de palpites da Copa do Mundo FIFA 2026. Aposte nos 72 jogos da fase de grupos, monte seu bracket até o campeão, e suba no ranking ao vivo com seus amigos.

**▶ Acessar:** https://bolao2026-a76c7.web.app

---

## Stack

React 18 + TypeScript 5 strict + Vite 5 + Firebase (Auth + Firestore + Hosting).

## Funcionalidades

| Tela | O que faz |
|------|-----------|
| **Apostar** | 72 jogos de grupos + mata-mata completo (R32 → final + 3º lugar). Nomes responsivos (abreviação no mobile). |
| **Meus** | Resumo read-only com pontuação por jogo. Exportar via WhatsApp. |
| **Copa** | Classificação dos 12 grupos + chaveamento. Atualiza ao vivo conforme admin lança resultados. |
| **Ranking** | Pódio top 3 + lista. Real-time via `onSnapshot`. |
| **Convidar** | Link + WhatsApp + tutorial. |
| **Admin** | Dashboard KPI, gestão de usuários (busca + filtros), lançamento de resultados (auto-recalc), config de pontuação, banlist de e-mails, snapshots JSON, exports CSV, seed de teste com undo. |

### Pontuação padrão

| Acerto | Pontos |
|--------|--------|
| Placar exato (grupos) | 17 |
| Resultado correto | 8 |
| Vencedor R32 / R16 / QF / SF | 5 / 11 / 20 / 40 |
| Campeão | 71 |
| Bônus 2 finalistas | 26 |

Configurável pelo admin sem redeploy.

---

## Setup local

```bash
git clone https://github.com/LucasRiboldi/bolao2026-claude.git
cd bolao2026-claude
npm install
npm run dev          # http://localhost:5173
```

Variáveis de ambiente: o arquivo `src/lib/firebase.ts` lê config inline. Para apontar para outro projeto Firebase, edite lá.

## Deploy

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only firestore:rules
```

## Testes

```bash
npm run test:run
# 61 testes de regra de negócio cobrindo scoring, standings (Art. 13 FIFA), Annexe C, e compactação de bets.
```

---

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [CLAUDE.md](CLAUDE.md) | Mapa do código, padrões, comandos. Lido pelo Claude Code em cada sessão. |
| [docs/MANUAL.txt](docs/MANUAL.txt) | Manual em texto puro para usuários e admin. |
| [docs/SCORING.md](docs/SCORING.md) | Sistema matemático com fórmulas e exemplos. |
| [docs/FIFA_RULES_2026.txt](docs/FIFA_RULES_2026.txt) | Regras FIFA aplicadas (Art. 12-14 + Annexe C). |
| [docs/DESIGN_QA.md](docs/DESIGN_QA.md) | Auditoria de acessibilidade (WCAG) + matriz A/B de breakpoints. |
| Style guide | https://bolao2026-a76c7.web.app/styleguide.html |
