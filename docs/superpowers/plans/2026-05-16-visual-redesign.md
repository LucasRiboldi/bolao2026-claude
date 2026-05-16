# Visual Redesign — Bolão Copa 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o design system aprovado (tokens CSS, Inter, bottom nav, redesign de todas as telas) sem alterar lógica de negócio.

**Architecture:** Edições cirúrgicas em `css/styles.css` (tokens + novos componentes), `index.html` (estrutura nav + auth screen), e JS mínimo (`utils.js`, `app.js`, `auth.js`, `groupStage.js`). Nenhuma lógica de negócio é alterada.

**Tech Stack:** HTML + CSS + JS puro, Firebase Auth compat SDK v10, Google Fonts (Inter).

---

## File Map

| Arquivo | Tipo | O que muda |
|---------|------|-----------|
| `css/styles.css` | Modify | `:root` tokens, Inter body font, bottom-nav, auth screen, group colors, match row, bets rows, progress bar, micro-interactions |
| `index.html` | Modify | `<link>` Inter, `<img>` logo, auth-screen HTML, nav HTML (`.nav-tabs` → `.bottom-nav`), `<section id="section-convidar">` |
| `js/utils.js` | Modify | `showSection()` — atualiza classe active no `.bottom-nav` em vez de `.nav-tab` |
| `js/app.js` | Modify | Listeners de tab agora apontam para `.bottom-nav-item` + adicionar seção `convidar` |
| `js/auth.js` | Modify | Adicionar Google Sign-In (Firebase `GoogleAuthProvider`) |
| `js/groupStage.js` | Modify | Score renderizado em classe neutra; truncar nome com `TEAMS[id].short` se > 10 chars |
| `img/copa-2026-logo.svg` | Create | Copiar de `C:\Users\lucas\Desktop\img\tournaments_fifa-world-cup-2026.football-logos.cc.svg` |

---

## Task 1: Design Tokens + Inter Font + Logo

**Files:**
- Modify: `css/styles.css:6-21`
- Modify: `index.html:1-9`
- Create: `img/copa-2026-logo.svg`

- [ ] **Step 1: Copiar logo SVG**

```bash
cp "C:/Users/lucas/Desktop/img/tournaments_fifa-world-cup-2026.football-logos.cc.svg" "img/copa-2026-logo.svg"
```

- [ ] **Step 2: Atualizar `:root` em `css/styles.css`**

Substituir o bloco `:root` (linhas 6-21) por:

```css
:root {
  /* Superfícies */
  --bg:       #0d1117;
  --surface:  #161b22;
  --surface2: #21262d;
  --border:   #30363d;

  /* Texto */
  --text:      #e6edf3;
  --text-muted:#8b949e;
  --muted:     #8b949e;

  /* Marca */
  --gold:        #d4aa2c;
  --gold-dim:    rgba(212,170,44,.12);
  --gold-border: rgba(212,170,44,.28);
  --green:       #1a7f37;
  --accent:      #1a7f37;
  --accent-hover:#2ea043;
  --red:         #da3633;

  /* Layout */
  --radius:    10px;
  --radius-sm: 6px;
  --shadow:    0 4px 16px rgba(0,0,0,.4);
  --transition:0.18s ease;

  /* Bottom nav */
  --nav-h: 60px;
}
```

- [ ] **Step 3: Adicionar Inter ao `index.html` e atualizar `body` font**

Em `index.html`, adicionar `<link>` Inter antes de `css/styles.css`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

Em `css/styles.css`, alterar `body { font-family: ... }` (linha ~28):
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.5;
}
```

- [ ] **Step 4: Atualizar cor do spinner para usar `--green`**

Em `css/styles.css`, linha com `border-top-color: var(--accent)`:
```css
.spinner { border-top-color: var(--green); }
```

- [ ] **Step 5: Verificar no browser**

Abrir `index.html` localmente (ou `firebase emulators:start`). A fonte deve ser Inter visível nos títulos. O token `--gold` agora é `#d4aa2c` (menos saturado que antes).

- [ ] **Step 6: Commit**

```bash
git add css/styles.css index.html img/copa-2026-logo.svg
git commit -m "feat: design tokens Inter font e logo Copa 2026"
```

---

## Task 2: Bottom Nav — HTML

**Files:**
- Modify: `index.html:203-210` (bloco `<nav class="nav-tabs">`)
- Modify: `index.html:179-397` (adicionar `<section id="section-convidar">`)

- [ ] **Step 1: Substituir `<nav class="nav-tabs">` pelo bottom nav**

Localizar em `index.html`:
```html
      <nav class="nav-tabs" role="tablist">
        <button id="tab-groups"    class="nav-tab active" data-section="groups"    role="tab" aria-selected="true"  aria-controls="section-groups">⚽ Grupos</button>
        <button id="tab-mybets"    class="nav-tab"        data-section="mybets"    role="tab" aria-selected="false" aria-controls="section-mybets">📋 Apostas</button>
        <button id="tab-standings" class="nav-tab"        data-section="standings" role="tab" aria-selected="false" aria-controls="section-standings">📊 Classificação</button>
        <button id="tab-ranking"   class="nav-tab"        data-section="ranking"   role="tab" aria-selected="false" aria-controls="section-ranking">🏅 Ranking</button>
        <button id="tab-admin"     class="nav-tab admin-only hidden" data-section="admin" role="tab" aria-selected="false" aria-controls="section-admin">🔧 Admin</button>
      </nav>
```

