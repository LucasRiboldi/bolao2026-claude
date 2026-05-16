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

  initScoringConfig();

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

// ---- Configuração de pontuação (admin) ----------------------
async function initScoringConfig() {
  try {
    const config = await loadScoringConfig();
    if (config && Object.keys(config).length > 0) {
      Object.assign(SCORING, config);
    }
    _renderScoringInputs();
  } catch {}
}

function _renderScoringInputs() {
  const fields = [
    { key: 'exactScore',     label: '⚽ Placar exato (grupos)' },
    { key: 'correctResult',  label: '✓ Resultado certo (grupos)' },
    { key: 'r32Winner',      label: '⚡ Avança nos 32-avos' },
    { key: 'r16Winner',      label: '⚡ Avança nas oitavas' },
    { key: 'qfWinner',       label: '⚡ Avança nas quartas' },
    { key: 'sfWinner',       label: '⚡ Avança na semifinal (finalista)' },
    { key: 'championScore',  label: '🏆 Acertou o campeão' },
    { key: 'finalistBonus',  label: '🎯 Bônus pelas duas finalistas' },
  ];
  const container = document.getElementById('scoring-config-inputs');
  if (!container) return;
  container.innerHTML = fields.map(f => `
    <div class="scoring-field">
      <label class="scoring-field-lbl">${f.label}</label>
      <input class="scoring-field-inp" type="number" min="0" max="999"
             data-key="${f.key}" value="${SCORING[f.key] || 0}">
      <span class="scoring-field-unit">pts</span>
    </div>`).join('');
}

async function adminSaveScoring() {
  const inputs = document.querySelectorAll('#scoring-config-inputs .scoring-field-inp');
  const newConfig = {};
  inputs.forEach(inp => {
    const val = parseInt(inp.value, 10);
    if (!isNaN(val) && val >= 0) newConfig[inp.dataset.key] = val;
  });
  try {
    await saveScoringConfig(newConfig);
    Object.assign(SCORING, newConfig);
    showToast('Pontuação salva! ✅', 'success');
    // Recalcula ranking automaticamente com nova pontuação
    adminRecalcRanking({ silent: true });
  } catch (e) {
    showToast('Erro ao salvar: ' + e.message, 'error');
  }
}

