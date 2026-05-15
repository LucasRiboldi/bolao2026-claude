// ---- Main app controller ------------------------------------

(async function main() {
  initAuth();
  initGroupStage();
  initKnockout();
  _loadTodayMatches();

  loadPublicRanking();

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const section = tab.dataset.section;
      showSection(section);

      // Limpa caches de sessão ao trocar de aba para sempre exibir dados frescos
      invalidateResultsCache();
      sessionStorage.removeItem('bolao_ranking');

      if (section === 'ranking' && auth.currentUser) {
        await initRanking(auth.currentUser.uid);
      }
      if (section === 'standings') {
        await initStandings();
      }
      if (section === 'mybets' && auth.currentUser) {
        await initMyBets(auth.currentUser.uid);
      }
      if (section === 'admin' && isAdmin()) {
        await initAdminPanel();
      }
    });
  });

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await _onLogin(user);
    } else {
      _onLogout();
    }
  });
})();

async function _onLogin(user) {
  showLoading();
  try {
    const profile = await loadProfile(user.uid);
    const name = user.displayName || profile.name || user.email.split('@')[0];
    document.getElementById('hdr-username').textContent = name;

    // Carrega configuração de pontuação do Firestore antes de qualquer cálculo
    await loadAndApplyScoring();
    _updateScoringLegend();

    await loadGroupBetsUI(user.uid);
    await loadKnockoutBetsUI(user.uid);

    _refreshUserScore(user.uid);
    _loadWhatsAppButton();
    initAdminUI();

    showScreen('dashboard-screen');
    showSection('groups');
  } catch (e) {
    showToast('Erro ao carregar dados. Tente novamente.', 'error');
  } finally {
    hideLoading();
  }
}