Substituir por (manter dentro do `<header class="app-header">`):
```html
      <nav class="bottom-nav" role="tablist" aria-label="Navegação principal">
        <button class="bottom-nav-item active" data-section="groups"   role="tab" aria-selected="true"  aria-controls="section-groups">
          <span class="bnav-icon">⚽</span>
          <span class="bnav-lbl">APOSTAR</span>
        </button>
        <button class="bottom-nav-item" data-section="mybets"          role="tab" aria-selected="false" aria-controls="section-mybets">
          <span class="bnav-icon">📋</span>
          <span class="bnav-lbl">BETS</span>
        </button>
        <button class="bottom-nav-item bottom-nav-copa" data-section="standings" role="tab" aria-selected="false" aria-controls="section-standings">
          <span class="bnav-copa-btn" aria-hidden="true">🌐</span>
          <span class="bnav-lbl">COPA</span>
        </button>
        <button class="bottom-nav-item" data-section="ranking"         role="tab" aria-selected="false" aria-controls="section-ranking">
          <span class="bnav-icon">🏆</span>
          <span class="bnav-lbl">RANKING</span>
        </button>
        <button class="bottom-nav-item admin-only hidden" data-section="admin" role="tab" aria-selected="false" aria-controls="section-admin">
          <span class="bnav-icon">⚙️</span>
          <span class="bnav-lbl">CONFIG</span>
        </button>
        <button class="bottom-nav-item non-admin-only" data-section="convidar" role="tab" aria-selected="false" aria-controls="section-convidar">
          <span class="bnav-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>
          <span class="bnav-lbl">CONVIDAR</span>
        </button>
      </nav>
```

- [ ] **Step 2: Adicionar `<section id="section-convidar">` antes de `</section><!-- /dashboard -->`**

Inserir antes de `</section><!-- /dashboard -->` (linha 397):
```html
    <!-- ===== CONVIDAR ===== -->
    <section id="section-convidar" class="content-section hidden" role="tabpanel" aria-labelledby="bnav-convidar">
      <div class="section-header">
        <h2>Convidar Amigos</h2>
        <p>Chame seus amigos para participar do bolão!</p>
      </div>
      <div class="convidar-card">
        <div class="convidar-logo">
          <img src="img/copa-2026-logo.svg" alt="FIFA World Cup 2026" width="120" height="120"
               onerror="this.style.display='none'">
        </div>
        <p class="convidar-desc">Convide seus amigos para disputar o <strong>Bolão Copa do Mundo 2026</strong>. Compartilhe via WhatsApp com um clique!</p>
        <button class="btn-convidar" onclick="_shareInvite()">
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Convidar no WhatsApp
        </button>
      </div>
    </section>
```

- [ ] **Step 3: Remover `<header class="app-header">` do fluxo normal e mover bottom-nav para o bottom**

A `<header class="app-header">` atual engloba título + nav. Manter o header mas tirar o `<nav>` de dentro dele (já feito no Step 1 — o nav agora é filho direto do `#dashboard-screen`). Mover o `</nav>` para antes de `</section><!-- /dashboard -->` (após todas as sections):

Resultado final da estrutura em `index.html`:
```html
<section id="dashboard-screen" class="screen hidden">
  <!-- orbs -->
  <header class="app-header">
    <div class="header-inner"> ... título, user info, logout ... </div>
  </header>

  <!-- content sections ... -->

  <nav class="bottom-nav" ...> ... </nav>
</section>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: estrutura HTML do bottom nav e seção convidar"
```

---

## Task 3: Bottom Nav — CSS + JS

**Files:**
- Modify: `css/styles.css` (adicionar ao final do arquivo)
- Modify: `js/utils.js:22-30`
- Modify: `js/app.js:13-35`

- [ ] **Step 1: Adicionar CSS do bottom nav ao final de `css/styles.css`**

```css
/* =============================================
   BOTTOM NAV
   ============================================= */
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: var(--nav-h);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: 1fr 1fr 60px 1fr 1fr;
  align-items: end;
  z-index: 100;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 8px;
  gap: 3px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  opacity: .55;
  transition: opacity var(--transition);
  min-height: var(--nav-h);
}
.bottom-nav-item.active {
  opacity: 1;
}
.bottom-nav-item.active .bnav-lbl {
  color: var(--gold);
}

.bnav-icon {
  font-size: 1.2rem;
  line-height: 1;
}
.bnav-icon svg {
  display: block;
}
.bnav-lbl {
  font-size: .52rem;
  font-weight: 700;
  letter-spacing: .6px;
  text-transform: uppercase;
  color: var(--text-muted);
  transition: color var(--transition);
}

/* Botão COPA elevado */
.bottom-nav-copa {
  opacity: 1;
  padding-bottom: 6px;
  justify-content: flex-end;
}
.bnav-copa-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: transparent;
  border: 1.5px solid rgba(212,170,44,.6);
  box-shadow: 0 0 7px rgba(212,170,44,.65), 0 0 18px rgba(212,170,44,.15);
  font-size: 1.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -20px;
  line-height: 1;
}
.bottom-nav-copa.active .bnav-copa-btn {
  box-shadow: 0 0 12px rgba(212,170,44,.9), 0 0 28px rgba(212,170,44,.3);
}
.bottom-nav-copa .bnav-lbl {
  margin-top: 2px;
}

/* Ocultar nav-tabs antiga se ainda existir */
.nav-tabs { display: none !important; }

/* Padding inferior do conteúdo para não ficar sob o nav */
.content-section {
  padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 16px);
}

/* Header sem nav dentro */
.app-header {
  position: sticky;
  top: 0;
  z-index: 90;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  gap: 8px;
}
.header-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text);
}
```

