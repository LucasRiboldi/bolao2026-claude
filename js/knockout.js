// ---- Knockout Bracket module --------------------------------

let _koBets     = {};   // { matchId: winnerId }
let _r32Matches = [];   // resolved R32 matches from group simulation

function initKnockout() {
  document.getElementById('btn-simulate').addEventListener('click', _simulate);
  document.getElementById('btn-save-knockout').addEventListener('click', _saveKnockout);
}

// Build bracket from user's group bets
function _simulate() {
  const groupBets = getCurrentGroupBets();
  const standings = calcGroupStandings(groupBets);
  const qualified = getQualified(standings);
  _r32Matches     = buildR32(qualified);

  // Clear ko bets when re-simulating (teams may have changed)
  _koBets = {};
  _renderBracket();
  document.getElementById('ko-status').textContent =
    '✅ Bracket gerado! Selecione os vencedores de cada jogo.';
}

function _renderBracket() {
  const container = document.getElementById('knockout-bracket');

  // Build the full bracket tree
  const rounds = [
    { name: 'Rodada de 32', matches: _r32Matches },
    ...KNOCKOUT_ROUNDS.map(r => ({
      name: r.name,
      matches: resolveKnockoutRound(r.matches, _koBets),
    })),
  ];

  let html = `<div class="bracket-rounds">`;
  for (const round of rounds) {
    html += `<div class="bracket-round">
      <div class="round-title">${round.name}</div>`;
    for (const match of round.matches) {
      html += _matchHtml(match);
    }
    html += `</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;

  // Bind click handlers
  container.querySelectorAll('.bracket-team[data-match]').forEach(el => {
    el.addEventListener('click', () => {
      const matchId = el.dataset.match;
      const teamId  = el.dataset.team;
      if (!teamId || teamId === 'tbd') return;
      _koBets[matchId] = teamId;
      _renderBracket(); // re-render to cascade winners
    });
  });
}

function _matchHtml(match) {
  const homeId = match.home;
  const awayId = match.away;
  const winner = _koBets[match.id];

  const homeClass = _teamClass(homeId, winner, match.id);
  const awayClass = _teamClass(awayId, winner, match.id);

  return `<div class="bracket-match">
    <div class="bracket-team ${homeClass}"
         data-match="${match.id}" data-team="${homeId || 'tbd'}">
      ${_teamHtml(homeId)}
    </div>
    <div class="bracket-team ${awayClass}"
         data-match="${match.id}" data-team="${awayId || 'tbd'}">
      ${_teamHtml(awayId)}
    </div>
  </div>`;
}

function _teamClass(teamId, winner, matchId) {
  if (!teamId)       return 'tbd';
  if (winner === teamId) return 'selected';
  return '';
}

function _teamHtml(teamId) {
  if (!teamId) return `<span class="tf">❓</span> A definir`;
  const t = TEAMS[teamId];
  if (!t) return teamId;
  return `<span class="tf">${t.flag}</span> ${t.name}`;
}

async function loadKnockoutBetsUI(uid) {
  _koBets = await loadKnockoutBets(uid);
  // Bracket only renders if we have r32 data (from simulate or existing bets)
  if (Object.keys(_koBets).length > 0) {
    // Try to regenerate R32 from saved group bets
    const groupBets = getCurrentGroupBets();
    const standings = calcGroupStandings(groupBets);
    const qualified = getQualified(standings);
    _r32Matches = buildR32(qualified);
    _renderBracket();
    document.getElementById('ko-status').textContent =
      '✅ Palpites carregados.';
  }
}

async function _saveKnockout() {
  if (_r32Matches.length === 0) {
    showToast('Simule os grupos primeiro! Use o botão 🔄', 'error');
    return;
  }
  const btn = document.getElementById('btn-save-knockout');
  btn.disabled = true;
  showLoading();
  try {
    const uid = auth.currentUser.uid;
    await saveKnockoutBets(uid, _koBets);
    showToast('Palpites do mata-mata salvos! ✅', 'success');
  } catch (e) {
    showToast('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    hideLoading();
    btn.disabled = false;
  }
}

function getCurrentKnockoutBets() { return _koBets; }
