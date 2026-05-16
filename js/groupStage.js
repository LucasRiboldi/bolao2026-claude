// ---- Group Stage module — lista compacta + steppers horizontais ----

let _groupBets      = {};
let _gsLocked       = false;
let _officialResults = {};
let _touchedGames   = new Set(); // jogos explicitamente preenchidos/carregados

// Paleta de cores por grupo (A-L) — border-left da seção
const GROUP_COLORS = {
  A: '#e74c3c', B: '#e67e22', C: '#f39c12', D: '#2ecc71',
  E: '#1abc9c', F: '#3498db', G: '#9b59b6', H: '#e91e63',
  I: '#00bcd4', J: '#8bc34a', K: '#ff5722', L: '#607d8b',
};

function initGroupStage() {
  _renderAllGroups();
  document.getElementById('btn-save-groups').addEventListener('click', _saveAll);
  document.getElementById('btn-export-bets').addEventListener('click', _exportBets);
  _updateProgress();
}

// ---- Renderiza TODOS os grupos como lista contínua ----------------
function _renderAllGroups() {
  const panel = document.getElementById('group-panel');
  let html = '';

  for (const gId of Object.keys(GROUPS)) {
    const teams = GROUPS[gId];
    const games = generateGroupGames(gId);
    const color = GROUP_COLORS[gId] || '#888';

    // Agrupa jogos por rodada
    const byRound = { 1: [], 2: [], 3: [] };
    for (const g of games) byRound[g.round].push(g);

    html += `<div class="group-section" id="gs-${gId}" data-group="${gId}" style="border-left:3px solid ${color}">
      <div class="group-section-header" style="border-left:none">
        <span class="group-label" style="color:${color}">Grupo ${gId}</span>
        <div class="group-teams-row">
          ${teams.map(t => `<span class="team-badge"><span class="fi fi-${TEAMS[t].iso}"></span>
            <span class="team-badge-full">${TEAMS[t].name}</span>
            <span class="team-badge-short">${TEAMS[t].short}</span>
          </span>`).join('')}
        </div>
      </div>`;

    for (let round = 1; round <= 3; round++) {
      const roundGames = byRound[round];
      const dateStr = ROUND_DATES[round] || '';
      html += `<div class="round-divider">
        <span class="round-label">Rodada ${round}</span>
        <span class="round-date">${dateStr}</span>
      </div>`;

      for (const g of roundGames) {
        const bet = _groupBets[g.id] || {};
        const hv  = (bet.homeGoals !== undefined && bet.homeGoals !== '') ? parseInt(bet.homeGoals, 10) : null;
        const av  = (bet.awayGoals !== undefined && bet.awayGoals !== '') ? parseInt(bet.awayGoals, 10) : null;

        // Resultado oficial centralizado sob o ×
        const res     = _officialResults[g.id];
        const resLine = res
          ? `<span class="official-result-badge" title="Resultado oficial">${res.homeGoals}–${res.awayGoals}</span>`
          : '';

        html += `<div class="game-row" data-game="${g.id}">
          <div class="team-cell">
            <span class="team-name team-name-full">${TEAMS[g.home].name}</span>
            <span class="team-name team-name-short">${TEAMS[g.home].short}</span>
            <span class="fi fi-${TEAMS[g.home].iso} team-flag-icon"></span>
          </div>
          ${_stepperHtml(g.id, 'home', hv)}
          <div class="score-center">
            <span class="score-sep">×</span>
            ${resLine}
          </div>
          ${_stepperHtml(g.id, 'away', av)}
          <div class="team-cell away">
            <span class="fi fi-${TEAMS[g.away].iso} team-flag-icon"></span>
            <span class="team-name team-name-full">${TEAMS[g.away].name}</span>
            <span class="team-name team-name-short">${TEAMS[g.away].short}</span>
          </div>
        </div>`;
      }
    }

    if (!_gsLocked) {
      html += `<div class="group-save-bar">
        <button class="btn btn-group-save" id="btn-save-group-${gId}"
                onclick="_saveGroup('${gId}')">💾 Salvar Grupo ${gId}</button>
      </div>`;
    }
    html += `</div>`;
  }

  panel.innerHTML = html;
  _bindSteppers();
  if (_gsLocked) _applyLockUI(true);
  _updateProgress();
}

// ---- Stepper horizontal: [−] [val] [+] — mínimo 0, nunca nulo --
function _stepperHtml(gameId, side, val) {
  const v = (val !== null && val !== undefined && val !== '') ? Number(val) : 0;
  return `<div class="score-stepper">
    <button class="step-btn step-down" data-game="${gameId}" data-side="${side}" aria-label="Diminuir">−</button><span class="score-val filled" data-game="${gameId}" data-side="${side}">${v}</span><button class="step-btn step-up" data-game="${gameId}" data-side="${side}" aria-label="Aumentar">+</button>
  </div>`;
}