- [ ] **Step 2: Atualizar `showSection()` em `js/utils.js`**

Substituir a função `showSection` (linhas 22-30):

```javascript
function showSection(id) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
  const sec = document.getElementById(`section-${id}`);
  if (sec) sec.classList.remove('hidden');

  document.querySelectorAll('.bottom-nav-item').forEach(t => {
    const isActive = t.dataset.section === id;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
```

- [ ] **Step 3: Atualizar listeners de tab em `js/app.js`**

Substituir o bloco de listeners (linhas 13-35) — mudar `.nav-tab` para `.bottom-nav-item` e adicionar caso `convidar`:

```javascript
  document.querySelectorAll('.bottom-nav-item').forEach(tab => {
    tab.addEventListener('click', async () => {
      const section = tab.dataset.section;
      showSection(section);

      invalidateResultsCache();
      sessionStorage.removeItem('bolao_ranking');

      if (section === 'ranking' && auth.currentUser) {
        await initRanking(auth.currentUser.uid);
      }
      if (section === 'standings') {
        await initStandings();
      }
      if (section === 'mybets' && auth.currentUser) {
        await initMyBets(auth.currentUser.uid);
      }
      if (section === 'admin' && isAdmin()) {
        await initAdminPanel();
      }
    });
  });
```

- [ ] **Step 4: Mostrar/ocultar botão CONVIDAR vs CONFIG em `js/app.js`**

Na função `initAdminUI()` ou onde `admin-only hidden` é gerenciado, adicionar lógica para `.non-admin-only`:

Localizar em `js/admin.js` ou `js/app.js` onde `.admin-only` é revelado. Após revelar `.admin-only`, ocultar `.non-admin-only`:

```javascript
// Adicionar após a lógica existente de admin-only:
document.querySelectorAll('.non-admin-only').forEach(el => {
  el.classList.toggle('hidden', isAdmin());
});
```

- [ ] **Step 5: Verificar navegação**

Abrir o app. O bottom nav deve aparecer com 5 itens. Clicar em cada um deve trocar a seção visível. COPA (globo) deve estar elevado com glow dourado.

- [ ] **Step 6: Commit**

```bash
git add css/styles.css js/utils.js js/app.js js/admin.js
git commit -m "feat: bottom nav CSS e JS wiring"
```

---

## Task 4: Auth Screen — HTML Redesign

**Files:**
- Modify: `index.html:54-177` (bloco `#auth-screen`)

- [ ] **Step 1: Substituir `<section id="auth-screen">` completo**

Localizar e substituir o bloco inteiro de `<section id="auth-screen" class="screen">` até `</section>` (linhas 54-177):