// Atualiza os valores exibidos na legenda de pontuação
function _updateScoringLegend() {
  const map = {
    'leg-exact':  `+${SCORING.exactScore} pts`,
    'leg-result': `+${SCORING.correctResult} pts`,
    'leg-r32':    `+${SCORING.r32Winner} pts`,
    'leg-r16':    `+${SCORING.r16Winner} pts`,
    'leg-qf':     `+${SCORING.qfWinner} pts`,
    'leg-sf':     `+${SCORING.sfWinner} pts`,
    'leg-champ':  `+${SCORING.championScore} pts`,
    'leg-bonus':  `+${SCORING.finalistBonus} pts`,
  };
  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

function _onLogout() {
  showScreen('auth-screen');
  document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
  const btn = document.getElementById('btn-whatsapp');
  if (btn) btn.classList.add('hidden');
  loadPublicRanking();
}

async function _refreshUserScore(uid) {
  try {
    const results      = await loadResults();
    const groupBets    = getCurrentGroupBets();
    const knockoutBets = getCurrentKnockoutBets();
    const { pts }      = calculateScore(groupBets, knockoutBets, results);
    document.getElementById('hdr-score').textContent = `${pts} pts`;
  } catch {
    document.getElementById('hdr-score').textContent = '0 pts';
  }
}

function _shareInvite() {
  const appUrl = 'https://bolao2026-a76c7.web.app';
  const text   = `⚽ Participe do nosso Bolão Copa 2026!\nAposte nos 72 jogos, monte seu bracket e dispute com a galera.\nAcesse: ${appUrl}`;
  if (navigator.share) {
    navigator.share({ title: 'Bolão Copa 2026', text, url: appUrl }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
}

async function _loadWhatsAppButton() {
  try {
    const config = await loadAdminConfig();
    const btn = document.getElementById('btn-whatsapp');
    if (!btn) return;
    if (config.whatsapp) {
      const number = config.whatsapp.replace(/\D/g, '');
      btn.href = `https://wa.me/${number}`;
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  } catch { /* silencioso */ }
}

// ---- Calendário de Jogos Copa 2026 --------------------------
let _calFixtures  = [];
let _calByDate    = {};
let _calSelDate   = null;
let _calLoaded    = false;
let _calPollTimer = null;

const _API_NAME_MAP = {
  'south korea': 'southkorea', 'korea republic': 'southkorea', 'korea (republic)': 'southkorea',
  'south africa': 'southafrica',
  'ivory coast': 'ivorycoast', "cote d'ivoire": 'ivorycoast', 'côte d\'ivoire': 'ivorycoast',
  'czech republic': 'czechia',
  'united states': 'usa', 'usa': 'usa',
  'new zealand': 'newzealand',
  'dr congo': 'drcongo', 'democratic republic of congo': 'drcongo', 'congo dr': 'drcongo',
  'cape verde': 'capeverde', 'cabo verde': 'capeverde',
  'saudi arabia': 'saudiarabia',
  'netherlands': 'netherlands', 'holland': 'netherlands',
  'bosnia and herzegovina': 'bosnia', 'bosnia & herzegovina': 'bosnia',
  'bosnia herzegovina': 'bosnia',
  'mexico': 'mexico', 'canada': 'canada', 'switzerland': 'switzerland',
  'brazil': 'brazil', 'scotland': 'scotland', 'england': 'england',
  'germany': 'germany', 'france': 'france', 'spain': 'spain',
  'argentina': 'argentina', 'portugal': 'portugal', 'croatia': 'croatia',
  'uruguay': 'uruguay', 'colombia': 'colombia', 'ecuador': 'ecuador',
  'paraguay': 'paraguay', 'australia': 'australia', 'turkey': 'turkey', 'türkiye': 'turkey',
  'curacao': 'curacao', 'curaçao': 'curacao',
  'morocco': 'morocco', 'senegal': 'senegal', 'ghana': 'ghana',
  'panama': 'panama', 'haiti': 'haiti', 'iraq': 'iraq', 'iran': 'iran',
  'japan': 'japan', 'belgium': 'belgium', 'egypt': 'egypt', 'sweden': 'sweden',
  'norway': 'norway', 'austria': 'austria', 'algeria': 'algeria', 'jordan': 'jordan',
  'uzbekistan': 'uzbekistan', 'tunisia': 'tunisia', 'qatar': 'qatar',
};

function _findTeamIso(apiName) {
  const n = (apiName || '').toLowerCase().trim();
  if (_API_NAME_MAP[n] && TEAMS[_API_NAME_MAP[n]]) return TEAMS[_API_NAME_MAP[n]].iso;
  for (const t of Object.values(TEAMS)) {
    if (t.name.toLowerCase() === n || t.short.toLowerCase() === n) return t.iso;
  }
  return null;
}

function _calToday() {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'America/Sao_Paulo' });
}

// ---- Calendário estático Rodada 1 Copa 2026 -----------------
// Fonte: calendário oficial FIFA Copa 2026 (sorteio 5 dez 2025)
// Horários em BRT (Brasília, UTC-3). Fallback quando API sem dados.
function _mkFix(id, iso, homeName, awayName, venue, city) {
  const d = new Date(iso);
  return {
    fixture: {
      id,
      date: iso,
      status: { short: d > new Date() ? 'NS' : 'FT', elapsed: null },
      venue: { name: venue, city },
    },
    teams: {
      home: { id: id * 10,     name: homeName },
      away: { id: id * 10 + 1, name: awayName },
    },
    goals: { home: null, away: null },
  };
}

const _CAL_STATIC_R1 = [
  // ---- 11 Jun — Grupos A + B (Abertura) ----
  _mkFix(90001,'2026-06-11T14:00:00-03:00','Canada','Switzerland','BC Place','Vancouver'),
  _mkFix(90002,'2026-06-11T17:00:00-03:00','Mexico','South Africa','Estadio Azteca','Cidade do México'),
  _mkFix(90003,'2026-06-11T20:00:00-03:00','South Korea','Czechia','AT&T Stadium','Arlington'),
  _mkFix(90004,'2026-06-11T23:00:00-03:00','Qatar','Bosnia and Herzegovina','SoFi Stadium','Los Angeles'),
  // ---- 12 Jun — Grupos C + D ----
  _mkFix(90005,'2026-06-12T14:00:00-03:00','Brazil','Morocco','MetLife Stadium','East Rutherford'),
  _mkFix(90006,'2026-06-12T17:00:00-03:00','Haiti','Scotland','Gillette Stadium','Boston'),
  _mkFix(90007,'2026-06-12T20:00:00-03:00','United States','Paraguay','Rose Bowl','Los Angeles'),
  _mkFix(90008,'2026-06-12T23:00:00-03:00','Australia','Turkey','Arrowhead Stadium','Kansas City'),
  // ---- 13 Jun — Grupos E + F ----
  _mkFix(90009,'2026-06-13T14:00:00-03:00','Germany','Curacao','Lincoln Financial Field','Filadélfia'),
  _mkFix(90010,'2026-06-13T17:00:00-03:00','Ivory Coast','Ecuador','Estadio Akron','Guadalajara'),
  _mkFix(90011,'2026-06-13T20:00:00-03:00','Netherlands','Japan','AT&T Stadium','Arlington'),
  _mkFix(90012,'2026-06-13T23:00:00-03:00','Tunisia','Sweden','Levi\'s Stadium','Santa Clara'),
  // ---- 14 Jun — Grupos G + H ----
  _mkFix(90013,'2026-06-14T14:00:00-03:00','Belgium','Egypt','Hard Rock Stadium','Miami'),
  _mkFix(90014,'2026-06-14T17:00:00-03:00','Iran','New Zealand','Seattle Seahawks Stadium','Seattle'),
  _mkFix(90015,'2026-06-14T20:00:00-03:00','Spain','Cape Verde','MetLife Stadium','East Rutherford'),
  _mkFix(90016,'2026-06-14T23:00:00-03:00','Saudi Arabia','Uruguay','Sofi Stadium','Los Angeles'),
  // ---- 15 Jun — Grupos I + J + K + L ----
  _mkFix(90017,'2026-06-15T11:00:00-03:00','France','Senegal','BC Place','Vancouver'),
  _mkFix(90018,'2026-06-15T14:00:00-03:00','Norway','Iraq','Estadio Azteca','Cidade do México'),
  _mkFix(90019,'2026-06-15T17:00:00-03:00','Argentina','Algeria','Hard Rock Stadium','Miami'),
  _mkFix(90020,'2026-06-15T17:00:00-03:00','Austria','Jordan','Levi\'s Stadium','Santa Clara'),
  _mkFix(90021,'2026-06-15T20:00:00-03:00','Portugal','Uzbekistan','Gillette Stadium','Boston'),
  _mkFix(90022,'2026-06-15T20:00:00-03:00','Colombia','DR Congo','Arrowhead Stadium','Kansas City'),
  _mkFix(90023,'2026-06-15T23:00:00-03:00','England','Croatia','Rose Bowl','Los Angeles'),
  _mkFix(90024,'2026-06-15T23:00:00-03:00','Ghana','Panama','Lincoln Financial Field','Filadélfia'),
];

async function _loadTodayMatches() {
  const card = document.getElementById('today-matches-card');
  if (!card) return;
  const body = card.querySelector('.tdm-body');
  body.innerHTML = '<p class="tdm-empty" style="padding:24px 16px">Carregando calendário…</p>';

  try {
    await _calFetchAll();
    const today = _calToday();
    const dates  = Object.keys(_calByDate).sort();
    // Seleciona hoje se houver jogos, senão o primeiro dia com jogos (abertura: 2026-06-11)
    _calSelDate = _calByDate[today] ? today : (dates[0] || '2026-06-11');
    _calRender(body);
  } catch {
    body.innerHTML = `<p class="tdm-empty">Não foi possível carregar o calendário.<br>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="_loadTodayMatches()">🔄 Tentar novamente</button></p>`;
  }
}

async function _calFetchAll(forceRefresh = false) {
  if (_calLoaded && !forceRefresh) return;

  function _buildByDate(fixtures) {
    _calFixtures = fixtures.sort((a, b) =>
      new Date(a.fixture.date) - new Date(b.fixture.date)
    );
    _calByDate = {};
    for (const f of _calFixtures) {
      const d = new Date(f.fixture.date).toLocaleDateString('fr-CA', { timeZone: 'America/Sao_Paulo' });
      if (!_calByDate[d]) _calByDate[d] = [];
      _calByDate[d].push(f);
    }
    _calLoaded = true;
  }

  try {
    const resp = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
      { headers: { 'x-apisports-key': 'b89962f0944bdce04ad5fec40c67e32d' } }
    );
    const data = await resp.json();
    const fixtures = data.response || [];
    // Se a API ainda não retornou dados da Copa 2026, usa agenda estática da R1
    _buildByDate(fixtures.length > 0 ? fixtures : [..._CAL_STATIC_R1]);
  } catch {
    // Fallback total por erro de rede
    _buildByDate([..._CAL_STATIC_R1]);
  }
}

function _calRender(body) {
  const today = _calToday();
  const dates  = Object.keys(_calByDate).sort();

  const pills = dates.map(d => {
    const dt      = new Date(d + 'T12:00:00');
    const dayName = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dayNum  = dt.getDate();
    const month   = dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const isSel   = d === _calSelDate;
    const isToday = d === today;
    return `<button class="cal-pill${isSel ? ' cal-pill-sel' : ''}${isToday ? ' cal-pill-today' : ''}"
                    data-date="${d}" onclick="_calSelectDate('${d}')">
      <span class="cal-pill-day">${dayName}</span>
      <span class="cal-pill-num">${dayNum}/${month}</span>
    </button>`;
  }).join('');

  body.innerHTML = `
    <div class="cal-carousel-wrap">
      <div class="cal-carousel" id="cal-carousel">${pills}</div>
    </div>
    <div class="cal-matches-wrap" id="cal-matches">
      ${_calMatchesHtml(_calSelDate)}
    </div>`;

  requestAnimationFrame(() => {
    const sel = document.querySelector('.cal-pill-sel');
    if (sel) sel.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  });

  _calSchedulePoll();
}

function _calMatchesHtml(date) {
  const fixtures = _calByDate[date] || [];
  if (fixtures.length === 0) return '<p class="tdm-empty" style="padding:20px">Sem jogos neste dia.</p>';
  return fixtures.map(f => _calMatchCard(f)).join('');
}

function _calSelectDate(date) {
  _calSelDate = date;
  document.querySelectorAll('.cal-pill').forEach(p => {
    p.classList.toggle('cal-pill-sel', p.dataset.date === date);
  });
  const wrap = document.getElementById('cal-matches');
  if (wrap) wrap.innerHTML = _calMatchesHtml(date);
  _calSchedulePoll();
}

function _calMatchCard(f) {
  const home   = f.teams.home;
  const away   = f.teams.away;
  const status = f.fixture.status.short;
  const DONE   = ['FT', 'AET', 'PEN'];
  const LIVE_NOT = ['NS', 'FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
  const isLive     = !LIVE_NOT.includes(status);
  const isFinished = DONE.includes(status);
  const isPending  = status === 'NS';
  if (isLive) _calHasLive = true;

  const homeIso = _findTeamIso(home.name);
  const awayIso = _findTeamIso(away.name);

  const time = new Date(f.fixture.date).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  });
  const venue = (f.fixture.venue?.name || '').substring(0, 30);
  const city  = (f.fixture.venue?.city || '');

  const flagHtml = iso =>
    iso ? `<span class="fi fi-${iso} cal-flag-xl"></span>`
        : `<span class="cal-flag-fallback"></span>`;

  let centerHtml;
  if (isPending) {
    centerHtml = `
      <div class="cal-score-num">0<span class="cal-score-sep"> : </span>0</div>
      <div class="cal-score-time">${time}<span class="cal-score-tz">BRT</span></div>
      ${venue ? `<div class="cal-venue">${venue}${city ? ` · ${city}` : ''}</div>` : ''}`;
  } else if (isLive) {
    centerHtml = `
      <div class="cal-score-num">${f.goals.home ?? 0}<span class="cal-score-sep"> : </span>${f.goals.away ?? 0}</div>
      <div class="cal-live-badge"><span class="cal-live-dot"></span>${f.fixture.status.elapsed ?? ''}' AO VIVO</div>`;
  } else {
    centerHtml = `
      <div class="cal-score-num">${f.goals.home ?? 0}<span class="cal-score-sep"> : </span>${f.goals.away ?? 0}</div>
      <div class="cal-fin-label">${status === 'PEN' ? 'Pênaltis' : 'Encerrado'}</div>`;
  }

  const cls = isLive ? ' cal-card-live' : isFinished ? ' cal-card-done' : '';
  return `<a class="cal-match-card${cls}" href="https://cazetv.com/ao-vivo/" target="_blank" rel="noopener">
    <div class="cal-field-lines" aria-hidden="true"></div>
    <div class="cal-side cal-home">
      ${flagHtml(homeIso)}
      <span class="cal-team-name">${home.name}</span>
    </div>
    <div class="cal-center">${centerHtml}</div>
    <div class="cal-side cal-away">
      ${flagHtml(awayIso)}
      <span class="cal-team-name">${away.name}</span>
    </div>
  </a>`;
}