// ---- Liga eventos dos steppers ----------------------------------
function _bindSteppers() {
  document.getElementById('group-panel').querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (_gsLocked) return;
      const { game, side } = btn.dataset;
      const isUp  = btn.classList.contains('step-up');
      const field = side === 'home' ? 'homeGoals' : 'awayGoals';

      if (!_groupBets[game]) _groupBets[game] = {};
      const cur = _groupBets[game][field];
      let val   = parseInt(cur, 10);
      if (isNaN(val) || val < 0) val = 0;

      if (isUp) {
        val = Math.min(val + 1, 20);
      } else {
        val = Math.max(val - 1, 0);
      }

      _groupBets[game][field] = String(val);
      _touchedGames.add(game);

      const span = document.querySelector(`.score-val[data-game="${game}"][data-side="${side}"]`);
      if (span) {
        span.textContent = val;
        span.classList.add('filled');
      }

      _updateProgress();
      _checkAutoSimulate();
    });
  });
}

// ---- Auto-simular quando todos os 72 jogos estiverem preenchidos ----
function _checkAutoSimulate() {
  if (_gsLocked) return;
  const totalGames = Object.keys(GROUPS).length * 6; // 72
  let filled = 0;
  for (const gId of Object.keys(GROUPS)) {
    for (const g of generateGroupGames(gId)) {
      const bet = _groupBets[g.id];
      if (bet && bet.homeGoals !== '' && bet.awayGoals !== '') filled++;
    }
  }
  if (filled === totalGames) {
    const hasKoBets = typeof getCurrentKnockoutBets === 'function' &&
                      Object.keys(getCurrentKnockoutBets()).length > 0;
    if (!hasKoBets && typeof _simulate === 'function') _simulate();
    const status = document.getElementById('ko-status');
    if (status) status.textContent = '✅ Grupos completos! Bracket gerado automaticamente.';
  }
}

// ---- Aplica / remove visual de bloqueio -------------------------
function _applyLockUI(locked) {
  const panel   = document.getElementById('group-panel');
  const saveBtn = document.getElementById('btn-save-groups');
  const banner  = document.getElementById('bets-lock-banner');

  panel.querySelectorAll('.step-btn').forEach(b => b.disabled = locked);
  panel.querySelectorAll('.step-btn').forEach(b => b.style.opacity = locked ? '.35' : '');
  panel.querySelectorAll('.btn-group-save').forEach(b => b.disabled = locked);
  panel.querySelectorAll('.group-save-bar').forEach(b => b.classList.toggle('hidden', locked));
  if (saveBtn) saveBtn.classList.toggle('hidden', locked);
  if (banner)  banner.classList.toggle('hidden', !locked);
}

function _updateProgress() {
  const totalGames = 72;
  const filled = _touchedGames.size;
  const pct    = Math.min(100, Math.round((filled / totalGames) * 100));

  const label = document.getElementById('progress-label');
  const bar   = document.getElementById('progress-bar-fill');
  const pctEl = document.getElementById('progress-pct');

  if (label) label.textContent = `${filled} de ${totalGames} jogos preenchidos`;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (bar)   bar.style.width   = `${pct}%`;
  if (bar)   bar.style.background = pct === 100 ? 'var(--accent)' : 'var(--gold)';
}

function setGroupStageLocked(locked) {
  _gsLocked = locked;
  _applyLockUI(locked);
  if (typeof setKnockoutLocked === 'function') setKnockoutLocked(locked);
}

async function loadGroupBetsUI(uid) {
  // Carrega apostas e resultados oficiais em paralelo
  const [bets, results] = await Promise.all([
    loadGroupBets(uid),
    loadResults(),
  ]);

  _groupBets = bets;
  _officialResults = results.groupStage || {};

  // Garante que todos os jogos têm valor numérico (mínimo 0, nunca vazio)
  for (const gId of Object.keys(GROUPS)) {
    for (const g of generateGroupGames(gId)) {
      if (!_groupBets[g.id]) _groupBets[g.id] = {};
      if (_groupBets[g.id].homeGoals === undefined || _groupBets[g.id].homeGoals === '')
        _groupBets[g.id].homeGoals = '0';
      if (_groupBets[g.id].awayGoals === undefined || _groupBets[g.id].awayGoals === '')
        _groupBets[g.id].awayGoals = '0';
    }
  }

  // Inicializa jogos "tocados" com o que já estava salvo no Firestore
  _touchedGames = new Set(Object.keys(bets));

  // Sincroniza com todos os IDs pré-populados (inclusive os com valor '0' padrão)
  for (const gId of Object.keys(GROUPS)) {
    for (const g of generateGroupGames(gId)) {
      _touchedGames.add(g.id);
    }
  }

  _gsLocked = await loadGlobalLock();
  _renderAllGroups();
}