```html
  <!-- ======= AUTH SCREEN ======= -->
  <section id="auth-screen" class="screen">
    <div class="auth-scroll">

      <!-- HERO -->
      <div class="auth-hero">
        <!-- Orbs de fundo -->
        <div class="auth-orb auth-orb-green"></div>
        <div class="auth-orb auth-orb-gold"></div>
        <div class="auth-orb auth-orb-bottom"></div>
        <!-- Grade campo -->
        <div class="auth-field-grid"></div>
        <div class="auth-field-center"></div>
        <!-- Holofotes SVG -->
        <svg class="auth-spotlights" preserveAspectRatio="none" viewBox="0 0 400 260" aria-hidden="true">
          <defs>
            <radialGradient id="asl" cx="15%" cy="0%" r="55%">
              <stop offset="0%" stop-color="rgba(200,220,255,.1)"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
            <radialGradient id="asr" cx="85%" cy="0%" r="55%">
              <stop offset="0%" stop-color="rgba(200,220,255,.1)"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>
          <rect width="400" height="260" fill="url(#asl)"/>
          <rect width="400" height="260" fill="url(#asr)"/>
        </svg>

        <!-- Badge "ao vivo" -->
        <div class="auth-badge" aria-hidden="true">
          <span class="auth-badge-dot"></span>
          <span>⚡ Copa do Mundo · Ao vivo agora!</span>
        </div>

        <!-- Logo oficial -->
        <img class="auth-logo"
             src="img/copa-2026-logo.svg"
             alt="FIFA World Cup 2026"
             width="100" height="120"
             onerror="this.style.display='none'">

        <h1 class="auth-title">Bolão 2026</h1>
        <p class="auth-sub">Aposte com amigos · 72 jogos · Seja campeão!</p>

        <!-- Barra tricolor host countries -->
        <div class="auth-colorbar" aria-hidden="true">
          <span style="background:#b5261e;flex:2;"></span>
          <span style="background:var(--gold);flex:1;"></span>
          <span style="background:#1a5fb4;flex:2;"></span>
          <span style="background:var(--gold);flex:1;"></span>
          <span style="background:#d52b1e;flex:2;"></span>
        </div>
      </div>

      <!-- CARDS DE JOGOS (renderizados por JS em #today-matches-anchor) -->
      <div class="auth-section-label">🔴 Jogos de hoje · Assista ao vivo</div>
      <div id="today-matches-anchor" class="today-matches-anchor"></div>

      <!-- FORMULÁRIO DE LOGIN -->
      <div class="auth-section-label">🔐 Entre ou crie sua conta</div>
      <div class="auth-card">

        <!-- Google Sign-In (prioritário) -->
        <button id="btn-google-signin" class="btn-google-signin" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>

        <div class="auth-divider">
          <div class="auth-divider-line"></div>
          <span class="auth-divider-txt">ou use seu e-mail</span>
          <div class="auth-divider-line"></div>
        </div>

        <!-- Tabs Entrar / Cadastrar -->
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab active" data-tab="login" role="tab" aria-selected="true">Entrar</button>
          <button class="auth-tab" data-tab="register" role="tab" aria-selected="false">Criar conta</button>
        </div>

        <div id="reg-closed-banner" class="reg-closed-banner hidden">
          🔐 Cadastro temporariamente fechado. Contate o administrador.
        </div>

        <form id="auth-form" novalidate>
          <div id="field-name" class="form-group hidden">
            <input type="text" id="inp-name" placeholder="Seu nome" autocomplete="name" class="auth-inp">
          </div>
          <div class="form-group">
            <input type="email" id="inp-email" placeholder="seu@email.com" required autocomplete="email" class="auth-inp">
          </div>
          <div class="form-group">
            <input type="password" id="inp-password" placeholder="Mínimo 6 caracteres" required autocomplete="current-password" class="auth-inp">
          </div>
          <p id="auth-error" class="error-msg hidden"></p>
          <button type="submit" id="auth-submit" class="btn btn-primary btn-full">Entrar no Bolão ⚽</button>
        </form>

        <button class="auth-forgot-link" type="button" onclick="auth.sendPasswordResetEmail(document.getElementById('inp-email').value).then(()=>showToast('Email enviado!','success')).catch(e=>showToast(e.message,'error'))">
          Esqueci minha senha
        </button>
      </div>

      <!-- RANKING PÚBLICO -->
      <div class="auth-section-label">🏆 Ranking ao vivo</div>
      <div class="public-ranking-box public-ranking-box--auth">
        <div id="public-ranking-list"><p class="muted" style="padding:16px">Carregando…</p></div>
      </div>

      <div style="height: 40px;"></div>
    </div>
  </section>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: auth screen HTML redesign com hero, logo e Google btn"
```

---

## Task 5: Auth Screen — CSS

**Files:**
- Modify: `css/styles.css` (adicionar ao final)

- [ ] **Step 1: Adicionar CSS da auth screen**

