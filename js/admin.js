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
  initRegistrationStatus();

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
    if (typeof setGroupStageLocked === 'function') setGroupStageLocked(lock);
    showToast(lock ? '🔒 Apostas bloqueadas para todos!' : '🔓 Apostas liberadas para todos!', 'success');
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
  } finally {
    if (btnLock)   btnLock.disabled   = false;
    if (btnUnlock) btnUnlock.disabled = false;
  }
}

// ---- Controle de cadastro -----------------------------------
async function initRegistrationStatus() {
  try {
    const config = await loadAdminConfig();
    _updateRegistrationBadge(config.registrationOpen !== false);
  } catch {}
}

function _updateRegistrationBadge(open) {
  const badge    = document.getElementById('registration-badge');
  const btnClose = document.getElementById('btn-close-reg');
  const btnOpen  = document.getElementById('btn-open-reg');
  if (badge) {
    badge.textContent = open ? '🔓 Aberto' : '🔐 Fechado';
    badge.className   = 'global-lock-badge ' + (open ? 'open' : 'locked');
  }
  if (btnClose) btnClose.classList.toggle('hidden', !open);
  if (btnOpen)  btnOpen.classList.toggle('hidden', open);
}

async function adminToggleRegistration(open) {
  const btnClose = document.getElementById('btn-close-reg');
  const btnOpen  = document.getElementById('btn-open-reg');
  if (btnClose) btnClose.disabled = true;
  if (btnOpen)  btnOpen.disabled  = true;
  try {
    await setRegistrationOpen(open);
    _updateRegistrationBadge(open);
    showToast(open ? '🔓 Cadastro aberto!' : '🔐 Cadastro fechado!', 'success');
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
  } finally {
    if (btnClose) btnClose.disabled = false;
    if (btnOpen)  btnOpen.disabled  = false;
  }
}

// ---- Recalcular ranking com resultados atuais ---------------
async function adminRecalcRanking(opts = {}) {
  const { silent = false, btn = null } = opts;
  const btnEl = btn || document.getElementById('btn-recalc-ranking');
  if (btnEl) btnEl.disabled = true;
  if (!silent) showLoading();
  try {
    invalidateResultsCache();
    const entries = await _computeRankingClient();
    await updateRankingDoc(entries);
    if (!silent) showToast(`Ranking atualizado! ${entries.length} participante(s) recalculado(s). ✅`, 'success');
    return entries;
  } catch (e) {
    if (!silent) showToast('Erro ao recalcular: ' + e.message, 'error');
    throw e;
  } finally {
    if (btnEl) btnEl.disabled = false;
    if (!silent) hideLoading();
  }
}

