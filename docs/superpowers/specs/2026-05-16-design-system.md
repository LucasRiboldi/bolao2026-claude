# Design System & UX Redesign — Bolão Copa 2026

> **For agentic workers:** Use `superpowers:writing-plans` to generate the implementation plan from this spec.

**Goal:** Refatorar todo o visual do app Bolão Copa 2026 aplicando um design system coeso, navegação mobile-first e UX profissional — sem alterar lógica de negócio.

**Stack:** HTML + CSS + JS puro, Firebase Auth + Firestore compat SDK v10, Firebase Hosting.

---

## 1. Design Tokens

Todas as variáveis CSS definidas em `:root` no `css/styles.css` (substituir as existentes):

```css
:root {
  /* Superfícies */
  --bg:       #0d1117;
  --surface:  #161b22;
  --surface2: #21262d;
  --border:   #30363d;

  /* Texto */
  --text:  #e6edf3;
  --muted: #8b949e;

  /* Marca */
  --gold:        #d4aa2c;
  --gold-dim:    rgba(212,170,44,.12);
  --gold-border: rgba(212,170,44,.28);
  --green:       #1a7f37;
  --red:         #da3633;

  /* Raio padrão */
  --radius: 10px;
}
```

**Tipografia:** `Inter` (Google Fonts), pesos 400–900. Aplicar em `<link>` no `<head>` de `index.html`.

---

## 2. Navegação — Bottom Nav (5 itens)

Substituir a navegação horizontal existente por uma bottom nav fixa com 5 itens.

**Layout:** CSS grid `1fr 1fr 60px 1fr 1fr`. Altura `56px` + `env(safe-area-inset-bottom)`.

**Itens (esquerda → direita):**
| # | Label | Ícone | Destino |
|---|-------|-------|---------|
| 1 | APOSTAR | ⚽ | tela de apostas (grupos + mata-mata) |
| 2 | BETS | 📋 | minhas apostas salvas |
| 3 | COPA | 🌐 | tela central elevada |
| 4 | RANKING | 🏆 | ranking dos apostadores |
| 5 | CONVIDAR | SVG WhatsApp | convite via WhatsApp (ou CONFIG para admin) |

**Botão COPA (item central):**
- Círculo `48×48px`, `border-radius: 50%`
- `background: transparent`
- `border: 1.5px solid rgba(212,170,44,.6)`
- `box-shadow: 0 0 7px rgba(212,170,44,.65), 0 0 18px rgba(212,170,44,.15)`
- Ícone globo `font-size: 1.85rem` (toca a borda interna)
- `margin-top: -20px` (elevado acima da nav)

**Estado ativo:**
- Label cor `var(--gold)` — somente cor, sem underline/indicator
- Ícone inativo: `opacity: 0.55`

---

## 3. Tela LOGIN (`index.html` / `login.html`)

Página scrollável, estrutura vertical:

### 3a. Hero
- Fundo: `linear-gradient(160deg, #050d1a, #071a10, #0d1117)`
- Orbs decorativos com `filter: blur(55px)`, animação `float`
- Grade de campo: `background-image` linear-gradients verdes, `mask-image` fade
- Holofotes SVG: dois `radialGradient` nos cantos superiores
- Confetti: `div.dot` posicionados absolutos com `animation: confetti-fall`
- Badge pulsante: "⚡ Copa do Mundo · Ao vivo agora!"
- Logo: `<img src="img/copa-2026-logo.svg">` com fallback SVG taça dourada animada (float + glow dourado)
- Título shimmer: `background-clip: text` com gradiente `#f0c040 → #fff → #d4aa2c`
- Subtítulo: "Aposte com amigos · 72 jogos · Seja campeão!"
- Barra tricolor (3px, host countries): vermelho | dourado | azul

### 3b. Cards de Jogos ("Jogos de hoje")
Scroll horizontal. Um card por jogo. Estilo **placar de estádio**:
- Fundo: gradiente escuro azul-verde (`#0c1318 → #090e0a`)
- Holofotes via `radialGradient` SVG nos cantos
- Grade de grama na base + círculo central
- Crachá circular bandeira `48×48px` com borda e sombra
- Placa do placar: `background: rgba(255,255,255,.08)`, `backdrop-filter: blur(4px)`

**Estados:**
| Estado | Ribbon | Placar | Crachás |
|--------|--------|--------|---------|
| Ao vivo | dot vermelho pulsante + "AO VIVO" + chip com minuto | `color: #4ade80` (verde), fundo verde | glow verde |
| Em breve | Data (ex: "Seg 16 Jun") + hora dourada | `×` em muted | neutro |
| Encerrado | "✓ Encerrado · data · hora" em cinza | score em muted | opacidade 50% |

Todos os cards têm botão CazéTV (ícone YouTube vermelho + "Assistir ao vivo" / "Vai transmitir" / "Ver replay").