```css
/* =============================================
   AUTH SCREEN
   ============================================= */
#auth-screen {
  background: var(--bg);
  min-height: 100vh;
}
.auth-scroll {
  overflow-y: auto;
  min-height: 100vh;
}

/* Hero */
.auth-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #050d1a 0%, #071a10 45%, #0d1117 100%);
  padding: 32px 20px 24px;
  text-align: center;
}
.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(55px);
  pointer-events: none;
}
.auth-orb-green  { width: 200px; height: 200px; background: rgba(26,127,55,.4);  top: -70px; left: -60px;  animation: authOrbFloat 7s ease-in-out infinite; }
.auth-orb-gold   { width: 130px; height: 130px; background: rgba(212,170,44,.3); top: 10px;  right: -30px; animation: authOrbFloat 9s ease-in-out infinite reverse; }
.auth-orb-bottom { width: 80px;  height: 80px;  background: rgba(26,127,55,.2);  bottom: 0;  left: 40%;   animation: authOrbFloat 6s ease-in-out infinite; }
@keyframes authOrbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

.auth-field-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(26,127,55,.07) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(26,127,55,.07) 1px,transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.6) 25%,rgba(0,0,0,.6) 75%,transparent 100%);
  pointer-events: none;
}
.auth-field-center {
  position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
  width: 40px; height: 40px; border-radius: 50%;
  border: 1.5px solid rgba(26,127,55,.22); pointer-events: none;
}
.auth-spotlights {
  position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
}

.auth-badge {
  position: relative; z-index: 2;
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
  border-radius: 20px; padding: 5px 12px; margin-bottom: 14px;
  color: rgba(255,255,255,.7); font-size: .6rem; font-weight: 700; letter-spacing: .8px; text-transform: uppercase;
}
.auth-badge-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #e84040;
  animation: authBadgePulse 1.3s infinite;
}
@keyframes authBadgePulse { 0%,100%{opacity:.4} 50%{opacity:1} }

.auth-logo {
  display: block; margin: 0 auto 10px; position: relative; z-index: 2;
  animation: authOrbFloat 4s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(212,170,44,.5)) drop-shadow(0 0 45px rgba(212,170,44,.2));
}
.auth-title {
  position: relative; z-index: 2;
  font-size: 1.8rem; font-weight: 900; letter-spacing: -1px; line-height: 1.1;
  background: linear-gradient(90deg, #f0c040, #fff 35%, #d4aa2c 65%, #fff);
  background-size: 300%;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  animation: authShimmer 4s linear infinite;
}
@keyframes authShimmer { 0%{background-position:0%} 100%{background-position:300%} }
.auth-sub {
  position: relative; z-index: 2;
  color: rgba(255,255,255,.45); font-size: .72rem; margin-top: 4px; font-weight: 500;
}
.auth-colorbar {
  position: relative; z-index: 2;
  display: flex; height: 3px; border-radius: 99px; overflow: hidden;
  margin: 14px 24px 0; gap: 2px;
}
.auth-colorbar span { flex: 1; border-radius: 99px; }

/* Section label */
.auth-section-label {
  color: var(--text-muted);
  font-size: .6rem; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
  padding: 12px 16px 6px;
}

/* Today matches cards — horizontal scroll */
.today-matches-anchor {
  display: flex; gap: 10px;
  padding: 0 16px 14px;
  overflow-x: auto; scrollbar-width: none;
}
.today-matches-anchor::-webkit-scrollbar { display: none; }

/* Match card — placar estádio */
.tdm-card {
  flex-shrink: 0; width: 240px; border-radius: 14px; overflow: hidden; position: relative;
  background: linear-gradient(180deg,#0c1318 0%,#0a130d 55%,#090e0a 100%);
}
.tdm-card::before {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 80% 60% at 20% 0%,rgba(180,200,220,.07),transparent 60%),
              radial-gradient(ellipse 80% 60% at 80% 0%,rgba(180,200,220,.07),transparent 60%);
}
.tdm-grass {
  position: absolute; bottom: 0; left: 0; right: 0; height: 38px;
  background-image: linear-gradient(rgba(26,127,55,.18) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(26,127,55,.18) 1px,transparent 1px);
  background-size: 16px 16px;
  mask-image: linear-gradient(to top,rgba(0,0,0,.5),transparent);
  pointer-events: none;
}
.tdm-circle {
  position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
  width: 26px; height: 26px; border-radius: 50%;
  border: 1px solid rgba(26,127,55,.22); pointer-events: none;
}
.tdm-inner { position: relative; z-index: 2; padding: 10px 10px 8px; }

/* Ribbon */
.tdm-ribbon {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding-bottom: 8px;
}
.tdm-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
  animation: authBadgePulse 1s infinite;
}
.tdm-live-label {
  color: #ef4444; font-size: .58rem; font-weight: 800;
  letter-spacing: 1px; text-transform: uppercase;
  display: flex; align-items: center; gap: 4px;
}
.tdm-time-chip {
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
  border-radius: 20px; padding: 3px 10px;
  color: rgba(255,255,255,.8); font-size: .65rem; font-weight: 800;
}
.tdm-dt {
  color: rgba(255,255,255,.5); font-size: .58rem; font-weight: 700;
  display: flex; align-items: center; gap: 4px;
}
.tdm-dt-hora { color: var(--gold); font-weight: 800; }
.tdm-dt-sep  { width: 2px; height: 2px; border-radius: 50%; background: rgba(255,255,255,.3); }

/* Score placar */
.tdm-row {
  display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 0 2px;
}
.tdm-team {
  display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1;
}
.tdm-flag {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(255,255,255,.07); border: 2px solid rgba(255,255,255,.18);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.7rem; box-shadow: 0 3px 12px rgba(0,0,0,.5);
}
.tdm-flag.tdm-live { border-color: rgba(26,127,55,.55); box-shadow: 0 0 12px rgba(26,127,55,.25), 0 3px 12px rgba(0,0,0,.5); }
.tdm-name {
  color: rgba(255,255,255,.85); font-size: .58rem; font-weight: 800;
  text-align: center; text-shadow: 0 1px 5px rgba(0,0,0,.9); text-transform: uppercase;
}
.tdm-plaque {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
  border-radius: 10px; padding: 6px 10px; min-width: 62px;
  backdrop-filter: blur(4px);
}
.tdm-plaque-live { background: rgba(26,127,55,.14); border-color: rgba(26,127,55,.28); }
.tdm-score {
  font-size: 1.5rem; font-weight: 900; letter-spacing: 3px; line-height: 1; color: #fff;
}
.tdm-score-live    { color: #4ade80; }
.tdm-score-soon    { color: rgba(255,255,255,.35); }
.tdm-score-done    { color: rgba(255,255,255,.3); }
.tdm-score-sublabel {
  font-size: .46rem; font-weight: 700; letter-spacing: .8px;
  text-transform: uppercase; color: rgba(255,255,255,.3);
}

/* Watch button */
.tdm-watch {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin: 8px 0 2px; padding: 7px; width: 100%;
  background: rgba(255,0,0,.1); border: 1px solid rgba(255,0,0,.2); border-radius: 8px;
  text-decoration: none; cursor: pointer;
}
.tdm-yt-icon {
  width: 16px; height: 11px; background: #FF0000; border-radius: 3px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tdm-yt-play {
  border-left: 6px solid #fff; border-top: 4px solid transparent;
  border-bottom: 4px solid transparent; margin-left: 1px;
}
.tdm-watch-txt   { color: #ff5555; font-size: .62rem; font-weight: 700; }
.tdm-watch-sub   { color: rgba(255,255,255,.28); font-size: .55rem; }

/* Auth card */
.auth-card {
  margin: 0 16px 14px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px;
}
.btn-google-signin {
  width: 100%; background: #fff; color: #1f1f1f;
  border: none; border-radius: 8px; padding: 11px;
  font-size: .85rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Inter', sans-serif; margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.4);
  transition: transform var(--transition);
}
.btn-google-signin:hover { transform: translateY(-1px); }

.auth-divider {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
}
.auth-divider-line { flex: 1; height: 1px; background: var(--border); }
.auth-divider-txt  { color: var(--text-muted); font-size: .6rem; font-weight: 600; }

.auth-tabs {
  display: flex; background: var(--surface2);
  border-radius: 7px; padding: 3px; margin-bottom: 12px;
}
.auth-tab {
  flex: 1; text-align: center; padding: 7px;
  border-radius: 5px; font-size: .72rem; font-weight: 700;
  cursor: pointer; color: var(--text-muted);
  background: none; border: none; font-family: 'Inter', sans-serif;
  transition: color var(--transition), background var(--transition);
}
.auth-tab.active {
  background: var(--bg); color: var(--text);
  box-shadow: 0 1px 3px rgba(0,0,0,.4);
}
.auth-inp {
  width: 100%; background: var(--surface2);
  border: 1px solid var(--border); border-radius: 7px;
  padding: 10px 12px; color: var(--text); font-size: .8rem;
  font-family: 'Inter', sans-serif; outline: none;
  transition: border-color var(--transition);
}
.auth-inp::placeholder { color: var(--text-muted); }
.auth-inp:focus        { border-color: var(--gold); }

.auth-forgot-link {
  display: block; width: 100%; background: none; border: none;
  color: var(--gold); font-size: .68rem; font-weight: 600;
  text-align: center; cursor: pointer; margin-top: 10px;
  font-family: 'Inter', sans-serif;
}

/* Public ranking box */
.public-ranking-box--auth {
  margin: 0 16px 14px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 14px;
}

/* CTA do ranking público */
.pub-rank-cta {
  background: linear-gradient(135deg, #071a10, #120a00);
  border: 1px solid var(--gold-border);
  border-radius: 10px; padding: 14px; text-align: center; margin-top: 8px;
}
.pub-rank-cta-txt  { color: rgba(255,255,255,.5); font-size: .68rem; margin-bottom: 8px; line-height: 1.5; }
.pub-rank-cta-txt strong { color: var(--text); }
.pub-rank-cta-btn  {
  background: linear-gradient(135deg, var(--gold), #e8c040);
  color: #0d1117; border: none; border-radius: 7px;
  padding: 9px 22px; font-size: .77rem; font-weight: 800;
  cursor: pointer; font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: auth screen CSS hero, match cards e login card"
```