// Recarrega resultados oficiais e re-renderiza (chamado quando admin lança resultado)
async function refreshGroupResults() {
  const results = await loadResults(true);
  _officialResults = results.groupStage || {};
  _renderAllGroups();
}

async function _saveGroup(gId) {
  if (_gsLocked) return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const btn = document.getElementById(`btn-save-group-${gId}`);
  if (btn) btn.disabled = true;

  const groupData = {};
  for (const g of generateGroupGames(gId)) {
    if (_groupBets[g.id]) {
      groupData[g.id] = _groupBets[g.id];
      _touchedGames.add(g.id);
    }
  }

  try {
    await db.collection('users').doc(uid).collection('bets').doc('groupStage')
      .set(groupData, { merge: true });
    showToast(`Grupo ${gId} salvo! ✅`, 'success');
    _updateProgress();
  } catch (e) {
    showToast('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function _saveAll() {
  const btn = document.getElementById('btn-save-groups');
  btn.disabled = true;
  showLoading();
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      showToast('Sessão expirada. Faça login novamente.', 'error');
      return;
    }
    await saveGroupBets(uid, _groupBets);
    if (typeof getCurrentKnockoutBets === 'function') {
      const koBets = getCurrentKnockoutBets();
      if (Object.keys(koBets).length > 0) {
        await saveKnockoutBets(uid, koBets);
      }
    }
    showToast('Palpites salvos! ✅', 'success');
  } catch (e) {
    showToast('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    btn.disabled = false;
    hideLoading();
  }
}

// ---- Exporta apostas como página HTML imprimível ----------------
function _exportBets() {
  const koBets = typeof getCurrentKnockoutBets === 'function' ? getCurrentKnockoutBets() : {};
  const userName = document.getElementById('hdr-username')?.textContent || 'Participante';

  let rows = '';
  for (const gId of Object.keys(GROUPS)) {
    const color = GROUP_COLORS[gId] || '#888';
    rows += `<tr><td colspan="5" style="background:${color}22;border-left:4px solid ${color};padding:6px 10px;font-weight:700;color:${color}">Grupo ${gId}</td></tr>`;
    for (const g of generateGroupGames(gId)) {
      const bet  = _groupBets[g.id] || {};
      const hGoal = bet.homeGoals !== undefined ? bet.homeGoals : '–';
      const aGoal = bet.awayGoals !== undefined ? bet.awayGoals : '–';
      rows += `<tr>
        <td style="padding:5px 10px;text-align:right">${TEAMS[g.home]?.name || g.home}</td>
        <td style="padding:5px 10px;text-align:center;font-weight:700">${hGoal}</td>
        <td style="padding:5px 10px;text-align:center;color:#888">×</td>
        <td style="padding:5px 10px;text-align:center;font-weight:700">${aGoal}</td>
        <td style="padding:5px 10px">${TEAMS[g.away]?.name || g.away}</td>
      </tr>`;
    }
  }

  const roundLabel = id =>
    id.startsWith('r32') ? 'Rodada de 32' : id.startsWith('r16') ? 'Oitavas de Final' :
    id.startsWith('qf')  ? 'Quartas de Final' : id.startsWith('sf') ? 'Semifinal' : 'FINAL 🏆';

  let koRows = '';
  if (Object.keys(koBets).length === 0) {
    koRows = `<tr><td colspan="2" style="padding:10px;color:#888;font-style:italic">Nenhum palpite de mata-mata.</td></tr>`;
  } else {
    for (const [matchId, teamId] of Object.entries(koBets)) {
      const t = TEAMS[teamId];
      koRows += `<tr>
        <td style="padding:5px 10px;color:#888">${roundLabel(matchId)}</td>
        <td style="padding:5px 10px;font-weight:600">${t?.name || teamId}</td>
      </tr>`;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Apostas — ${userName} — Copa 2026</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 700px; margin: 30px auto; color: #222; }
    h1 { font-size: 1.4rem; border-bottom: 2px solid #eee; padding-bottom: 8px; }
    h2 { font-size: 1.1rem; margin-top: 28px; }
    table { width: 100%; border-collapse: collapse; }
    tr:nth-child(even) { background: #f8f8f8; }
    @media print { body { margin: 10px; } button { display: none; } }
  </style>
</head>
<body>
  <h1>🏆 Bolão Copa 2026 — Apostas de ${userName}</h1>
  <p style="color:#888;font-size:.85rem">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
  <button onclick="window.print()" style="padding:8px 16px;background:#238636;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-bottom:16px">🖨️ Imprimir / Salvar PDF</button>

  <h2>⚽ Fase de Grupos</h2>
  <table>${rows}</table>

  <h2>⚡ Mata-Mata</h2>
  <table>${koRows}</table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `apostas-copa2026-${userName.replace(/\s+/g,'-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function getCurrentGroupBets() { return _groupBets; }
function isGroupStageLocked()  { return _gsLocked; }