let _calHasLive = false;

function _calSchedulePoll() {
  if (_calPollTimer) clearTimeout(_calPollTimer);
  const today   = _calToday();
  const isToday = _calSelDate === today;
  if (!isToday && !_calHasLive) return;
  const delay = _calHasLive ? 60_000 : 300_000;
  _calPollTimer = setTimeout(async () => {
    _calHasLive = false;
    _calLoaded  = false;
    await _calFetchAll();
    const wrap = document.getElementById('cal-matches');
    if (wrap && _calSelDate) wrap.innerHTML = _calMatchesHtml(_calSelDate);
    _calSchedulePoll();
  }, delay);
}

// ---- Aba Minhas Apostas ------------------------------------
async function initMyBets(uid) {
  const container = document.getElementById('mybets-content');
  container.innerHTML = `<div style="padding:20px;text-align:center"><div class="spinner"></div></div>`;
  try {
    const [{ groupBets, knockoutBets }, results] = await Promise.all([
      loadUserBetsForHistory(uid),
      loadResults(true),
    ]);
    container.innerHTML = _renderMyBetsPage(groupBets, knockoutBets, results, uid);
  } catch (e) {
    container.innerHTML = `<p class="muted" style="padding:20px">Erro ao carregar apostas: ${e.message}</p>`;
  }
}