---

## Task 6: Auth Screen — JS (match cards + Google Sign-In)

**Files:**
- Modify: `js/app.js` (função `_calRenderCards` / `_loadTodayMatches`)
- Modify: `js/auth.js` (adicionar Google Sign-In)

- [ ] **Step 1: Atualizar `_calRenderCards` em `js/app.js` para gerar `.tdm-card`**

Em `js/app.js`, a função `_calRenderCards` está na **linha 331** e usa o anchor `today-matches-anchor` (linha 237). Substituir o HTML gerado dentro dessa função para usar as novas classes `.tdm-card`. A função deve gerar para cada jogo:

```javascript
function _buildMatchCard(match) {
  const isLive     = match.status === 'live';
  const isFinished = match.status === 'finished';
  const scoreHtml  = isLive ? `<span class="tdm-score tdm-score-live">${match.home} : ${match.away}</span>`
                   : isFinished ? `<span class="tdm-score tdm-score-done">${match.home} : ${match.away}</span>`
                   : `<span class="tdm-score tdm-score-soon">×</span>`;

  const ribbonHtml = isLive
    ? `<span class="tdm-live-label"><span class="tdm-live-dot"></span>AO VIVO</span>
       <div class="tdm-time-chip">${match.minute}'</div>`
    : isFinished
    ? `<div class="tdm-dt"><span>✓ Encerrado · ${match.dateStr}</span><div class="tdm-dt-sep"></div><span>${match.timeStr}</span></div>`
    : `<div class="tdm-dt"><span>${match.dateStr}</span><div class="tdm-dt-sep"></div><span class="tdm-dt-hora">${match.timeStr}</span></div>`;

  const watchTxt   = isLive ? 'Assistir ao vivo' : isFinished ? 'Ver replay' : 'Vai transmitir';
  const watchStyle = isFinished ? 'opacity:.55' : isLive ? '' : 'background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.08)';

  const flagClass = isLive ? 'tdm-flag tdm-live' : 'tdm-flag';
  const plaqueClass = isLive ? 'tdm-plaque tdm-plaque-live' : 'tdm-plaque';

  return `
    <div class="tdm-card${isFinished ? '" style="opacity:.65' : ''}">
      <div class="tdm-grass"></div><div class="tdm-circle"></div>
      <div class="tdm-inner">
        <div class="tdm-ribbon">${ribbonHtml}</div>
        <div class="tdm-row">
          <div class="tdm-team">
            <div class="${flagClass}">${match.homeFlag}</div>
            <div class="tdm-name">${match.homeName}</div>
          </div>
          <div class="${plaqueClass}">
            ${scoreHtml}
            <span class="tdm-score-sublabel">${isLive ? 'placar' : isFinished ? 'encerrado' : 'em breve'}</span>
          </div>
          <div class="tdm-team">
            <div class="${flagClass}">${match.awayFlag}</div>
            <div class="tdm-name">${match.awayName}</div>
          </div>
        </div>
        <a class="tdm-watch" href="https://www.youtube.com/@CazéTV" target="_blank" rel="noopener" style="${watchStyle}">
          <div class="tdm-yt-icon"><div class="tdm-yt-play"></div></div>
          <span class="tdm-watch-txt">${watchTxt}</span>
          <span class="tdm-watch-sub">CazéTV</span>
        </a>
      </div>
    </div>`;
}
```

O container `#today-matches-anchor` deve receber as cards diretamente (scroll horizontal via CSS `.today-matches-anchor`). Remover qualquer wrapper `.today-matches-card` que envolvia antes.

