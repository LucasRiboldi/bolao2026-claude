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

  // Carregar WhatsApp atual
  try {
    const config = await loadAdminConfig();
    const inp = document.getElementById('inp-whatsapp');
    if (inp && config.whatsapp) inp.value = config.whatsapp;
  } catch {}

  // Carregar select de desbloqueio rápido
  adminLoadUnlockSelect();

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
    // Atualiza o botão no header
    const btn = document.getElementById('btn-whatsapp');
    if (btn) {
      btn.href = `https://wa.me/${number}`;
      btn.classList.remove('hidden');
    }
  } catch (e) {
    showToast('Erro ao salvar: ' + e.message, 'error');
  }
}

function _renderAdminUsers(users, container) {
  if (users.length === 0) {
    container.innerHTML = '<p class="muted" style="padding:20px">Nenhum usuário cadastrado.</p>';
    return;
  }
  let html = `<div class="admin-table">`;
  users.forEach(u => {
    const locked    = u.betsLocked === true;
    const statusCls = locked ? 'status-locked' : 'status-open';
    const statusTxt = locked ? '🔒 Bloqueado' : '🔓 Aberto';
    const safeName  = (u.name || 'Sem nome').replace(/'/g, "\\'");
    html += `
    <div class="admin-user-row" id="adm-row-${u.uid}">
      <div class="admin-user-info">
        <div class="admin-user-name">${u.name || 'Sem nome'}</div>
        <div class="admin-user-email">${u.email || u.uid}</div>
      </div>
      <span class="admin-user-status ${statusCls}">${statusTxt}</span>
      <div class="admin-user-actions">
        <button class="btn-icon" title="Ver apostas"
          onclick="openBetHistory('${u.uid}','${safeName}')">📋</button>
        ${locked
          ? `<button class="btn-adm btn-adm-unlock" onclick="adminToggleLock('${u.uid}',false,this)">🔓 Liberar</button>`
          : `<button class="btn-adm btn-adm-lock"   onclick="adminToggleLock('${u.uid}',true,this)">🔒 Bloquear</button>`
        }
      </div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

async function adminToggleLock(uid, lock, btn) {
  btn.disabled = true;
  btn.textContent = '⏳';
  try {
    if (lock) await lockBets(uid);
    else      await unlockUserBets(uid);

    const row    = document.getElementById(`adm-row-${uid}`);
    const status = row.querySelector('.admin-user-status');
    if (lock) {
      status.className = 'admin-user-status status-locked';
      status.textContent = '🔒 Bloqueado';
      btn.className = 'btn-adm btn-adm-unlock';
      btn.textContent = '🔓 Liberar';
      btn.onclick = () => adminToggleLock(uid, false, btn);
    } else {
      status.className = 'admin-user-status status-open';
      status.textContent = '🔓 Aberto';
      btn.className = 'btn-adm btn-adm-lock';
      btn.textContent = '🔒 Bloquear';
      btn.onclick = () => adminToggleLock(uid, true, btn);
    }
    btn.disabled = false;
    showToast(lock ? 'Apostas bloqueadas.' : 'Apostas liberadas! ✅', 'success');
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = lock ? '🔒 Bloquear' : '🔓 Liberar';
  }
}

// ---- Histórico de apostas (modal) ---------------------------
async function openBetHistory(uid, name) {
  const modal = document.getElementById('bet-history-modal');
  const title = document.getElementById('bh-title');
  const body  = document.getElementById('bh-body');

  title.textContent = `📋 Apostas — ${name}`;
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

function _renderBetHistory(groupBets, knockoutBets, results) {
  const gsResults = results.groupStage || {};
  const koResults = results.knockout   || {};
  let html = '';
  let exact = 0, correct = 0, koHits = 0;

  html += `<div class="bh-section-title">⚽ Fase de Grupos</div>`;
  for (const gId of Object.keys(GROUPS)) {
    html += `<div class="bh-group-hdr">Grupo ${gId}</div>`;
    for (const game of generateGroupGames(gId)) {
      const bet  = groupBets[game.id];
      const res  = gsResults[game.id];
      const home = TEAMS[game.home];
      const away = TEAMS[game.away];
      let cls = 'bh-pending', icon = '⏳', pts = 0;
      if (bet && res) {
        const bH = parseInt(bet.homeGoals,10), bA = parseInt(bet.awayGoals,10);
        const rH = parseInt(res.homeGoals,10),  rA = parseInt(res.awayGoals,10);
        if (!isNaN(bH)&&!isNaN(bA)&&!isNaN(rH)&&!isNaN(rA)) {
          if (bH===rH && bA===rA)                         { cls='bh-exact';   icon='✅'; pts=3; exact++;   }
          else if (Math.sign(bH-bA)===Math.sign(rH-rA))  { cls='bh-correct'; icon='✓';  pts=1; correct++; }
          else                                            { cls='bh-wrong';   icon='❌'; }
        }
      } else if (bet) {
        cls='bh-placed'; icon='📌';
      }
      const betStr  = bet ? `${bet.homeGoals??'–'} × ${bet.awayGoals??'–'}` : '– × –';
      const realStr = res ? `${res.homeGoals}–${res.awayGoals}` : '?';
      html += `
      <div class="bh-game-row ${cls}">
        <span class="bh-si">${icon}</span>
        <span class="fi fi-${home.iso} bh-flag"></span>
        <span class="bh-tn">${home.short}</span>
        <span class="bh-bet">${betStr}</span>
        <span class="bh-div">·</span>
        <span class="bh-real">${res ? `Real: ${realStr}` : 'Aguardando'}</span>
        <span class="bh-div">·</span>
        <span class="bh-tn">${away.short}</span>
        <span class="fi fi-${away.iso} bh-flag"></span>
        ${pts ? `<span class="bh-pts">+${pts}</span>` : '<span class="bh-pts"></span>'}
      </div>`;
    }
  }

  html += `<div class="bh-section-title" style="margin-top:16px">⚡ Mata-Mata</div>`;
  const koEntries = Object.entries(knockoutBets);
  if (koEntries.length === 0) {
    html += `<p class="bh-empty">Nenhum palpite de mata-mata registrado.</p>`;
  } else {
    const roundLabel = id =>
      id.startsWith('r32') ? 'R32' : id.startsWith('r16') ? 'Oitavas' :
      id.startsWith('qf')  ? 'Quartas' : id.startsWith('sf') ? 'Semifinal' : 'Final';

    for (const [matchId, pickedId] of koEntries) {
      const real   = koResults[matchId];
      const picked = TEAMS[pickedId];
      let cls = 'bh-placed', icon = '📌', pts = 0;
      if (real) {
        if (pickedId === real) { cls='bh-exact'; icon='✅'; pts=2; koHits++; }
        else                  { cls='bh-wrong'; icon='❌'; }
      }
      html += `
      <div class="bh-game-row ${cls}">
        <span class="bh-si">${icon}</span>
        <span class="bh-round-lbl">${roundLabel(matchId)}</span>
        <span class="fi fi-${picked?.iso||'un'} bh-flag"></span>
        <span class="bh-tn">${picked?.name||pickedId}</span>
        <span class="bh-div">·</span>
        <span class="bh-real">${real ? `Real: ${TEAMS[real]?.short||real}` : 'Aguardando'}</span>
        ${pts ? `<span class="bh-pts">+${pts}</span>` : '<span class="bh-pts"></span>'}
      </div>`;
    }
    const fp = knockoutBets['final'], fr = koResults['final'];
    if (fp && fr && fp === fr) {
      html += `
      <div class="bh-game-row bh-bonus">
        <span class="bh-si">🏆</span>
        <span style="color:var(--gold);font-weight:700;flex:1">Bônus Campeão!</span>
        <span class="bh-pts" style="color:var(--gold)">+5</span>
      </div>`;
    }
  }

  const bonusPts = (knockoutBets['final'] && koResults['final'] && knockoutBets['final']===koResults['final']) ? 5 : 0;
  const total = exact*3 + correct + koHits*2 + bonusPts;
  html += `
  <div class="bh-summary">
    <span>✅ Exatos: <strong>${exact}</strong> (+${exact*3} pts)</span>
    <span>✓ Resultados: <strong>${correct}</strong> (+${correct} pts)</span>
    <span>⚡ Mata-Mata: <strong>${koHits}</strong> (+${koHits*2} pts)</span>
    ${bonusPts ? `<span>🏆 Campeão: <strong>+${bonusPts} pts</strong></span>` : ''}
    <span class="bh-total-pts">Total: <strong>${total} pts</strong></span>
  </div>`;

  return html;
}

// ---- Toggle rápido de desbloqueio por e-mail ----------------
async function adminLoadUnlockSelect() {
  const sel    = document.getElementById('sel-unlock-user');
  const status = document.getElementById('unlock-status');
  if (!sel) return;
  sel.innerHTML = '<option value="">Carregando…</option>';
  try {
    const users = await loadAdminUserList();
    sel.innerHTML = '<option value="">— Selecione o participante —</option>';
    users.forEach(u => {
      const label  = `${u.name || 'Sem nome'} (${u.email || u.uid})`;
      const locked = u.betsLocked === true;
      const opt    = document.createElement('option');
      opt.value       = u.uid;
      opt.textContent = `${locked ? '🔒' : '🔓'} ${label}`;
      opt.dataset.locked = locked ? '1' : '0';
      sel.appendChild(opt);
    });
    if (status) status.textContent = `${users.length} participante(s) carregado(s).`;
  } catch (e) {
    sel.innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

async function adminQuickToggle() {
  const sel    = document.getElementById('sel-unlock-user');
  const btn    = document.getElementById('btn-quick-toggle');
  const status = document.getElementById('unlock-status');
  if (!sel || !sel.value) {
    showToast('Selecione um participante.', 'error');
    return;
  }
  const uid    = sel.value;
  const opt    = sel.options[sel.selectedIndex];
  const locked = opt.dataset.locked === '1';
  btn.disabled = true;
  btn.textContent = '⏳';
  try {
    if (locked) {
      await unlockUserBets(uid);
      opt.dataset.locked  = '0';
      opt.textContent     = opt.textContent.replace('🔒', '🔓');
      if (status) status.textContent = `✅ Apostas liberadas para edição!`;
      showToast('Apostas liberadas! ✅', 'success');
      btn.textContent = '🔓 Liberar';
    } else {
      await lockBets(uid);
      opt.dataset.locked  = '1';
      opt.textContent     = opt.textContent.replace('🔓', '🔒');
      if (status) status.textContent = `🔒 Apostas bloqueadas.`;
      showToast('Apostas bloqueadas.', 'success');
      btn.textContent = '🔒 Bloquear';
    }
    _updateQuickToggleBtn(opt.dataset.locked === '1');
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
    btn.textContent = locked ? '🔓 Liberar' : '🔒 Bloquear';
  } finally {
    btn.disabled = false;
  }
}

function _updateQuickToggleBtn(isCurrentlyLocked) {
  const btn = document.getElementById('btn-quick-toggle');
  if (!btn) return;
  if (isCurrentlyLocked) {
    btn.textContent  = '🔓 Liberar para Edição';
    btn.className    = 'btn btn-adm-unlock';
  } else {
    btn.textContent  = '🔒 Bloquear Apostas';
    btn.className    = 'btn btn-adm-lock';
  }
}

function onUnlockSelectChange() {
  const sel = document.getElementById('sel-unlock-user');
  const opt = sel?.options[sel.selectedIndex];
  if (opt?.value) {
    _updateQuickToggleBtn(opt.dataset.locked === '1');
    document.getElementById('btn-quick-toggle').disabled = false;
  } else {
    const btn = document.getElementById('btn-quick-toggle');
    if (btn) { btn.disabled = true; btn.textContent = '🔓 Liberar / 🔒 Bloquear'; btn.className = 'btn btn-secondary'; }
  }
}
