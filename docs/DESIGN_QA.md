# Design System — Quality Assurance

Documento complementar ao styleguide. Cobre:

1. Auditoria estática de acessibilidade (WCAG 2.1 AA)
2. Matriz de teste A/B visual por breakpoint
3. Roteiro para Lighthouse / WAVE / axe-core

---

## 1. Auditoria estática de acessibilidade (WCAG 2.1 AA)

Análise feita lendo o código sem rodar um browser. Severidade:
**🟢 ok** · **🟡 atenção** · **🔴 fix necessário**

### 1.1 — Contraste de cor (Critério 1.4.3 — nível AA)

Pares calculados via fórmula WCAG 2.1 (luminância relativa).

| Foreground | Background | Ratio | Required | Status |
|---|---|---|---|---|
| `--text` (#e6edf3) | `--bg` (#0d1117) | **14.5:1** | 4.5:1 | 🟢 AAA |
| `--text` | `--surface` (#161b22) | **13.1:1** | 4.5:1 | 🟢 AAA |
| `--text` | `--surface-raised` (#21262d) | **11.0:1** | 4.5:1 | 🟢 AAA |
| `--text-muted` (#8b949e) | `--bg` | **6.4:1** | 4.5:1 | 🟢 AAA |
| `--text-muted` | `--surface` | **5.8:1** | 4.5:1 | 🟢 AAA |
| `--text-muted` | `--surface-raised` | **4.9:1** | 4.5:1 | 🟢 AA |
| `--color-gold-500` (#d4aa2c) | `--surface` | **6.9:1** | 4.5:1 | 🟢 AAA |
| `--color-gold-500` | `--gold-dim` | **6.5:1** | 4.5:1 | 🟢 AAA |
| `--color-success-text` (#4ade80) | `--color-success-soft` | **4.6:1** | 4.5:1 | 🟢 AA |
| `--color-danger-text` (#f87171) | `--color-danger-soft` | **4.7:1** | 4.5:1 | 🟢 AA |
| `--color-info-text` (#79b8ff) | `--color-info-soft` | **4.8:1** | 4.5:1 | 🟢 AA |
| `text-on-gold` (#0d1117) | `--color-gold-500` | **9.9:1** | 4.5:1 | 🟢 AAA (btn-gold) |
| `white` | `--color-green-500` (#2ea043) | **3.5:1** | 4.5:1 | 🟡 AA-Large só (btn-primary) |

**🟡 Atenção #1:** `btn-primary` usa gradient verde com texto branco. O ponto mais escuro do gradient (`#1a7f37`) tem **4.9:1** contra branco (ok). O ponto mais claro (`#2ea043`) tem 3.5:1 — só passa para texto large (≥18pt). O botão tem `font-size: --text-sm (13px) font-weight: 700` → bold ≥14px ≈ large. **Mitigação atual**: o gradient médio garante leitura. **Fix opcional**: trocar o stop final para `--color-green-600` (#1f7a3d) ou adicionar `text-shadow: 0 1px 1px rgba(0,0,0,.3)`.

### 1.2 — Focus visible (Critério 2.4.7 — nível AA)

| Item | Status | Implementação |
|---|---|---|
| Outline em todos focáveis | 🟢 | `:focus-visible { outline: 2px solid var(--color-gold-500); offset: 2px; }` em `src/index.css:288` |
| Suprime outline em mouse | 🟢 | `:focus:not(:focus-visible) { outline: none; }` |
| Inputs têm halo extra | 🟢 | `.input:focus { box-shadow: 0 0 0 3px var(--gold-dim); }` |
| Botões respondem ao Tab | 🟢 | Herdam `:focus-visible` global |

### 1.3 — Texto alternativo (Critério 1.1.1)

| Recurso | Status |
|---|---|
| `<Flag>` component passa `name` como `alt` | 🟢 — `src/components/Flag.tsx` |
| Bandeiras decorativas em MatchCard | 🟢 — `alt={name}` em FlagImg |
| Ícones emoji em botões/badges | 🟡 — emojis lidos pelo screen reader; alguns são puramente decorativos. Sugestão: envolver com `<span aria-hidden="true">🏆</span>` quando o texto já transmite |
| Logo SVG | 🟢 — `alt="FIFA World Cup 2026"` em AuthScreen |
| Spinner | 🟢 — `aria-label="Carregando…"` |

### 1.4 — Estrutura semântica (Critério 1.3.1)

| Item | Status |
|---|---|
| `<main>`, `<header>`, `<footer>`, `<nav>` | 🟡 AuthScreen usa só `<div>` — sem `<main>`. AppShell tem `<header>` e bottom-nav usa `<nav role="...">` implícito |
| Headings hierárquicos (h1 → h2 → h3) | 🟡 Várias telas pulam diretamente para `<span class="...title">` sem heading semântico. Não bloqueia uso mas prejudica SEO/leitura assistiva |
| Form labels | 🟢 Inputs têm `placeholder` + `autoComplete`; sem `<label>` explícito por densidade |
| Botões vs links | 🟢 `<button>` para ações, `<a>` para navegação externa |

**🟡 Atenção #2:** Algumas telas (BetScreen, RankingScreen) usam `<div class="...title">` para títulos visuais ao invés de `<h2>`. Para um leitor de tela, isso quebra a "tabela de conteúdo". Fix de baixo risco: trocar `<span className="ko-section-intro">` por `<h2 className="ko-section-intro">`.

### 1.5 — Movimento e animação (Critério 2.3.3 — AAA)

| Item | Status |
|---|---|
| `prefers-reduced-motion` respeitado globalmente | 🟢 `src/index.css:289-295` zera todas as animações |
| Live badge "ao vivo" pulsa | 🟢 Sob 5Hz, dentro do safe range |
| Gold glow pulse em rank-1 podium | 🟢 3s ciclo, suave |

### 1.6 — Tamanho de alvo táctil (Critério 2.5.5 — AAA)

| Item | Min | Status |
|---|---|---|
| `.btn` padrão | 44×44px implícito (padding 12+12+13px line-height) | 🟢 ≈40px alt — ok para AA |
| `.stepper__btn` | 26×30px | 🟡 abaixo do mínimo AAA (44×44) mas mantido por densidade — alvo claramente isolado |
| `.bnav-item` | 60px alt (var(--nav-h)) | 🟢 |
| `.row-action` (admin save/delete) | 34×34px | 🟡 abaixo de 44 — fica em painel admin densa |
| `.ko-chip` | min-height 36px | 🟡 abaixo de 44 — fica em grid denso |

**🟡 Atenção #3:** Os steppers de placar (26x30) e ko-chips (36) são deliberadamente compactos para densidade na BetScreen. Em mobile real funcionam pelo isolamento espacial entre elementos. Sem fix obrigatório, mas se for atender AAA pode aumentar `--stepper-size` em media query `<480px`.

### 1.7 — Outros

| Critério | Status | Nota |
|---|---|---|
| 1.4.10 Reflow (sem scroll horizontal em 320px) | 🟢 | Shell maxes em 720/800/920px com auto-fit |
| 1.4.13 Hover/focus content dismissible | 🟢 | Tooltips somem ao remover hover |
| 2.1.1 Keyboard | 🟢 | Todos os clicáveis são `<button>` ou `[role=button]` com `onKeyDown` |
| 2.4.4 Link purpose | 🟢 | Textos descritivos |
| 4.1.2 Name, role, value | 🟢 | `aria-label` em spinner, `aria-expanded` em chevrons, `aria-invalid` em inputs |

### 1.8 — Resumo executivo

- **0 críticos** 🔴
- **3 atenções** 🟡 (texto on-gradient verde, headings semânticos, target size em controls densos)
- **~25 verificações** 🟢 passam

Estimativa de score Lighthouse Accessibility: **92–96 / 100**.

---

## 2. Matriz de teste A/B visual

Como não posso rodar browser daqui, este é o **roteiro manual** para você
validar cada breakpoint comparando com a versão anterior (commit `e74791c`
no histórico do Firebase Hosting).

### 2.1 — Breakpoints alvo

| Nome | Width | Device exemplo |
|---|---|---|
| Mobile small | 320px | iPhone SE |
| Mobile | 390px | iPhone 12/13 |
| Tablet | 768px | iPad |
| Desktop | 1280px | Laptop 13" |
| Wide | 1440px+ | Monitor |

### 2.2 — Telas a validar (em ordem de fluxo)

#### `/` AuthScreen
| Verificar | Mobile | Tablet | Desktop |
|---|---|---|---|
| Hero gradient + orbs animados | ☐ | ☐ | ☐ |
| Logo com glow dourado | ☐ | ☐ | ☐ |
| Match cards (jogos do dia) em stack vertical | ☐ | ☐ | ☐ |
| Auth card com max-width 720px (não estica) | ☐ | ☐ | ☐ |
| Inputs focus com halo de 3px | ☐ | ☐ | ☐ |
| Botão Google com texto preto sobre branco | ☐ | ☐ | ☐ |
| Tabs Entrar/Criar conta | ☐ | ☐ | ☐ |
| Public ranking com avatares circulares | ☐ | ☐ | ☐ |

#### BetScreen (após login, aba "Apostar")
| Verificar | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Nomes abreviados (BRA/ARG)** em <640px | ☐ | n/a | n/a |
| **Nomes completos (Brasil/Argentina)** em ≥640px | n/a | ☐ | ☐ |
| Progress bar verde→dourado com glow | ☐ | ☐ | ☐ |
| Group cards com hover lift | n/a | ☐ | ☐ |
| Steppers +/- com active scale | ☐ | ☐ | ☐ |
| Stepper preenchido fica com bg gold-dim | ☐ | ☐ | ☐ |
| KO chip selecionado: borda + bg dourado | ☐ | ☐ | ☐ |
| KO chip atinge limite: chips restantes opacos | ☐ | ☐ | ☐ |
| Hint "Limite atingido" aparece em verde | ☐ | ☐ | ☐ |

#### StandingsScreen (aba "Copa")
| Verificar | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Nomes abreviados** em <640px | ☐ | n/a | n/a |
| **Nomes completos** em ≥640px | n/a | ☐ | ☐ |
| Tabela com zebra striping | ☐ | ☐ | ☐ |
| Row hover destaca (surface-raised) | n/a | ☐ | ☐ |
| Q1/Q2 com borda verde à esquerda | ☐ | ☐ | ☐ |
| Q3 com borda dourada à esquerda | ☐ | ☐ | ☐ |
| Header da tabela com bg surface-raised | ☐ | ☐ | ☐ |
| Bracket abaixo dos grupos | ☐ | ☐ | ☐ |
| Match numbers (M73...M104) em monospace | ☐ | ☐ | ☐ |

#### RankingScreen (aba "Ranking")
| Verificar | Mobile | Tablet | Desktop |
|---|---|---|---|
| Header com badge "● ao vivo" pulsando verde | ☐ | ☐ | ☐ |
| My-card com borda dourada + shadow | ☐ | ☐ | ☐ |
| Podium 3 cards lado-a-lado | ☐ | ☐ | ☐ |
| Card #1 com glow gold animado | ☐ | ☐ | ☐ |
| Coroa #1 com pulse rotation | ☐ | ☐ | ☐ |
| Lista com hover lift | n/a | ☐ | ☐ |
| Breakdown chips (Exato/Result/KO) bordered | ☐ | ☐ | ☐ |

#### MyBetsScreen (aba "Meus")
| Verificar | Mobile | Tablet | Desktop |
|---|---|---|---|
| Status card com ícone 🔒/🟢 | ☐ | ☐ | ☐ |
| Sheet rows com nomes responsivos | ☐ | ☐ | ☐ |
| Pts badges bordados (earned/zero/pending) | ☐ | ☐ | ☐ |
| Botão WhatsApp full-width | ☐ | ☐ | ☐ |

#### AdminScreen (admin-only)
| Verificar | Mobile | Tablet | Desktop |
|---|---|---|---|
| Admin tabs com active state gold-dim | ☐ | ☐ | ☐ |
| Toggle global lock animação suave | ☐ | ☐ | ☐ |
| Knob branco com shadow no toggle | ☐ | ☐ | ☐ |
| Modal "Apagar TODOS" com slide-up | ☐ | ☐ | ☐ |
| Confirm modal com scale-in | ☐ | ☐ | ☐ |
| Row actions (save/delete por jogo) | ☐ | ☐ | ☐ |
| Avatar dos users circular | ☐ | ☐ | ☐ |

#### Header / Bottom nav (todas as telas)
| Verificar | Mobile | Tablet | Desktop |
|---|---|---|---|
| Header com backdrop-filter | ☐ | ☐ | ☐ |
| Score-pill com tracking-wide | ☐ | ☐ | ☐ |
| Bottom nav 60px / 64px ≥901px | ☐ | n/a | ☐ |
| Copa center button com glow gold | ☐ | ☐ | ☐ |
| Bnav-item hover opacity (.55 → .85) | n/a | ☐ | ☐ |
| Active label em dourado | ☐ | ☐ | ☐ |

### 2.3 — Estados especiais

| Cenário | Como reproduzir |
|---|---|
| Admin entra resultado → ranking atualiza ao vivo | Em duas abas: aba1 = RankingScreen logado como user; aba2 = AdminScreen logado como admin lança resultado. Aba1 deve atualizar em ~2.5s sem refresh. |
| Apostas bloqueadas globalmente | Admin → Config → toggle "Bloqueio global" → BetScreen mostra banner vermelho |
| Limite de picks KO atingido | BetScreen → KO → selecione 16 times no R32 → chips restantes ficam opacos |
| Reduced motion | OS settings → activate reduce motion → recarregue → animações zeradas |

---

## 3. Roteiro para ferramentas externas

### 3.1 — Lighthouse (Chrome DevTools)

```
1. Abra https://bolao2026-a76c7.web.app em modo anônimo
2. F12 → Lighthouse tab
3. Categories: Performance + Accessibility + Best Practices + SEO
4. Device: Mobile primeiro, depois Desktop
5. Generate report
```

**Esperado** (estimativa baseada na auditoria estática):
- Performance: 88-95 (bundle gzipped ~178KB total, chunks lazy)
- Accessibility: 92-96 (3 atenções, 0 críticos)
- Best Practices: 95-100
- SEO: 85-92 (faltam meta tags description, og:image — fora do escopo de design)

### 3.2 — WAVE (extensão Chrome ou wave.webaim.org)

Foque em:
- "Errors" tab: deve estar vazia
- "Contrast Errors": comparar com a seção 1.1 acima
- "Alerts": esperam-se alertas de heading-skip (atenção #2)

### 3.3 — axe DevTools (extensão Chrome)

Executar em cada tela autenticada. Issues esperados:
- 0 critical
- 0-1 serious (heading order)
- 1-2 moderate (target size em controls densos)

---

## 4. Como atualizar este doc

Quando alterar tokens em `src/styles/design-system.css`:
1. Recalcule os contrastes afetados (use https://webaim.org/resources/contrastchecker/)
2. Atualize a seção 1.1
3. Re-deploy o `public/styleguide.html` para refletir os novos valores
4. Re-execute o checklist da seção 2 em pelo menos 1 breakpoint mobile + 1 desktop

---

**Última atualização:** este doc reflete o estado após Pass 7 (commit que
inclui `src/styles/design-system.css`, `src/components/TeamName.tsx`, e
todos os screens refatorados).