- [ ] **Step 2: Adicionar Google Sign-In em `js/auth.js`**

Após a linha que inicializa o form (`#auth-form`), adicionar:

```javascript
// Google Sign-In
const btnGoogle = document.getElementById('btn-google-signin');
if (btnGoogle) {
  btnGoogle.addEventListener('click', async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
      // _onLogin é chamado automaticamente pelo onAuthStateChanged
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        showToast('Erro ao entrar com Google: ' + e.message, 'error');
      }
    }
  });
}
```

- [ ] **Step 3: Verificar auth screen no browser**

- Hero com logo, animações, barra tricolor
- Cards de jogos rolando horizontal com estilos novos
- Botão Google funcional (abre popup)
- Form de email/senha mantido

- [ ] **Step 4: Commit**

```bash
git add js/app.js js/auth.js
git commit -m "feat: match cards estilo placar e Google Sign-In"
```

---

## Task 7: Convidar Screen CSS

**Files:**
- Modify: `css/styles.css` (adicionar ao final)

- [ ] **Step 1: Adicionar CSS do convidar**

```css
/* =============================================
   CONVIDAR SCREEN
   ============================================= */
.convidar-card {
  margin: 0 16px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px 20px;
  text-align: center;
}
.convidar-logo {
  margin-bottom: 16px;
}
.convidar-logo img {
  max-width: 120px; height: auto;
  filter: drop-shadow(0 0 16px rgba(212,170,44,.4));
}
.convidar-desc {
  color: var(--text-muted); font-size: .85rem; line-height: 1.6;
  margin-bottom: 20px;
}
.convidar-desc strong { color: var(--text); }
.btn-convidar {
  display: inline-flex; align-items: center; gap: 10px;
  background: #25D366; color: #fff;
  border: none; border-radius: 10px; padding: 12px 24px;
  font-size: .9rem; font-weight: 700; cursor: pointer;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 4px 16px rgba(37,211,102,.35);
  transition: filter var(--transition);
}
.btn-convidar:hover { filter: brightness(1.08); }
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: CSS tela convidar"
```

---

## Task 8: Group Stage Visual (Grupos + Mata-Mata)

**Files:**
- Modify: `css/styles.css` (adicionar ao final)
- Modify: `js/groupStage.js` (truncar nomes + progress bar gradient)

- [ ] **Step 1: CSS — barra de progresso com gradiente**

```css
/* =============================================
   PROGRESS BAR — gradiente verde→dourado
   ============================================= */
.progress-fill {
  background: linear-gradient(90deg, var(--green), var(--gold)) !important;
  transition: width .4s ease;
}
```

- [ ] **Step 2: CSS — cores de borda por grupo**

```css
/* =============================================
   GROUP COLORS — borda esquerda por grupo
   ============================================= */
.group-card[data-group="A"] { border-left: 3px solid #e74c3c; }
.group-card[data-group="B"] { border-left: 3px solid #e67e22; }
.group-card[data-group="C"] { border-left: 3px solid #f39c12; }
.group-card[data-group="D"] { border-left: 3px solid #2ecc71; }
.group-card[data-group="E"] { border-left: 3px solid #1abc9c; }
.group-card[data-group="F"] { border-left: 3px solid #3498db; }
.group-card[data-group="G"] { border-left: 3px solid #9b59b6; }
.group-card[data-group="H"] { border-left: 3px solid #e91e63; }
.group-card[data-group="I"] { border-left: 3px solid #00bcd4; }
.group-card[data-group="J"] { border-left: 3px solid #8bc34a; }
.group-card[data-group="K"] { border-left: 3px solid #ff5722; }
.group-card[data-group="L"] { border-left: 3px solid #607d8b; }
```

- [ ] **Step 3: Verificar que `group-card` tem atributo `data-group` em `js/groupStage.js`**

Buscar em `js/groupStage.js` onde o elemento do grupo é criado. Deve existir algo como:

```javascript
card.setAttribute('data-group', groupId);
```

Se não existir, adicionar onde o `.group-card` é criado. Exemplo — localizar a linha que faz `card.className = 'group-card'` ou similar e adicionar logo após:

```javascript
groupCard.dataset.group = groupKey; // groupKey = 'A', 'B', etc.
```

- [ ] **Step 4: CSS — match row grid layout**

```css
/* =============================================
   MATCH ROW — grid layout apostar
   ============================================= */
.match-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.match-row:last-child { border-bottom: none; }

.match-team-left  { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.match-team-right { display: flex; align-items: center; justify-content: flex-start; gap: 6px; }

.match-team-name {
  font-size: .78rem; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;
}
.match-team-name.short { font-size: .7rem; }

.match-score-center {
  display: flex; align-items: center; gap: 4px;
}
.match-score-input {
  width: 36px; height: 36px;
  background: var(--surface2); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-muted); /* neutro — não ganhou pontos ainda */
  font-size: .9rem; font-weight: 700; text-align: center;
  font-family: 'Inter', sans-serif; outline: none;
  transition: border-color var(--transition);
}
.match-score-input.filled { color: var(--text); }
.match-score-input:focus  { border-color: var(--gold); }
.match-score-sep {
  color: var(--text-muted); font-size: .8rem; font-weight: 700;
}
```