async function adminResetScoring() {
  if (!confirm('Resetar para os valores padrão?')) return;
  const defaults = {
    exactScore: 17, correctResult: 8, r32Winner: 5, r16Winner: 11,
    qfWinner: 20, sfWinner: 40, championScore: 71, finalistBonus: 26,
  };
  try {
    await saveScoringConfig(defaults);
    Object.assign(SCORING, defaults);
    _renderScoringInputs();
    showToast('Pontuação resetada! ✅', 'success');
    adminRecalcRanking({ silent: true });
  } catch (e) {
    showToast('Erro: ' + e.message, 'error');
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
    await loadAndApplyScoring();
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
    const safeName  = escapeHtml(u.name  || 'Sem nome');
    const safeEmail = escapeHtml(u.email || u.uid);
    html += `
    <div class="admin-user-row" id="adm-row-${u.uid}">
      <div class="admin-user-info">
        <div class="admin-user-name">${safeName}</div>
        <div class="admin-user-email">${safeEmail}</div>
      </div>
      <div class="admin-user-actions">
        <button class="btn-icon" title="Ver apostas"
          onclick="openBetHistory('${u.uid}','${safeName.replace(/'/g,"&#39;")}')">📋</button>
        <button class="btn-icon" title="Editar apostas"
          onclick="adminEditBets('${u.uid}','${safeName.replace(/'/g,"&#39;")}')">✏️</button>
        <button class="btn-icon" title="Editar nome"
          onclick="adminEditName('${u.uid}','${safeName.replace(/'/g,"&#39;")}')">🔤</button>
        <button class="btn-icon btn-icon-danger" title="Excluir participante"
          onclick="adminDeleteUser('${u.uid}','${safeName.replace(/'/g,"&#39;")}')">🗑️</button>
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
let _ebTriggerEl  = null;

async function adminEditBets(uid, name) {
  _ebTriggerEl = document.activeElement;
  _editBetsUid = uid;
  const modal = document.getElementById('edit-bets-modal');
  document.getElementById('eb-title').textContent = `✏️ ${name}`;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Move focus to close button after modal is visible
  const closeBtn = modal.querySelector('.bh-close');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 50);

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
  if (_ebTriggerEl) {
    _ebTriggerEl.focus();
    _ebTriggerEl = null;
  }
}

function switchEditBetsTab(tab) {
  document.querySelectorAll('.eb-tab').forEach(t => {
    const isActive = t.dataset.tab === tab;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
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
    { label: '32avos de Final', matches: r32Matches, isR32: true },
    ...KNOCKOUT_ROUNDS.map(r => ({
      label:   ROUND_META[r.name] || r.name,
      matches: resolveKnockoutRound(r.matches, _editKoBets),
    })),
  ];

  let html = '<div class="eb-ko-scroll">';
  for (const round of allRounds) {
    html += `<div class="eb-ko-section">
      <div class="eb-ko-hdr">${round.label}</div>`;

    if (round.isR32) {
      html += `<div class="bh-r32-pairs" style="padding:8px;gap:8px">`;
      for (let i = 0; i < round.matches.length; i += 2) {
        const pair = round.matches.slice(i, i + 2);
        html += `<div class="bh-r32-pair">
          <div class="bh-r32-pair-lbl">Confronto ${i / 2 + 1}</div>`;
        for (const match of pair) {
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
      html += `</div></div>`;
      continue;
    }

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
let _bhTriggerEl = null;

async function openBetHistory(uid, name) {
  _bhTriggerEl = document.activeElement;
  const modal = document.getElementById('bet-history-modal');
  const title = document.getElementById('bh-title');
  const body  = document.getElementById('bh-body');

  title.textContent = `📋 ${name}`;
  body.innerHTML = `<div class="bh-loading"><div class="spinner"></div>Carregando…</div>`;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Move focus to close button after modal is visible
  const closeBtn = modal.querySelector('.bh-close');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 50);

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
  if (_bhTriggerEl) {
    _bhTriggerEl.focus();
    _bhTriggerEl = null;
  }
}

// ---- Renderização do histórico de apostas -------------------
function _renderBetHistory(groupBets, knockoutBets, results) {
  const gsResults = results.groupStage || {};
  const koResults = results.knockout   || {};
  let html = '';
  let exactCount = 0, correctCount = 0, koTotalPts = 0;

  // Sets de times que avançaram em cada fase
  const advKO = { r32: new Set(), r16: new Set(), qf: new Set(), sf: new Set() };
  for (const [mid, wid] of Object.entries(koResults)) {
    if      (mid.startsWith('r32_')) advKO.r32.add(wid);
    else if (mid.startsWith('r16_')) advKO.r16.add(wid);
    else if (mid.startsWith('qf_'))  advKO.qf.add(wid);
    else if (mid.startsWith('sf_'))  advKO.sf.add(wid);
  }

  function _koRoundHasResult(matchId) {
    if (matchId === 'final')        return 'final' in koResults;
    if (matchId === 'third')        return 'third' in koResults;
    if (matchId.startsWith('r32_')) return advKO.r32.size > 0;
    if (matchId.startsWith('r16_')) return advKO.r16.size > 0;
    if (matchId.startsWith('qf_'))  return advKO.qf.size  > 0;
    if (matchId.startsWith('sf_'))  return advKO.sf.size  > 0;
    return false;
  }
  function _koScored(matchId, pickedId) {
    if (matchId === 'final')        return koResults['final'] === pickedId;
    if (matchId === 'third')        return koResults['third'] === pickedId;
    if (matchId.startsWith('r32_')) return advKO.r32.has(pickedId);
    if (matchId.startsWith('r16_')) return advKO.r16.has(pickedId);
    if (matchId.startsWith('qf_'))  return advKO.qf.has(pickedId);
    if (matchId.startsWith('sf_'))  return advKO.sf.has(pickedId);
    return false;
  }
  function _koPoints(matchId) {
    if (matchId === 'final')        return SCORING.championScore;
    if (matchId === 'third')        return SCORING.r32Winner;
    if (matchId.startsWith('r32_')) return SCORING.r32Winner;
    if (matchId.startsWith('r16_')) return SCORING.r16Winner;
    if (matchId.startsWith('qf_'))  return SCORING.qfWinner;
    if (matchId.startsWith('sf_'))  return SCORING.sfWinner;
    return 0;
  }

  // ---- Fase de Grupos ----
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
          if (bH === rH && bA === rA) {
            cls = 'bh-exact';   icon = '✅'; pts = SCORING.exactScore;    exactCount++;
          } else if (Math.sign(bH - bA) === Math.sign(rH - rA)) {
            cls = 'bh-correct'; icon = '✓';  pts = SCORING.correctResult; correctCount++;
          } else {
            cls = 'bh-wrong'; icon = '❌';
          }
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

  // ---- Mata-Mata ----
  html += `<div class="bh-section-title" style="margin-top:20px">⚡ Mata-Mata</div>`;

  const KO_PHASES = [
    { prefix: 'r32',   label: '32-avos de Final',      color: '#58a6ff', isExact: false },
    { prefix: 'r16',   label: 'Oitavas de Final',       color: '#bc8cff', isExact: false },
    { prefix: 'qf',    label: 'Quartas de Final',       color: '#ffa657', isExact: false },
    { prefix: 'sf',    label: 'Semifinal',              color: '#ff7b72', isExact: false },
    { prefix: 'third', label: '🥉 Disputa de 3º Lugar', color: '#8b949e', isExact: true  },
    { prefix: 'final', label: '🏆 Final — Campeão',     color: '#f0c040', isExact: true  },
  ];

  const koEntries = Object.entries(knockoutBets);

  if (koEntries.length === 0) {
    html += `<p class="bh-empty">Nenhum palpite de mata-mata registrado.</p>`;
  } else {
    for (const phase of KO_PHASES) {
      let entries;
      if (phase.prefix === 'third') {
        entries = knockoutBets['third'] ? [['third', knockoutBets['third']]] : [];
      } else if (phase.prefix === 'final') {
        entries = knockoutBets['final'] ? [['final', knockoutBets['final']]] : [];
      } else {
        entries = koEntries.filter(([id]) => id.startsWith(phase.prefix + '_'));
      }
      if (entries.length === 0) continue;

      html += `<div class="bh-ko-phase">
        <div class="bh-ko-phase-hdr" style="border-left-color:${phase.color};color:${phase.color}">${phase.label}</div>`;

      // R32: agrupa em pares de 2
      if (phase.prefix === 'r32') {
        html += `<div class="bh-r32-pairs">`;
        for (let i = 0; i < entries.length; i += 2) {
          const pair = entries.slice(i, i + 2);
          html += `<div class="bh-r32-pair">
            <div class="bh-r32-pair-lbl" style="border-color:${phase.color}">Confronto ${i / 2 + 1}</div>
            <div class="bh-ko-phase-list">`;
          for (const [matchId, pickedId] of pair) {
            html += _bhKoCard(matchId, pickedId, koResults, _koRoundHasResult, _koScored, _koPoints, koTotalPts);
            if (_koRoundHasResult(matchId) && _koScored(matchId, pickedId)) koTotalPts += _koPoints(matchId);
          }
          html += `</div></div>`;
        }
        html += `</div>`;
      } else if (phase.prefix === 'final') {
        // Final: mostra campeão apostado + 2º colocado inferido dos SF bets
        const [, pickedChamp] = entries[0];
        const champT  = TEAMS[pickedChamp];

        // Inferir 2º colocado: é o sf bet que NÃO é o campeão apostado
        const betSf01 = knockoutBets['sf_01'];
        const betSf02 = knockoutBets['sf_02'];
        const predictedRunner =
          betSf01 === pickedChamp ? betSf02 :
          betSf02 === pickedChamp ? betSf01 : null;
        const runnerT = predictedRunner ? TEAMS[predictedRunner] : null;

        const finalDone = 'final' in koResults;
        const realChamp = koResults['final'];
        const realChampT = realChamp ? TEAMS[realChamp] : null;

        // Calcular runner-up real (o finalista que perdeu)
        const realRunner = finalDone && advKO.sf.size === 2
          ? [...advKO.sf].find(t => t !== realChamp)
          : null;
        const realRunnerT = realRunner ? TEAMS[realRunner] : null;

        let champCls = 'bh-placed', champIcon = '📌', champPts = 0;
        if (finalDone) {
          if (pickedChamp === realChamp) { champCls = 'bh-exact'; champIcon = '✅'; champPts = SCORING.championScore; koTotalPts += champPts; }
          else                           { champCls = 'bh-wrong'; champIcon = '❌'; }
        }

        html += `<div class="bh-final-block">
          <div class="bh-final-row">
            <div class="bh-final-label">🥇 Campeão apostado</div>
            <div class="bh-ko-card ${champCls}" style="flex:1">
              <span class="bh-si">${champIcon}</span>
              <div class="bh-ko-pick">
                ${champT ? `<span class="fi fi-${champT.iso} bh-flag"></span><span class="bh-team-name">${escapeHtml(champT.name)}</span>` : pickedChamp}
              </div>
              ${finalDone
                ? (realChampT ? `<span class="bh-ko-real"><span class="fi fi-${realChampT.iso} bh-flag"></span> ${escapeHtml(realChampT.name)}</span>` : '')
                : `<span class="bh-waiting">⏳ Aguardando</span>`}
              ${champPts ? `<span class="bh-pts">+${champPts}</span>` : '<span class="bh-pts bh-pts-empty"></span>'}
            </div>
          </div>
          ${runnerT ? `<div class="bh-final-row">
            <div class="bh-final-label">🥈 2º colocado apostado</div>
            <div class="bh-ko-card ${finalDone ? (predictedRunner === realRunner ? 'bh-correct' : 'bh-wrong') : 'bh-placed'}" style="flex:1">
              <span class="bh-si">${!finalDone ? '📌' : predictedRunner === realRunner ? '✓' : '❌'}</span>
              <div class="bh-ko-pick">
                <span class="fi fi-${runnerT.iso} bh-flag"></span>
                <span class="bh-team-name">${escapeHtml(runnerT.name)}</span>
              </div>
              ${finalDone
                ? (realRunnerT ? `<span class="bh-ko-real"><span class="fi fi-${realRunnerT.iso} bh-flag"></span> ${escapeHtml(realRunnerT.name)}</span>` : '')
                : `<span class="bh-waiting">⏳ Aguardando</span>`}
              <span class="bh-pts bh-pts-empty"></span>
            </div>
          </div>` : ''}
        </div>`;
      } else {
        html += `<div class="bh-ko-phase-list">`;
        for (const [matchId, pickedId] of entries) {
          const scored = _koRoundHasResult(matchId) && _koScored(matchId, pickedId);
          if (scored) koTotalPts += _koPoints(matchId);
          html += _bhKoCard(matchId, pickedId, koResults, _koRoundHasResult, _koScored, _koPoints, 0);
        }
        html += `</div>`;
      }
      html += `</div>`;
    }

    // Bônus finalistas
    const betSf01 = knockoutBets['sf_01'], betSf02 = knockoutBets['sf_02'];
    const bothFinalists = betSf01 && betSf02 && advKO.sf.has(betSf01) && advKO.sf.has(betSf02);
    if (bothFinalists) {
      koTotalPts += SCORING.finalistBonus;
      html += `<div class="bh-ko-card bh-bonus" style="margin-top:8px">
        <span class="bh-si">🎯</span>
        <span style="color:var(--gold);font-weight:700;flex:1">Bônus: acertou as duas finalistas!</span>
        <span class="bh-pts" style="color:var(--gold)">+${SCORING.finalistBonus}</span>
      </div>`;
    }
  }

  const groupTotalPts = exactCount * SCORING.exactScore + correctCount * SCORING.correctResult;
  const totalPts = groupTotalPts + koTotalPts;
  html += `
  <div class="bh-summary">
    <div class="bh-summary-item"><span class="bh-sum-lbl">✅ Placares exatos</span><strong>${exactCount} <em>(+${exactCount * SCORING.exactScore} pts)</em></strong></div>
    <div class="bh-summary-item"><span class="bh-sum-lbl">✓ Resultados certos</span><strong>${correctCount} <em>(+${correctCount * SCORING.correctResult} pts)</em></strong></div>
    <div class="bh-summary-item"><span class="bh-sum-lbl">⚡ Mata-mata</span><strong>+${koTotalPts} pts</strong></div>
    <div class="bh-summary-total">Total: <strong>${totalPts} pts</strong></div>
  </div>`;

  return html;
}

function _bhKoCard(matchId, pickedId, koResults, _koRoundHasResult, _koScored, _koPoints, _ignored) {
  const picked    = TEAMS[pickedId];
  const roundDone = _koRoundHasResult(matchId);
  let cls = 'bh-placed', icon = '📌', pts = 0;
  if (roundDone) {
    if (_koScored(matchId, pickedId)) { cls = 'bh-exact'; icon = '✅'; pts = _koPoints(matchId); }
    else                              { cls = 'bh-wrong'; icon = '❌'; }
  }
  const slotWinner = koResults[matchId];
  const slotTeam   = slotWinner ? TEAMS[slotWinner] : null;
  return `<div class="bh-ko-card ${cls}">
    <span class="bh-si">${icon}</span>
    <div class="bh-ko-pick">
      <span class="fi fi-${picked?.iso || 'un'} bh-flag"></span>
      <span class="bh-team-name">${escapeHtml(picked?.name || pickedId)}</span>
    </div>
    ${roundDone
      ? (slotTeam
          ? `<span class="bh-ko-real"><span class="fi fi-${slotTeam.iso} bh-flag"></span> ${escapeHtml(slotTeam.name)}</span>`
          : `<span class="bh-ko-real">–</span>`)
      : `<span class="bh-waiting">⏳ Aguardando</span>`}
    ${pts ? `<span class="bh-pts">+${pts}</span>` : '<span class="bh-pts bh-pts-empty"></span>'}
  </div>`;
}
