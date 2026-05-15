// ---- Knockout Bracket module --------------------------------

let _koBets     = {};
let _r32Matches = [];
let _koLocked   = false;

// Cores e metadados de cada rodada
const ROUND_META = {
  r32:   { label: '32-avos de Final',  short: 'R32',   color: '#58a6ff', pts: () => SCORING.r32Winner },
  r16:   { label: 'Oitavas de Final',  short: 'R16',   color: '#bc8cff', pts: () => SCORING.r16Winner },
  qf:    { label: 'Quartas de Final',  short: 'QF',    color: '#ffa657', pts: () => SCORING.qfWinner  },
  sf:    { label: 'Semifinal',         short: 'SF',    color: '#ff7b72', pts: () => SCORING.sfWinner  },
  third: { label: '🥉 3º Lugar',       short: '3º',    color: '#8b949e', pts: () => SCORING.r32Winner },
  final: { label: '🏆 Final',          short: 'Final', color: '#f0c040', pts: () => SCORING.championScore },
};

function _getRoundKey(matchId) {
  if (matchId.startsWith('r32_')) return 'r32';
  if (matchId.startsWith('r16_')) return 'r16';
  if (matchId.startsWith('qf_'))  return 'qf';
  if (matchId.startsWith('sf_'))  return 'sf';
  if (matchId === 'third')        return 'third';
  if (matchId === 'final')        return 'final';
  return 'r32';
}

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

  // Rastreia { matchId: {home, away} } para resolver perdedores (L:) na 3ª disputa
  const resolved = {};
  for (const m of _r32Matches) resolved[m.id] = { home: m.home, away: m.away };

  const rounds = [];

  // R32 — agrupa em 8 pares
  const r32Meta = ROUND_META['r32'];
  rounds.push({
    key: 'r32',
    label: r32Meta.label,
    color: r32Meta.color,
    pts: r32Meta.pts(),
    matches: _r32Matches,
    isR32: true,
  });

  const roundKeyMap = { 'Oitavas': 'r16', 'Quartas': 'qf', 'Semifinais': 'sf', 'Terceiro Lugar': 'third', 'Final': 'final' };
  for (const r of KNOCKOUT_ROUNDS) {
    const key  = roundKeyMap[r.name] || 'r32';
    const meta = ROUND_META[key];
    const matches = resolveKnockoutRound(r.matches, _koBets, resolved);
    for (const m of matches) resolved[m.id] = { home: m.home, away: m.away };
    rounds.push({ key, label: meta.label, color: meta.color, pts: meta.pts(), matches });
  }

  let html = `<div class="ko-sections">`;
  for (const round of rounds) {
    const n = round.matches.length;
    html += `<div class="ko-section" style="--round-color:${round.color}">
      <div class="ko-section-hdr">
        <div class="ko-section-hdr-left">
          <span class="ko-round-dot" style="background:${round.color}"></span>
          <span class="ko-section-title">${round.label}</span>
          <span class="ko-section-count">${n} jogo${n !== 1 ? 's' : ''}</span>
        </div>
        <span class="ko-round-pts" style="color:${round.color}">+${round.pts} pts/time</span>
      </div>`;

    if (round.isR32) {
      html += `<div class="ko-r32-pairs">`;
      for (let i = 0; i < round.matches.length; i += 2) {
        const pair = round.matches.slice(i, i + 2);
        html += `<div class="ko-r32-pair">
          <div class="ko-r32-pair-lbl" style="border-color:${round.color}">Confronto ${i / 2 + 1}</div>
          ${pair.map(m => _matchHtml(m, round.color)).join('')}
        </div>`;
      }
      html += `</div>`;
    } else {
      html += `<div class="ko-matches-grid">`;
      for (const match of round.matches) html += _matchHtml(match, round.color);
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

function _matchHtml(match, roundColor) {
  const homeId = match.home;
  const awayId = match.away;
  const winner = _koBets[match.id];
  const hasWinner = !!winner;
  return `<div class="bracket-match" style="--round-color:${roundColor}">
    <div class="bracket-team ${_teamClass(homeId, winner, hasWinner)}"
         data-match="${match.id}" data-team="${homeId || 'tbd'}">
      ${_teamHtml(homeId)}
      ${winner === homeId ? `<span class="bracket-win-badge">✓</span>` : ''}
    </div>
    <div class="bracket-vs">vs</div>
    <div class="bracket-team ${_teamClass(awayId, winner, hasWinner)}"
         data-match="${match.id}" data-team="${awayId || 'tbd'}">
      ${_teamHtml(awayId)}
      ${winner === awayId ? `<span class="bracket-win-badge">✓</span>` : ''}
    </div>
  </div>`;
}

function _teamClass(teamId, winner, hasWinner) {
  if (!teamId)           return 'tbd';
  if (winner === teamId) return 'selected';
  if (hasWinner)         return 'eliminated';
  return '';
}

function _teamHtml(teamId) {
  if (!teamId) return `<span class="tf">❓</span><span class="bt-name bt-full">A definir</span><span class="bt-name bt-short">?</span>`;
  const t = TEAMS[teamId];
  if (!t) return teamId;
  return `<span class="fi fi-${t.iso} tf"></span><span class="bt-name bt-full">${t.name}</span><span class="bt-name bt-short">${t.short}</span>`;
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
