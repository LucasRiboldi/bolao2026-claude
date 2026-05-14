// ---- Knockout Bracket module --------------------------------

let _koBets     = {};
let _r32Matches = [];
let _koLocked   = false;

function initKnockout() {
  // Botão simular removido — auto-simula ao completar grupos
}

function _simulate() {
  if (_koLocked) return;
  const groupBets = getCurrentGroupBets();
  const standings = calcGroupStandings(groupBets);
  const qualified = getQualified(standings);
  _r32Matches     = buildR32(qualified);
  _koBets = {};
  _renderBracket();
}

function _renderBracket() {
  const container = document.getElementById('knockout-bracket');
  const shortName = {
    'Oitavas':    'Oitavas de Final',
    'Quartas':    'Quartas de Final',
    'Semifinais': 'Semifinal',
    'Final':      '🏆 Final',
  };
  const rounds = [
    { name: '32avos de Final', matches: _r32Matches },
    ...KNOCKOUT_ROUNDS.map(r => ({
      name: shortName[r.name] || r.name,
      matches: resolveKnockoutRound(r.matches, _koBets),
    })),
  ];

  let html = `<div class="bracket-rounds">`;
  for (const round of rounds) {
    html += `<div class="bracket-round"><div class="round-title">${round.name}</div>`;
    for (const match of round.matches) html += _matchHtml(match);
    html += `</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;

  if (_koLocked) {
    container.querySelectorAll('.bracket-team').forEach(el => {
      el.style.cursor = 'default';
      el.style.pointerEvents = 'none';
    });
    return;
  }

  container.querySelectorAll('.bracket-team[data-match]').forEach(el => {
    el.addEventListener('click', () => {
      const matchId = el.dataset.match;
      const teamId  = el.dataset.team;
      if (!teamId || teamId === 'tbd') return;
      _koBets[matchId] = teamId;
      _renderBracket();
    });
  });
}

function _matchHtml(match) {
  const homeId = match.home;
  const awayId = match.away;
  const winner = _koBets[match.id];
  return `<div class="bracket-match">
    <div class="bracket-team ${_teamClass(homeId, winner)}"
         data-match="${match.id}" data-team="${homeId || 'tbd'}">
      ${_teamHtml(homeId)}
    </div>
    <div class="bracket-team ${_teamClass(awayId, winner)}"
         data-match="${match.id}" data-team="${awayId || 'tbd'}">
      ${_teamHtml(awayId)}
    </div>
  </div>`;
}

function _teamClass(teamId, winner) {
  if (!teamId)           return 'tbd';
  if (winner === teamId) return 'selected';
  return '';
}

function _teamHtml(teamId) {
  if (!teamId) return `<span class="tf">❓</span> <span class="bt-name">A definir</span>`;
  const t = TEAMS[teamId];
  if (!t) return teamId;
  return `<span class="fi fi-${t.iso} tf"></span><span class="bt-name">${t.short}</span>`;
}

async function loadKnockoutBetsUI(uid) {
  _koBets = await loadKnockoutBets(uid);
  if (Object.keys(_koBets).length > 0) {
    const groupBets = getCurrentGroupBets();
    const standings = calcGroupStandings(groupBets);
    const qualified = getQualified(standings);
    _r32Matches = buildR32(qualified);
    _renderBracket();
    document.getElementById('ko-status').textContent = '✅ Palpites carregados.';
  }
}

function setKnockoutLocked(locked) {
  _koLocked = locked;
  if (_r32Matches.length > 0) _renderBracket();
}

function getCurrentKnockoutBets() { return _koBets; }