- [ ] **Step 5: Truncar nome de time em `js/groupStage.js`**

Localizar onde o nome do time é inserido no HTML (buscar `TEAMS[` ou `team.name`). Adicionar helper de truncagem:

```javascript
function _teamDisplayName(teamId) {
  const t = TEAMS[teamId];
  if (!t) return teamId;
  return t.name.length > 10 ? t.short : t.name;
}
```

Usar `_teamDisplayName(teamId)` no lugar de `TEAMS[teamId].name` ao montar as linhas de aposta.

- [ ] **Step 6: Commit**

```bash
git add css/styles.css js/groupStage.js
git commit -m "feat: group colors, match row grid, progress bar gradiente e truncagem de nomes"
```

---

## Task 9: BETS Screen Visual (Minhas Apostas)

**Files:**
- Modify: `css/styles.css` (adicionar ao final)

- [ ] **Step 1: CSS — layout compacto e color-coded rows**

```css
/* =============================================
   BETS SCREEN — compact + color-coded
   ============================================= */
#section-mybets .section-header { margin-bottom: 4px; }

/* Botões topo: PDF + WhatsApp */
.mybets-actions {
  display: flex; gap: 8px; padding: 8px 16px 12px; flex-wrap: wrap;
}
.mybets-actions .btn { flex: 1; min-width: 120px; }

/* Cabeçalho de grupo */
.mybets-group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px 4px;
  font-size: .72rem; font-weight: 800; color: var(--text);
  text-transform: uppercase; letter-spacing: .5px;
}
.mybets-pts-badge {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 20px; padding: 2px 8px;
  font-size: .6rem; font-weight: 700; color: var(--gold);
}

/* Linhas de aposta */
.mybets-row {
  display: grid;
  grid-template-columns: 1fr auto auto 1fr auto auto;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  font-size: .75rem;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.mybets-row-exact   { background: rgba(212,170,44,.07); }
.mybets-row-correct { background: rgba(26,127,55,.07); }
.mybets-row-wrong   { background: rgba(218,54,51,.05); }

.mybets-team { color: var(--text); font-weight: 500; }
.mybets-bet  { color: var(--text-muted); font-weight: 700; font-size: .7rem; white-space: nowrap; }
.mybets-pts  { color: var(--gold); font-weight: 800; font-size: .75rem; min-width: 28px; text-align: right; }
.mybets-result {
  color: var(--text-muted); font-size: .65rem; font-weight: 500;
  white-space: nowrap;
}
.mybets-result.pending { color: var(--text-muted); font-style: italic; }
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: BETS screen CSS compact e color-coded rows"
```

---

## Task 10: Dashboard Header + Micro-interactions

**Files:**
- Modify: `css/styles.css` (adicionar ao final)

- [ ] **Step 1: CSS — header compacto + dash background**

```css
/* =============================================
   DASHBOARD HEADER — compacto
   ============================================= */
.app-header {
  position: sticky; top: 0; z-index: 90;
  background: var(--bg); border-bottom: 1px solid var(--border);
}
.header-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; gap: 8px;
}
.header-title { font-size: 1rem; font-weight: 800; color: var(--text); }
.hdr-username  { font-size: .82rem; font-weight: 600; color: var(--text-muted); }
.score-pill {
  background: var(--gold-dim); border: 1px solid var(--gold-border);
  border-radius: 20px; padding: 2px 10px;
  font-size: .75rem; font-weight: 800; color: var(--gold);
}

/* Remover dash-glow orbs que não precisamos mais */
.dash-glow { display: none; }

/* =============================================
   MICRO-INTERACTIONS
   ============================================= */
.btn, button[class^="btn"] {
  transition: filter var(--transition), transform var(--transition);
}
.btn:hover, button[class^="btn"]:hover {
  filter: brightness(1.08);
}
.btn:active { transform: scale(.97); }

/* Focus visible — acessibilidade */
:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
:focus:not(:focus-visible) { outline: none; }

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}

/* Toast acima do bottom nav */
.toast { bottom: calc(var(--nav-h) + 16px); }
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: header compacto, micro-interactions e acessibilidade"
```

---

## Task 11: Verificação Final

- [ ] **Step 1: Testar todas as telas no browser (mobile viewport 375px)**

Verificar:
- Login: hero animado → cards de jogos → login Google + email → ranking público
- Dashboard header compacto
- Bottom nav com COPA elevado, label dourado no ativo
- APOSTAR: grupos com borda colorida, placar neutro, progress bar verde→dourado
- BETS: lista compacta, rows coloridas
- COPA: classificação existente intacta
- RANKING: pontuação com score-pill dourado
- CONVIDAR: logo + botão verde WhatsApp
- CONFIG (admin): seção admin visível só para admin

- [ ] **Step 2: Smoke test Firebase**

```bash
firebase emulators:start
```
Abrir http://localhost:5000. Login com Google e com email/senha. Salvar uma aposta. Ver ranking.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "feat: redesign visual completo — design system, bottom nav, todas as telas"
```