### 3c. Login
Card `background: var(--surface)`:
1. Botão Google prioritário (branco, ícone SVG)
2. Divider "ou use seu e-mail"
3. Tabs Entrar / Criar conta
4. Formulário: inputs com `border-color: var(--gold)` no focus
5. Botão primário: `linear-gradient(135deg, #1a7f37, #2ea043)`
6. Link "Esqueci minha senha" em `var(--gold)`

**Tab Criar conta** adiciona campos: nome, email, senha, confirmar senha.

### 3d. Ranking Público
Top 5 apostadores, mesmo layout da tela de Ranking logado:
- 1º lugar: `border-color: var(--gold-border)`, pts dourados
- 2º / 3º: medalhas emoji
- CTA: "🏆 Quero participar!" com `background: linear-gradient(var(--gold), #e8c040)`, texto `#0d1117`

---

## 4. Tela APOSTAR

### 4a. Barra de Progresso
- Abrange grupos + mata-mata (total de apostas vs. realizadas)
- `linear-gradient(90deg, var(--green), var(--gold))`
- Texto: "X de Y apostas realizadas"

### 4b. Fase de Grupos
Cada grupo em card. **Cor de borda esquerda** por grupo:

| Grupo | Cor |
|-------|-----|
| A | `#e74c3c` | B | `#e67e22` | C | `#f39c12` | D | `#2ecc71` |
| E | `#1abc9c` | F | `#3498db` | G | `#9b59b6` | H | `#e91e63` |
| I | `#00bcd4` | J | `#8bc34a` | K | `#ff5722` | L | `#607d8b` |

**Layout da linha de jogo** (CSS grid `1fr auto 1fr`):
```
[nome_time1 🏳] [-] [gol1] [+] × [+] [gol2] [-] [🏳 nome_time2]
```
- Scores em cor neutra (não ganhou pontos ainda)
- Nomes: `font-size` reduzido se necessário; troca para `TEAMS[id].short` (sigla 3 letras de `data.js`) se o nome não couber

### 4c. Mata-mata (abaixo dos grupos)
- Título: "Mata-mata"
- Slots por fase: 32 → 16 → 8 → 4 → 2 (3º/4º lugar) → 2 (final)
- Click em seleção avança para próxima fase
- Exibe a seleção que o usuário apostou que chega àquela etapa

---

## 5. Tela BETS (Minhas Apostas)

Tela somente leitura. Layout compacto (menos espaçamento que APOSTAR).

**Cabeçalho:**
- Botão "Salvar PDF" + botão "Compartilhar via WhatsApp"

**Por grupo:**
- Header com badge de pontos por acerto à direita
- Linhas: `time1 🏳 | palpite | 🏳 time2 | pts ganhos | resultado oficial / data do jogo`
- Cores de linha quando resultado lançado:
  - Acerto exato: `background: rgba(212,170,44,.07)` (dourado)
  - Resultado correto (sem placar exato): `background: rgba(26,127,55,.07)` (verde)
  - Errou: `background: rgba(218,54,51,.05)` (vermelho)

**Mata-mata:** lista das seleções apostadas por fase (32, 16, 8, 4, 2, 2)

---

## 6. Tela COPA (Classificação Oficial)

### 6a. Fase de Grupos
Replicar tabela oficial FIFA 2026 — formato existente no projeto está correto, manter.

### 6b. Mata-mata Oficial
Chaveamento em branco aguardando equipes classificadas. Mesma estrutura visual do mata-mata de apostas, mas com dados oficiais. Slots vazios até equipes passarem de fase.

---

## 7. Tela RANKING

- Card do usuário logado com posição, pontos, delta
- Lista ordenada por pontuação
- Colunas: posição | avatar (iniciais) | nome | variação | pontos

---

## 8. Tela CONVIDAR / CONFIG

**Usuário normal (CONVIDAR):**
- Botão com ícone SVG oficial WhatsApp (círculo verde + path)
- Ação: gera mensagem de convite e abre `https://wa.me/?text=...`

**Admin (CONFIG):**
- Acesso às ferramentas administrativas existentes

---

## 9. Micro-interações & Loading

- Inputs: `border-color: var(--gold)` no `:focus`
- Botões: `transition: filter .15s` + `hover: brightness(1.1)`
- Skeleton loading: retângulos `background: var(--surface2)` com shimmer animation enquanto dados carregam
- `prefers-reduced-motion`: desativar todas as animações CSS

---

## 10. Acessibilidade

- `outline: 2px solid var(--gold)` no `:focus-visible` (não `:focus`)
- Modais com `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Tab panels com `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`
- Escape fecha modais
- Focus trap dentro de modais abertos

---

## 11. Performance

- Todos os `<script>` com atributo `defer`
- Google Fonts: `rel="preconnect"` + `display=swap`
- Logo Copa 2026 SVG em `img/copa-2026-logo.svg` (copiar de `C:\Users\lucas\Desktop\img\tournaments_fifa-world-cup-2026.football-logos.cc.svg`)