// ---- Lista de participantes ---------------------------------
function _renderAdminUsers(users, container) {
  if (users.length === 0) {
    container.innerHTML = '<p class="muted" style="padding:20px">Nenhum usuário cadastrado.</p>';
    return;
  }
  let html = `<div class="admin-table">`;
  users.forEach(u => {
    const safeName  = (u.name  || 'Sem nome').replace(/'/g, "\\'");
    const safeEmail = (u.email || u.uid).replace(/'/g, "\\'");
    html += `
    <div class="admin-user-row" id="adm-row-${u.uid}">
      <div class="admin-user-info">
        <div class="admin-user-name">${u.name || 'Sem nome'}</div>
        <div class="admin-user-email">${u.email || u.uid}</div>
      </div>
      <div class="admin-user-actions">
        <button class="btn-icon" title="Ver apostas"
          onclick="openBetHistory('${u.uid}','${safeName}')">📋</button>
        <button class="btn-icon" title="Editar apostas"
          onclick="adminEditBets('${u.uid}','${safeName}')">✏️</button>
        <button class="btn-icon" title="Editar nome"
          onclick="adminEditName('${u.uid}','${safeName}')">🔤</button>
        <button class="btn-icon btn-icon-danger" title="Excluir participante"
          onclick="adminDeleteUser('${u.uid}','${safeName}')">🗑️</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ---- Editar nome do participante ----------------------------
async function adminEditName(uid, currentName) {
  const newName = prompt(`Novo nome para "${currentName}":`, currentName);
  if (!newName || newName.trim() === currentName) return;
  try {
    await updateUserName(uid, newName.trim());
    showToast('Nome atualizado! ✅', 'success');
    const row = document.getElementById(`adm-row-${uid}`);
    if (row) row.querySelector('.admin-user-name').textContent = newName.trim();
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
  }
}

// ---- Excluir participante -----------------------------------
async function adminDeleteUser(uid, name) {
  if (!confirm(`Excluir TODOS os dados de "${name}"?\n\nEsta ação não pode ser desfeita.`)) return;
  showLoading();
  try {
    await deleteUserData(uid);
    showToast(`"${name}" excluído. ✅`, 'success');
    const row = document.getElementById(`adm-row-${uid}`);
    if (row) row.remove();
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
}

// ---- Editar apostas do participante -------------------------
let _editBetsUid = null;
let _editGroupBets = {};
let _editKoBets   = {};

async function adminEditBets(uid, name) {
  _editBetsUid = uid;
  const modal = document.getElementById('edit-bets-modal');
  document.getElementById('eb-title').textContent = `✏️ ${name}`;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  document.getElementById('eb-groups-panel').innerHTML =
    '<div style="padding:32px;text-align:center"><div class="spinner"></div></div>';
  document.getElementById('eb-ko-panel').innerHTML = '';

  try {
    const { groupBets, knockoutBets } = await loadUserBetsForHistory(uid);
    _editGroupBets = { ...groupBets };
    _editKoBets   = { ...knockoutBets };
    _renderEditGroupsPanel();
    _renderEditKoPanel();
  } catch (e) {
    document.getElementById('eb-groups-panel').innerHTML =
      `<p class="muted" style="padding:20px">Erro: ${e.message}</p>`;
  }
}

function closeEditBets() {
  const modal = document.getElementById('edit-bets-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  _editBetsUid = null;
}

function switchEditBetsTab(tab) {
  document.querySelectorAll('.eb-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('eb-groups-panel').classList.toggle('hidden', tab !== 'groups');
  document.getElementById('eb-ko-panel').classList.toggle('hidden', tab !== 'knockout');
}

function _renderEditGroupsPanel() {
  const panel = document.getElementById('eb-groups-panel');
  let html = '<div class="eb-groups-scroll">';
  for (const gId of Object.keys(GROUPS)) {
    const color = (typeof GROUP_COLORS !== 'undefined' && GROUP_COLORS[gId]) || '#888';
    html += `<div class="eb-group-block" style="border-left:3px solid ${color}">
      <div class="eb-group-hdr" style="color:${color}">Grupo ${gId}</div>`;
    for (const game of generateGroupGames(gId)) {
      const home = TEAMS[game.home];
      const away = TEAMS[game.away];
      const bet  = _editGroupBets[game.id] || {};
      html += `<div class="eb-game-row">
        <span class="fi fi-${home.iso} eb-flag"></span>
        <span class="eb-name">${home.short}</span>
        <input class="eb-inp" type="number" min="0" max="99"
               value="${bet.homeGoals ?? ''}" placeholder="–"
               data-game="${game.id}" data-side="home">
        <span class="eb-vs">×</span>
        <input class="eb-inp" type="number" min="0" max="99"
               value="${bet.awayGoals ?? ''}" placeholder="–"
               data-game="${game.id}" data-side="away">
        <span class="eb-name">${away.short}</span>
        <span class="fi fi-${away.iso} eb-flag"></span>
      </div>`;
    }
    html += `</div>`;
  }
  html += '</div>';
  panel.innerHTML = html;
}

function _renderEditKoPanel() {
  const panel = document.getElementById('eb-ko-panel');

  const standings  = calcGroupStandings(_editGroupBets);
  const qualified  = getQualified(standings);
  const r32Matches = buildR32(qualified);

  const ROUND_META = {
    'Oitavas':    'Oitavas de Final',
    'Quartas':    'Quartas de Final',
    'Semifinais': 'Semifinal',
    'Final':      '🏆 Final',
  };

  const allRounds = [
    { label: '32avos de Final', matches: r32Matches },
    ...KNOCKOUT_ROUNDS.map(r => ({
      label:   ROUND_META[r.name] || r.name,
      matches: resolveKnockoutRound(r.matches, _editKoBets),
    })),
  ];

  let html = '<div class="eb-ko-scroll">';
  for (const round of allRounds) {
    html += `<div class="eb-ko-section">
      <div class="eb-ko-hdr">${round.label}</div>`;
    for (const match of round.matches) {
      const pickedId = _editKoBets[match.id];
      const homeT = match.home ? TEAMS[match.home] : null;
      const awayT = match.away ? TEAMS[match.away] : null;
      html += `<div class="eb-ko-row">
        <div class="eb-ko-teams">
          ${homeT ? `<span class="fi fi-${homeT.iso} eb-flag"></span> <span>${homeT.short}</span>` : '<span class="eb-tbd">❓</span>'}
          <span class="eb-ko-vs">vs</span>
          ${awayT ? `<span>${awayT.short}</span> <span class="fi fi-${awayT.iso} eb-flag"></span>` : '<span class="eb-tbd">❓</span>'}
        </div>
        <select class="eb-ko-sel" data-match="${match.id}">
          <option value="">– vencedor –</option>
          ${homeT ? `<option value="${match.home}" ${pickedId === match.home ? 'selected' : ''}>${homeT.short}</option>` : ''}
          ${awayT ? `<option value="${match.away}" ${pickedId === match.away ? 'selected' : ''}>${awayT.short}</option>` : ''}
        </select>
      </div>`;
    }
    html += `</div>`;
  }
  html += '</div>';
  panel.innerHTML = html;
}

async function adminSaveEditedBets() {
  if (!_editBetsUid) return;

  const groupBets = {};
  document.querySelectorAll('#eb-groups-panel .eb-inp').forEach(inp => {
    const gameId = inp.dataset.game;
    const side   = inp.dataset.side;
    if (!groupBets[gameId]) groupBets[gameId] = {};
    groupBets[gameId][side === 'home' ? 'homeGoals' : 'awayGoals'] = inp.value;
  });

  const koBets = {};
  document.querySelectorAll('#eb-ko-panel .eb-ko-sel').forEach(sel => {
    if (sel.value) koBets[sel.dataset.match] = sel.value;
  });

  showLoading();
  try {
    await saveGroupBets(_editBetsUid, groupBets);
    await saveKnockoutBets(_editBetsUid, koBets);
    showToast('Apostas salvas! ✅', 'success');
    closeEditBets();
  } catch (e) {
    showToast('Erro ao salvar: ' + e.message, 'error');
  } finally {
    hideLoading();
  }
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
          if (bH === rH && bA === rA)                          { cls = 'bh-exact';   icon = '✅'; pts = 3; exact++;   }
          else if (Math.sign(bH - bA) === Math.sign(rH - rA)) { cls = 'bh-correct'; icon = '✓';  pts = 1; correct++; }
          else                                                 { cls = 'bh-wrong';   icon = '❌'; }
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

  // ---- Mata-Mata agrupado por fase -------------------------
  html += `<div class="bh-section-title" style="margin-top:20px">⚡ Mata-Mata</div>`;

  const PHASES = [
    { prefix: 'r32',   label: '32avos de Final',  exact: false },
    { prefix: 'r16',   label: 'Oitavas de Final',  exact: false },
    { prefix: 'qf',    label: 'Quartas de Final',  exact: false },
    { prefix: 'sf',    label: 'Semifinal',         exact: false },
    { prefix: 'final', label: '🏆 Final',          exact: true  },
  ];

  const koEntries = Object.entries(knockoutBets);

  if (koEntries.length === 0) {
    html += `<p class="bh-empty">Nenhum palpite de mata-mata registrado.</p>`;
  } else {
    for (const phase of PHASES) {
      const entries = phase.exact
        ? (knockoutBets['final'] ? [['final', knockoutBets['final']]] : [])
        : koEntries.filter(([id]) => id.startsWith(phase.prefix));
      if (entries.length === 0) continue;

      html += `<div class="bh-ko-phase">
        <div class="bh-ko-phase-hdr">${phase.label}</div>
        <div class="bh-ko-phase-list">`;

      for (const [matchId, pickedId] of entries) {
        const real   = koResults[matchId];
        const picked = TEAMS[pickedId];
        let cls = 'bh-placed', icon = '📌', pts = 0;
        if (real) {
          if (pickedId === real) { cls = 'bh-exact'; icon = '✅'; pts = 2; koHits++; }
          else                   { cls = 'bh-wrong'; icon = '❌'; }
        }
        const realTeam = real ? TEAMS[real] : null;

        html += `<div class="bh-ko-card ${cls}">
          <span class="bh-si">${icon}</span>
          <div class="bh-ko-pick">
            <span class="fi fi-${picked?.iso || 'un'} bh-flag"></span>
            <span class="bh-team-name">${picked?.name || pickedId}</span>
          </div>
          ${realTeam
            ? `<span class="bh-ko-real"><span class="fi fi-${realTeam.iso} bh-flag"></span> ${realTeam.name}</span>`
            : `<span class="bh-waiting">⏳ Aguardando</span>`}
          ${pts ? `<span class="bh-pts">+${pts}</span>` : '<span class="bh-pts bh-pts-empty"></span>'}
        </div>`;
      }

      html += `</div></div>`;
    }

    const fp = knockoutBets['final'], fr = koResults['final'];
    if (fp && fr && fp === fr) {
      html += `<div class="bh-ko-card bh-bonus" style="margin-top:8px">
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
