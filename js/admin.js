// ---- Admin module -------------------------------------------
const ADMIN_EMAIL = 'lucasriboldi.dev@gmail.com';

function isAdmin() {
  return !!(auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);
}

function initAdminUI() {
  if (!isAdmin()) return;
  document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
}

// ---- Painel admin -------------------------------------------
async function initAdminPanel() {
  const container = document.getElementById('admin-users-list');
  container.innerHTML = '<p class="muted" style="padding:20px">Carregando usuários…</p>';

  try {
    const config = await loadAdminConfig();
    const inp = document.getElementById('inp-whatsapp');
    if (inp && config.whatsapp) inp.value = config.whatsapp;
  } catch {}

  initGlobalLockStatus();

  if (typeof initResultsPanel === 'function') {
    initResultsPanel();
  }

  try {
    const users = await loadAdminUserList();
    _renderAdminUsers(users, container);
  } catch (e) {
    container.innerHTML = `<p class="muted" style="padding:20px">Erro: ${e.message}</p>`;
  }
}

async function adminSaveWhatsApp() {
  const inp = document.getElementById('inp-whatsapp');
  const number = (inp?.value || '').replace(/\D/g, '');
  if (!number) { showToast('Digite um número válido.', 'error'); return; }
  try {
    await saveAdminConfig({ whatsapp: number });
    showToast('WhatsApp salvo! ✅', 'success');
    const btn = document.getElementById('btn-whatsapp');
    if (btn) {
      btn.href = `https://wa.me/${number}`;
      btn.classList.remove('hidden');
    }
  } catch (e) {
    showToast('Erro ao salvar: ' + e.message, 'error');
  }
}

// ---- Lock global: bloqueia/libera TODOS os participantes ----
async function initGlobalLockStatus() {
  try {
    const locked = await loadGlobalLock();
    _updateGlobalLockUI(locked);
  } catch {}
}

function _updateGlobalLockUI(locked) {
  const badge  = document.getElementById('global-lock-badge');
  const btnLock   = document.getElementById('btn-global-lock');
  const btnUnlock = document.getElementById('btn-global-unlock');
  if (badge) {
    badge.textContent = locked ? '🔒 Bloqueado' : '🔓 Aberto';
    badge.className   = 'global-lock-badge ' + (locked ? 'locked' : 'open');
  }
  if (btnLock)   btnLock.classList.toggle('hidden', locked);
  if (btnUnlock) btnUnlock.classList.toggle('hidden', !locked);
}

async function adminSetGlobalLock(lock) {
  const btnLock   = document.getElementById('btn-global-lock');
  const btnUnlock = document.getElementById('btn-global-unlock');
  if (btnLock)   btnLock.disabled   = true;
  if (btnUnlock) btnUnlock.disabled = true;
  try {
    await setGlobalLock(lock);
    _updateGlobalLockUI(lock);
    // Atualiza a UI local se o admin também estiver logado como participante
    if (typeof setGroupStageLocked === 'function') setGroupStageLocked(lock);
    showToast(lock ? '🔒 Apostas bloqueadas para todos!' : '🔓 Apostas liberadas para todos!', 'success');
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
  } finally {
    if (btnLock)   btnLock.disabled   = false;
    if (btnUnlock) btnUnlock.disabled = false;
  }
}

