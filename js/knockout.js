// ---- Knockout Bracket module --------------------------------

let _koBets     = {};
let _r32Matches = [];
let _koLocked   = false;

function initKnockout() {
  // Auto-simula ao completar grupos
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

  const ROUND_META = {
    'Oitavas':    { label: 'Oitavas de Final',  icon: '⚡' },
    'Quartas':    { label: 'Quartas de Final',   icon: '⚡' },
    'Semifinais': { label: 'Semifinal',          icon: '⚡' },
    'Final':      { label: '🏆 Final',           icon: ''   },
  };

  const rounds = [
    { label: '32avos de Final', icon: '⚡', matches: _r32Matches },
    ...KNOCKOUT_ROUNDS.map(r => {
      const meta = ROUND_META[r.name] || { label: r.name, icon: '⚡' };
      return {
        label:   meta.label,
        icon:    meta.icon,
        matches: resolveKnockoutRound(r.matches, _koBets),
      };
    }),
  ];

  let html = `<div class="ko-sections">`;
  for (const round of rounds) {
    html += `<div class="ko-section">
      <div class="ko-section-hdr">
        <span class="ko-section-title">${round.label}</span>
        <span class="ko-section-count">${round.matches.length} jogos</span>
      </div>
      <div class="ko-matches-grid">`;
    for (const match of round.matches) html += _matchHtml(match);
    html += `</div></div>`;
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