function _renderMyBetsPage(groupBets, knockoutBets, results, uid) {
  const gsResults = results.groupStage || {};
  const koResults = results.knockout   || {};

  const advKO = { r32: new Set(), r16: new Set(), qf: new Set(), sf: new Set() };
  for (const [mid, wid] of Object.entries(koResults)) {
    if      (mid.startsWith('r32_')) advKO.r32.add(wid);
    else if (mid.startsWith('r16_')) advKO.r16.add(wid);
    else if (mid.startsWith('qf_'))  advKO.qf.add(wid);
    else if (mid.startsWith('sf_'))  advKO.sf.add(wid);
  }

  let exactCount = 0, correctCount = 0, koTotalPts = 0, totalGroupPts = 0;

  // Pre-compute group stats for summary
  for (const gId of Object.keys(GROUPS)) {
    for (const game of generateGroupGames(gId)) {
      const bet = groupBets[game.id];
      const res = gsResults[game.id];
      if (!bet || !res) continue;
      const bH = parseInt(bet.homeGoals, 10), bA = parseInt(bet.awayGoals, 10);
      const rH = parseInt(res.homeGoals,  10), rA = parseInt(res.awayGoals,  10);
      if (isNaN(bH) || isNaN(bA) || isNaN(rH) || isNaN(rA)) continue;
      if (bH === rH && bA === rA) { exactCount++; totalGroupPts += SCORING.exactScore; }
      else if (Math.sign(bH - bA) === Math.sign(rH - rA)) { correctCount++; totalGroupPts += SCORING.correctResult; }
    }
  }

  // Pre-compute KO points
  const koEntries = Object.entries(knockoutBets);
  for (const [mid, pid] of koEntries) {
    if (mid === 'final' || mid === 'third') continue;
    const pts = _koPointsForId(mid);
    const scored =
      (mid.startsWith('r32_') && advKO.r32.has(pid)) ||
      (mid.startsWith('r16_') && advKO.r16.has(pid)) ||
      (mid.startsWith('qf_')  && advKO.qf.has(pid))  ||
      (mid.startsWith('sf_')  && advKO.sf.has(pid));
    if (scored) koTotalPts += pts;
  }
  if (knockoutBets['third'] && koResults['third'] === knockoutBets['third']) koTotalPts += SCORING.r32Winner;
  if (knockoutBets['final'] && koResults['final'] === knockoutBets['final']) koTotalPts += SCORING.championScore;
  const sf01 = knockoutBets['sf_01'], sf02 = knockoutBets['sf_02'];
  if (sf01 && sf02 && advKO.sf.has(sf01) && advKO.sf.has(sf02)) koTotalPts += SCORING.finalistBonus;
  const totalPts = totalGroupPts + koTotalPts;

  // ---- Summary bar ----
  let html = `<div class="mb-topbar">
    <div class="mb-summary-pills">
      <span class="mb-pill mb-pill-pts">${totalPts} pts</span>
      <span class="mb-pill">✅ ${exactCount} exatos</span>
      <span class="mb-pill">✓ ${correctCount} certos</span>
      <span class="mb-pill">⚡ ${koTotalPts} pts mata-mata</span>
    </div>
    <button class="btn btn-secondary btn-sm" onclick="_exportMyBetsPDF('${uid}')">📥 Baixar PDF</button>
  </div>`;

  // ---- Fase de Grupos ----
  html += `<div class="mb-section-title">⚽ Fase de Grupos</div>`;
  for (const gId of Object.keys(GROUPS)) {
    const color = (typeof GROUP_COLORS !== 'undefined' && GROUP_COLORS[gId]) || '#888';
    const games = generateGroupGames(gId);

    html += `<div class="mb-group-block" style="--grp-color:${color}">
      <div class="mb-group-hdr">
        <span class="mb-group-label">Grupo ${gId}</span>
        <span class="mb-group-teams">${GROUPS[gId].map(t =>
          `<span class="fi fi-${TEAMS[t].iso}"></span>`).join('')}</span>
      </div>
      <div class="mb-games-table">
        <div class="mb-table-head">
          <span class="mb-col-team mb-col-home">Casa</span>
          <span class="mb-col-bet">Palpite</span>
          <span class="mb-col-team mb-col-away">Visitante</span>
          <span class="mb-col-pts">Pts</span>
          <span class="mb-col-result">Resultado</span>
        </div>`;

    for (const game of games) {
      const bet  = groupBets[game.id];
      const res  = gsResults[game.id];
      const home = TEAMS[game.home];
      const away = TEAMS[game.away];
      const roundDate = ROUND_DATES[game.round] || '';

      let cls = 'mb-pending', icon = '', pts = 0;
      let betStr = bet ? `${bet.homeGoals ?? '–'} × ${bet.awayGoals ?? '–'}` : '– × –';
      let resHtml = `<span class="mb-waiting">⏳ ${roundDate}</span>`;

      if (bet && res) {
        const bH = parseInt(bet.homeGoals, 10), bA = parseInt(bet.awayGoals, 10);
        const rH = parseInt(res.homeGoals,  10), rA = parseInt(res.awayGoals,  10);
        resHtml = `<span class="mb-real">${rH}–${rA}</span>`;
        if (!isNaN(bH) && !isNaN(bA) && !isNaN(rH) && !isNaN(rA)) {
          if (bH === rH && bA === rA)                               { cls = 'mb-exact';   icon = '✅'; pts = SCORING.exactScore; }
          else if (Math.sign(bH - bA) === Math.sign(rH - rA))      { cls = 'mb-correct'; icon = '✓';  pts = SCORING.correctResult; }
          else                                                       { cls = 'mb-wrong';  icon = '❌'; }
        }
      } else if (bet) { cls = 'mb-placed'; icon = '📌'; }

      html += `<div class="mb-game-row ${cls}">
        <div class="mb-col-team mb-col-home">
          <span class="fi fi-${home.iso} mb-flag"></span>
          <span class="mb-tname mb-tname-full">${escapeHtml(home.name)}</span>
          <span class="mb-tname mb-tname-short">${home.short}</span>
        </div>
        <div class="mb-col-bet">
          <span class="mb-bet-score">${betStr}</span>
        </div>
        <div class="mb-col-team mb-col-away">
          <span class="mb-tname mb-tname-full">${escapeHtml(away.name)}</span>
          <span class="mb-tname mb-tname-short">${away.short}</span>
          <span class="fi fi-${away.iso} mb-flag"></span>
        </div>
        <div class="mb-col-pts">
          ${icon ? `<span class="mb-icon">${icon}</span>` : ''}
          ${pts ? `<span class="mb-pts-val">+${pts}</span>` : ''}
        </div>
        <div class="mb-col-result">${resHtml}</div>
      </div>`;
    }

    html += `</div></div>`;
  }

  // ---- Mata-Mata ----
  const KO_PHASES = [
    { prefix: 'r32',   label: '32-avos de Final',      color: '#58a6ff', pts: SCORING.r32Winner  },
    { prefix: 'r16',   label: 'Oitavas de Final',       color: '#bc8cff', pts: SCORING.r16Winner  },
    { prefix: 'qf',    label: 'Quartas de Final',       color: '#ffa657', pts: SCORING.qfWinner   },
    { prefix: 'sf',    label: 'Semifinal',              color: '#ff7b72', pts: SCORING.sfWinner   },
    { prefix: 'third', label: '🥉 3º Lugar',            color: '#8b949e', pts: SCORING.r32Winner  },
    { prefix: 'final', label: '🏆 Final',               color: '#f0c040', pts: SCORING.championScore },
  ];

  html += `<div class="mb-section-title" style="margin-top:20px">⚡ Mata-Mata</div>`;

  if (koEntries.length === 0) {
    html += `<p class="muted" style="padding:16px">Nenhum palpite de mata-mata registrado.</p>`;
  } else {
    for (const phase of KO_PHASES) {
      let entries;
      if (phase.prefix === 'third') entries = knockoutBets['third'] ? [['third', knockoutBets['third']]] : [];
      else if (phase.prefix === 'final') entries = knockoutBets['final'] ? [['final', knockoutBets['final']]] : [];
      else entries = koEntries.filter(([id]) => id.startsWith(phase.prefix + '_'));
      if (entries.length === 0) continue;

      html += `<div class="mb-ko-phase" style="--ko-color:${phase.color}">
        <div class="mb-ko-phase-hdr">${phase.label} <span class="mb-ko-pts-hint">+${phase.pts} pts/acerto</span></div>
        <div class="mb-ko-list">`;

      for (const [mid, pid] of entries) {
        const t = TEAMS[pid];
        let scored = false, roundDone = false;

        if      (mid === 'final')        { roundDone = 'final' in koResults; scored = koResults['final'] === pid; }
        else if (mid === 'third')        { roundDone = 'third' in koResults; scored = koResults['third'] === pid; }
        else if (mid.startsWith('r32_')) { roundDone = advKO.r32.size > 0;  scored = advKO.r32.has(pid); }
        else if (mid.startsWith('r16_')) { roundDone = advKO.r16.size > 0;  scored = advKO.r16.has(pid); }
        else if (mid.startsWith('qf_'))  { roundDone = advKO.qf.size  > 0;  scored = advKO.qf.has(pid); }
        else if (mid.startsWith('sf_'))  { roundDone = advKO.sf.size  > 0;  scored = advKO.sf.has(pid); }

        const icon = !roundDone ? '📌' : scored ? '✅' : '❌';
        const ptsVal = scored ? phase.prefix === 'final' ? SCORING.championScore : phase.pts : 0;
        const cls = !roundDone ? 'mb-ko-placed' : scored ? 'mb-ko-exact' : 'mb-ko-wrong';

        const realId = koResults[mid];
        const realT  = realId ? TEAMS[realId] : null;

        html += `<div class="mb-ko-row ${cls}">
          <span class="mb-ko-icon">${icon}</span>
          <div class="mb-ko-pick">
            ${t ? `<span class="fi fi-${t.iso} mb-flag"></span><span class="mb-tname">${escapeHtml(t.name)}</span>` : pid}
          </div>
          <div class="mb-ko-real">
            ${roundDone
              ? (realT ? `<span class="fi fi-${realT.iso} mb-flag"></span><span class="mb-tname">${escapeHtml(realT.name)}</span>` : '–')
              : `<span class="mb-waiting">⏳ Aguardando</span>`}
          </div>
          ${ptsVal ? `<span class="mb-ko-pts">+${ptsVal}</span>` : '<span class="mb-ko-pts mb-ko-pts-empty"></span>'}
        </div>`;
      }

      // 2º colocado inferido (para a Final)
      if (phase.prefix === 'final' && knockoutBets['final']) {
        const champId  = knockoutBets['final'];
        const runnerUp = sf01 === champId ? sf02 : sf02 === champId ? sf01 : null;
        const runnerT  = runnerUp ? TEAMS[runnerUp] : null;
        if (runnerT) {
          const finalDone   = 'final' in koResults;
          const realRunner  = finalDone && advKO.sf.size === 2 ? [...advKO.sf].find(t => t !== koResults['final']) : null;
          const realRunnerT = realRunner ? TEAMS[realRunner] : null;
          const runnerOk    = finalDone && realRunner === runnerUp;
          html += `<div class="mb-ko-row ${!finalDone ? 'mb-ko-placed' : runnerOk ? 'mb-ko-correct' : 'mb-ko-wrong'}">
            <span class="mb-ko-icon">${!finalDone ? '📌' : runnerOk ? '✓' : '❌'}</span>
            <div class="mb-ko-pick" style="opacity:.8">
              <span class="fi fi-${runnerT.iso} mb-flag"></span>
              <span class="mb-tname">${escapeHtml(runnerT.name)}</span>
              <span class="mb-ko-label">🥈 2º</span>
            </div>
            <div class="mb-ko-real">
              ${finalDone
                ? (realRunnerT ? `<span class="fi fi-${realRunnerT.iso} mb-flag"></span><span class="mb-tname">${escapeHtml(realRunnerT.name)}</span>` : '–')
                : `<span class="mb-waiting">⏳ Aguardando</span>`}
            </div>
            <span class="mb-ko-pts mb-ko-pts-empty"></span>
          </div>`;
        }
      }

      html += `</div></div>`;
    }

    // Bônus finalistas
    if (sf01 && sf02 && advKO.sf.has(sf01) && advKO.sf.has(sf02)) {
      html += `<div class="mb-bonus-row">
        <span>🎯 Bônus: acertou as duas finalistas!</span>
        <span class="mb-ko-pts">+${SCORING.finalistBonus}</span>
      </div>`;
    }
  }

  html += `<div class="mb-total-bar">Total: <strong>${totalPts} pts</strong></div>`;
  return html;
}

