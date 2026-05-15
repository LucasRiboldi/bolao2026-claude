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
    'Oitavas':         { label: 'Oitavas de Final',  icon: '⚡' },
    'Quartas':         { label: 'Quartas de Final',   icon: '⚡' },
    'Semifinais':      { label: 'Semifinal',          icon: '⚡' },
    'Terceiro Lugar':  { label: '🥉 3º Lugar',        icon: ''   },
    'Final':           { label: '🏆 Final',           icon: ''   },
  };

  // Rastreia { matchId: {home, away} } para resolver perdedores (L:) na 3ª disputa
  const resolved = {};
  for (const m of _r32Matches) resolved[m.id] = { home: m.home, away: m.away };

  const rounds = [
    { label: '32avos de Final', icon: '⚡', matches: _r32Matches, isR32: true },
  ];
  for (const r of KNOCKOUT_ROUNDS) {
    const meta    = ROUND_META[r.name] || { label: r.name, icon: '⚡' };
    const matches = resolveKnockoutRound(r.matches, _koBets, resolved);
    for (const m of matches) resolved[m.id] = { home: m.home, away: m.away };
    rounds.push({ label: meta.label, icon: meta.icon, matches });
  }

  let html = `<div class="ko-sections">`;
  for (const round of rounds) {
    const n = round.matches.length;
    html += `<div class="ko-section">
      <div class="ko-section-hdr">
        <span class="ko-section-title">${round.label}</span>
        <span class="ko-section-count">${n} jogo${n !== 1 ? 's' : ''}</span>
      </div>`;

    if (round.isR32) {
      // Agrupa os 16 confrontos em 8 pares para facilitar leitura
      html += `<div class="ko-r32-pairs">`;
      for (let i = 0; i < round.matches.length; i += 2) {
        const pair = round.matches.slice(i, i + 2);
        html += `<div class="ko-r32-pair">
          <div class="ko-r32-pair-lbl">Confronto ${i / 2 + 1}</div>
          ${pair.map(m => _matchHtml(m)).join('')}
        </div>`;
      }
      html += `</div>`;
    } else {
      html += `<div class="ko-matches-grid">`;
      for (const match of round.matches) html += _matchHtml(match);
      html += `</div>`;
    }

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
    _r32Matches     = buildR32(qualified);
    _renderBracket();
    const el = document.getElementById('ko-status');
    if (el) el.textContent = '✅ Palpites carregados.';
  }
}

function setKnockoutLocked(locked) {
  _koLocked = locked;
  if (_r32Matches.length > 0) _renderBracket();
}

function getCurrentKnockoutBets() { return _koBets; }