// ---- Lista de participantes (sem botões de lock individual) ----
function _renderAdminUsers(users, container) {
  if (users.length === 0) {
    container.innerHTML = '<p class="muted" style="padding:20px">Nenhum usuário cadastrado.</p>';
    return;
  }
  let html = `<div class="admin-table">`;
  users.forEach(u => {
    const safeName = (u.name || 'Sem nome').replace(/'/g, "\\'");
    html += `
    <div class="admin-user-row" id="adm-row-${u.uid}">
      <div class="admin-user-info">
        <div class="admin-user-name">${u.name || 'Sem nome'}</div>
        <div class="admin-user-email">${u.email || u.uid}</div>
      </div>
      <div class="admin-user-actions">
        <button class="btn-icon" title="Ver apostas"
          onclick="openBetHistory('${u.uid}','${safeName}')">📋</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ---- Histórico de apostas (modal) ---------------------------
async function openBetHistory(uid, name) {
  const modal = document.getElementById('bet-history-modal');
  const title = document.getElementById('bh-title');
  const body  = document.getElementById('bh-body');

  title.textContent = `📋 ${name}`;
  body.innerHTML = `<div class="bh-loading"><div class="spinner"></div>Carregando…</div>`;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const [{ groupBets, knockoutBets }, results] = await Promise.all([
      loadUserBetsForHistory(uid),
      loadResults(),
    ]);
    body.innerHTML = _renderBetHistory(groupBets, knockoutBets, results);
  } catch (e) {
    body.innerHTML = `<p class="muted" style="padding:20px">Erro: ${e.message}</p>`;
  }
}

function closeBetHistory() {
  document.getElementById('bet-history-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ---- Renderização do histórico de apostas -------------------
function _renderBetHistory(groupBets, knockoutBets, results) {
  const gsResults = results.groupStage || {};
  const koResults = results.knockout   || {};
  let html = '';
  let exact = 0, correct = 0, koHits = 0;

  html += `<div class="bh-section-title">⚽ Fase de Grupos</div>`;

  for (const gId of Object.keys(GROUPS)) {
    const color = (typeof GROUP_COLORS !== 'undefined' && GROUP_COLORS[gId]) || '#888';
    html += `<div class="bh-group-block" style="border-left:3px solid ${color}">
      <div class="bh-group-hdr" style="color:${color}">Grupo ${gId}</div>`;

    for (const game of generateGroupGames(gId)) {
      const bet  = groupBets[game.id];
      const res  = gsResults[game.id];
      const home = TEAMS[game.home];
      const away = TEAMS[game.away];

      let cls = 'bh-pending', icon = '⏳', pts = 0;
      if (bet && res) {
        const bH = parseInt(bet.homeGoals, 10), bA = parseInt(bet.awayGoals, 10);
        const rH = parseInt(res.homeGoals,  10), rA = parseInt(res.awayGoals,  10);
        if (!isNaN(bH) && !isNaN(bA) && !isNaN(rH) && !isNaN(rA)) {
          if (bH === rH && bA === rA)                                { cls = 'bh-exact';   icon = '✅'; pts = 3; exact++;   }
          else if (Math.sign(bH - bA) === Math.sign(rH - rA))       { cls = 'bh-correct'; icon = '✓';  pts = 1; correct++; }
          else                                                       { cls = 'bh-wrong';   icon = '❌'; }
        }
      } else if (bet) {
        cls = 'bh-placed'; icon = '📌';
      }

      const betStr  = bet ? `${bet.homeGoals ?? '–'} × ${bet.awayGoals ?? '–'}` : '– × –';
      const realStr = res ? `${res.homeGoals}–${res.awayGoals}` : null;

      html += `
      <div class="bh-game-card ${cls}">
        <span class="bh-si">${icon}</span>
        <div class="bh-teams-row">
          <div class="bh-team bh-team-home">
            <span class="fi fi-${home.iso} bh-flag"></span>
            <span class="bh-team-name">${home.name}</span>
          </div>
          <div class="bh-score-block">
            <span class="bh-bet-score">${betStr}</span>
            ${realStr
              ? `<span class="bh-real-score">Real: ${realStr}</span>`
              : `<span class="bh-waiting">⏳ Aguardando</span>`}
          </div>
          <div class="bh-team bh-team-away">
            <span class="bh-team-name">${away.name}</span>
            <span class="fi fi-${away.iso} bh-flag"></span>
          </div>
        </div>
        ${pts ? `<span class="bh-pts">+${pts}</span>` : '<span class="bh-pts bh-pts-empty"></span>'}
      </div>`;
    }

    html += `</div>`;
  }

  html += `<div class="bh-section-title" style="margin-top:20px">⚡ Mata-Mata</div>`;

  const koEntries = Object.entries(knockoutBets);
  if (koEntries.length === 0) {
    html += `<p class="bh-empty">Nenhum palpite de mata-mata registrado.</p>`;
  } else {
    const roundLabel = id =>
      id.startsWith('r32') ? 'Rodada de 32' :
      id.startsWith('r16') ? 'Oitavas' :
      id.startsWith('qf')  ? 'Quartas' :
      id.startsWith('sf')  ? 'Semifinal' : 'Final 🏆';

    let html_ko = `<div class="bh-ko-list">`;
    for (const [matchId, pickedId] of koEntries) {
      const real   = koResults[matchId];
      const picked = TEAMS[pickedId];
      let cls = 'bh-placed', icon = '📌', pts = 0;
      if (real) {
        if (pickedId === real) { cls = 'bh-exact'; icon = '✅'; pts = 2; koHits++; }
        else                   { cls = 'bh-wrong'; icon = '❌'; }
      }

      const realTeam = real ? TEAMS[real] : null;

      html_ko += `
      <div class="bh-ko-card ${cls}">
        <span class="bh-si">${icon}</span>
        <span class="bh-round-lbl">${roundLabel(matchId)}</span>
        <div class="bh-ko-pick">
          <span class="fi fi-${picked?.iso || 'un'} bh-flag"></span>
          <span class="bh-team-name">${picked?.name || pickedId}</span>
        </div>
        ${realTeam
          ? `<span class="bh-ko-real">Real: <span class="fi fi-${realTeam.iso} bh-flag"></span> ${realTeam.name}</span>`
          : `<span class="bh-waiting">⏳ Aguardando</span>`}
        ${pts ? `<span class="bh-pts">+${pts}</span>` : '<span class="bh-pts bh-pts-empty"></span>'}
      </div>`;
    }
    html_ko += `</div>`;
    html += html_ko;

    const fp = knockoutBets['final'], fr = koResults['final'];
    if (fp && fr && fp === fr) {
      html += `
      <div class="bh-ko-card bh-bonus">
        <span class="bh-si">🏆</span>
        <span style="color:var(--gold);font-weight:700;flex:1">Bônus Campeão!</span>
        <span class="bh-pts" style="color:var(--gold)">+5</span>
      </div>`;
    }
  }

  const bonusPts = (knockoutBets['final'] && koResults['final'] && knockoutBets['final'] === koResults['final']) ? 5 : 0;
  const total = exact * 3 + correct + koHits * 2 + bonusPts;
  html += `
  <div class="bh-summary">
    <div class="bh-summary-item"><span class="bh-sum-lbl">✅ Placares exatos</span><strong>${exact} <em>(+${exact * 3} pts)</em></strong></div>
    <div class="bh-summary-item"><span class="bh-sum-lbl">✓ Resultados certos</span><strong>${correct} <em>(+${correct} pts)</em></strong></div>
    <div class="bh-summary-item"><span class="bh-sum-lbl">⚡ Mata-mata</span><strong>${koHits} <em>(+${koHits * 2} pts)</em></strong></div>
    ${bonusPts ? `<div class="bh-summary-item"><span class="bh-sum-lbl">🏆 Bônus campeão</span><strong>+${bonusPts} pts</strong></div>` : ''}
    <div class="bh-summary-total">Total: <strong>${total} pts</strong></div>
  </div>`;

  return html;
}