function _koPointsForId(mid) {
  if (mid === 'final')        return SCORING.championScore;
  if (mid === 'third')        return SCORING.r32Winner;
  if (mid.startsWith('r32_')) return SCORING.r32Winner;
  if (mid.startsWith('r16_')) return SCORING.r16Winner;
  if (mid.startsWith('qf_'))  return SCORING.qfWinner;
  if (mid.startsWith('sf_'))  return SCORING.sfWinner;
  return 0;
}

function _exportMyBetsPDF(uid) {
  const container = document.getElementById('mybets-content');
  const userName  = document.getElementById('hdr-username')?.textContent || 'Participante';
  const content   = container ? container.innerHTML : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Apostas — ${escapeHtml(userName)} — Copa 2026</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/6.11.0/css/flag-icons.min.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; background: #fff; padding: 20px; font-size: 13px; }
    h1 { font-size: 1.3rem; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 4px; }
    .mb-topbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:12px 0; }
    .mb-pill { background:#f0f0f0; border-radius:20px; padding:3px 10px; font-size:.82rem; font-weight:600; }
    .mb-pill-pts { background:#1a7f37; color:#fff; }
    .mb-section-title { font-size:1rem; font-weight:700; margin:16px 0 6px; padding:4px 0; border-bottom:2px solid #eee; }
    .mb-group-block { margin-bottom:12px; border-left:3px solid var(--grp-color,#888); padding-left:8px; }
    .mb-group-hdr { display:flex; align-items:center; gap:8px; padding:4px 0; font-weight:700; color:var(--grp-color,#333); font-size:.9rem; }
    .mb-games-table { width:100%; }
    .mb-table-head, .mb-game-row { display:grid; grid-template-columns:1fr 80px 1fr 52px 80px; align-items:center; gap:4px; padding:3px 4px; }
    .mb-table-head { font-size:.75rem; color:#777; font-weight:600; border-bottom:1px solid #eee; }
    .mb-game-row { border-bottom:1px solid #f5f5f5; }
    .mb-game-row.mb-exact { background:#d4edda; }
    .mb-game-row.mb-correct { background:#d1ecf1; }
    .mb-game-row.mb-wrong { background:#f8d7da; }
    .mb-col-home { display:flex; align-items:center; gap:4px; }
    .mb-col-away { display:flex; align-items:center; gap:4px; justify-content:flex-end; }
    .mb-col-bet { text-align:center; font-weight:700; }
    .mb-col-result { text-align:center; }
    .mb-col-pts { text-align:center; }
    .mb-flag { width:18px; height:14px; display:inline-block; }
    .mb-tname-short { display:none; }
    .mb-bet-score { font-weight:700; }
    .mb-real { font-weight:700; color:#1a7f37; }
    .mb-waiting { color:#aaa; font-size:.8rem; }
    .mb-icon { font-size:.9rem; }
    .mb-pts-val { font-weight:700; color:#1a7f37; font-size:.85rem; }
    .mb-ko-phase { margin:8px 0; border-left:3px solid var(--ko-color,#888); padding-left:8px; }
    .mb-ko-phase-hdr { font-weight:700; font-size:.88rem; color:var(--ko-color,#333); padding:4px 0; }
    .mb-ko-list { }
    .mb-ko-row { display:grid; grid-template-columns:24px 1fr 1fr 52px; align-items:center; gap:4px; padding:3px 4px; border-bottom:1px solid #f5f5f5; }
    .mb-ko-exact { background:#d4edda; }
    .mb-ko-correct { background:#d1ecf1; }
    .mb-ko-wrong { background:#f8d7da; }
    .mb-ko-pick, .mb-ko-real { display:flex; align-items:center; gap:4px; }
    .mb-ko-pts { text-align:right; font-weight:700; color:#1a7f37; }
    .mb-ko-pts-empty { opacity:0; }
    .mb-bonus-row { background:#fff8dc; border:1px solid #ffd700; border-radius:4px; padding:6px 10px; display:flex; justify-content:space-between; margin:6px 0; font-weight:700; color:#7a6000; }
    .mb-total-bar { text-align:right; font-size:1.1rem; margin-top:16px; padding-top:8px; border-top:2px solid #eee; }
    .mb-summary-pills { display:none; }
    .btn { display:none; }
    @media print { .mb-topbar button { display:none; } }
  </style>
</head>
<body>
  <h1>🏆 Bolão Copa 2026 — Apostas de ${escapeHtml(userName)}</h1>
  <p style="color:#888;font-size:.8rem;margin:4px 0 12px">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
  <button onclick="window.print()" style="padding:7px 16px;background:#238636;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-bottom:16px;font-size:.9rem">🖨️ Imprimir / Salvar PDF</button>
  ${content}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `apostas-copa2026-${userName.replace(/\s+/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
