// ---- Group Stage module -------------------------------------

let _groupBets     = {};   // { gameId: { homeGoals, awayGoals } }
let _activeGroupId = 'A';

function initGroupStage() {
  _buildGroupTabs();
  _renderGroup('A');
  document.getElementById('btn-save-groups').addEventListener('click', _saveGroups);
}

function _buildGroupTabs() {
  const nav = document.getElementById('group-tabs');
  nav.innerHTML = '';
  for (const gId of Object.keys(GROUPS)) {
    const btn = document.createElement('button');
    btn.className = 'group-tab-btn' + (gId === 'A' ? ' active' : '');
    btn.textContent = `Grupo ${gId}`;
    btn.dataset.group = gId;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.group-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _activeGroupId = gId;
      _renderGroup(gId);
    });
    nav.appendChild(btn);
  }
}

function _renderGroup(gId) {
  const panel = document.getElementById('group-panel');
  const teams = GROUPS[gId];
  const games = generateGroupGames(gId);

  let html = `<div class="group-card">`;
  html += `<div class="group-card-title">
    Grupo ${gId}
    <div class="group-teams-badge">
      ${teams.map(t => `<span class="team-badge">${TEAMS[t].flag} ${TEAMS[t].short}</span>`).join('')}
    </div>
  </div>`;

  // Games
  for (const g of games) {
    const bet = _groupBets[g.id] || {};
    const hv = bet.homeGoals !== undefined ? bet.homeGoals : '';
    const av = bet.awayGoals !== undefined ? bet.awayGoals : '';
    const hFilled = hv !== '' ? ' filled' : '';
    const aFilled = av !== '' ? ' filled' : '';
    html += `
    <div class="game-row" data-game="${g.id}">
      <div class="team-cell">
        <span class="team-flag">${TEAMS[g.home].flag}</span>
        <span class="team-name-full">${TEAMS[g.home].name}</span>
        <span class="team-name-short">${TEAMS[g.home].short}</span>
      </div>
      <input type="number" class="score-input${hFilled}" inputmode="numeric"
             min="0" max="99" placeholder="–"
             value="${hv}" data-game="${g.id}" data-side="home">
      <span class="score-sep">×</span>
      <input type="number" class="score-input${aFilled}" inputmode="numeric"
             min="0" max="99" placeholder="–"
             value="${av}" data-game="${g.id}" data-side="away">
      <div class="team-cell away">
        <span class="team-name-full">${TEAMS[g.away].name}</span>
        <span class="team-name-short">${TEAMS[g.away].short}</span>
        <span class="team-flag">${TEAMS[g.away].flag}</span>
      </div>
    </div>`;
  }

  // Live standings
  html += _renderStandings(gId);
  html += `</div>`;
  panel.innerHTML = html;

  // Bind inputs
  panel.querySelectorAll('.score-input').forEach(inp => {
    inp.addEventListener('input', () => {
      validateGoalInput(inp);
      _updateBet(inp.dataset.game, inp.dataset.side, inp.value);
      _refreshStandings(gId);
    });
    inp.addEventListener('blur', () => validateGoalInput(inp));
  });
}

function _updateBet(gameId, side, value) {
  if (!_groupBets[gameId]) _groupBets[gameId] = {};
  _groupBets[gameId][side === 'home' ? 'homeGoals' : 'awayGoals'] = value;
}

function _refreshStandings(gId) {
  const existing = document.querySelector('.group-card .standings-wrap');
  if (!existing) return;
  existing.outerHTML = _renderStandings(gId);
  // No need to rebind – standings are read-only
}

function _renderStandings(gId) {
  const standings = calcGroupStandings(_groupBets);
  const table = standings[gId] || GROUPS[gId].map(t => ({ id: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 }));

  let html = `<div class="standings-wrap" style="padding:12px 14px 14px;background:var(--surface2)">
    <table class="standings-table">
      <thead><tr>
        <th style="min-width:110px">Seleção</th>
        <th title="Jogos">J</th>
        <th title="Pontos">Pts</th>
        <th title="Gols marcados">GM</th>
        <th title="Gols sofridos">GS</th>
        <th title="Saldo">SG</th>
      </tr></thead>
      <tbody>`;

  table.forEach((row, i) => {
    const cls = i === 0 ? 'qualified-1' : i === 1 ? 'qualified-2' : i === 2 ? 'qualified-3' : '';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    html += `<tr class="${cls}">
      <td><div class="team-cell">${TEAMS[row.id].flag} ${medal} ${TEAMS[row.id].short}</div></td>
      <td>${row.played}</td>
      <td><strong>${row.pts}</strong></td>
      <td>${row.gf}</td>
      <td>${row.ga}</td>
      <td>${row.gd > 0 ? '+' : ''}${row.gd}</td>
    </tr>`;
  });

  html += `</tbody></table>
    <p style="font-size:.72rem;color:var(--text-muted);margin-top:6px">
      🥇🥈 classificados diretos · 🥉 possível melhor terceiro
    </p>
  </div>`;
  return html;
}

async function loadGroupBetsUI(uid) {
  _groupBets = await loadGroupBets(uid);
  _renderGroup(_activeGroupId);
}

async function _saveGroups() {
  const btn = document.getElementById('btn-save-groups');
  btn.disabled = true;
  showLoading();
  try {
    const uid = auth.currentUser.uid;
    await saveGroupBets(uid, _groupBets);
    showToast('Palpites de grupos salvos! ✅', 'success');
  } catch (e) {
    showToast('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    hideLoading();
    btn.disabled = false;
  }
}

function getCurrentGroupBets() { return _groupBets; }
