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

// ---- Card: Jogos de Hoje ------------------------------------
let _todayPollTimer = null;

async function _loadTodayMatches() {
  const card = document.getElementById('today-matches-card');
  if (!card) return;
  const body = card.querySelector('.tdm-body');

  const today = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo',
  });
  try {
    const resp = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`,
      { headers: { 'x-apisports-key': 'b89962f0944bdce04ad5fec40c67e32d' } }
    );
    const data = await resp.json();
    const fixtures = (data.response || []);

    if (fixtures.length === 0) {
      body.innerHTML = `<p class="tdm-empty">Sem jogos da Copa hoje.</p>`;
      _schedulePoll(false);
      return;
    }

    let cards = '';
    let hasLive = false;
    for (const f of fixtures) {
      const home    = f.teams.home;
      const away    = f.teams.away;
      const status  = f.fixture.status.short;
      const time    = new Date(f.fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      const homeIso = _findTeamIso(home.name);
      const awayIso = _findTeamIso(away.name);
      const isLive  = !['NS','FT','AET','PEN','PST','CANC','ABD','AWD','WO'].includes(status);
      if (isLive) hasLive = true;

      const midHtml = status === 'NS'
        ? `<div class="tdm-mid">
             <span class="tdm-kickoff-time">${time}</span>
             <span class="tdm-kickoff-label">início</span>
           </div>`
        : (status === 'FT' || status === 'AET' || status === 'PEN')
          ? `<div class="tdm-mid">
               <span class="tdm-final-score">${f.goals.home ?? 0}–${f.goals.away ?? 0}</span>
               <span class="tdm-final-label">${status === 'PEN' ? 'pen' : 'fim'}</span>
             </div>`
          : `<div class="tdm-mid tdm-mid-live">
               <span class="tdm-live-score">${f.goals.home ?? 0}–${f.goals.away ?? 0}</span>
               <span class="tdm-live-badge"><span class="tdm-live-dot"></span>AO VIVO</span>
             </div>`;

      cards += `<a class="tdm-card${isLive ? ' tdm-match-live' : ''}" href="https://cazetv.com/ao-vivo/" target="_blank" rel="noopener">
        <div class="tdm-side tdm-home">
          <div class="tdm-flag-wrap">${homeIso ? `<span class="fi fi-${homeIso} tdm-flag-lg"></span>` : `<span class="tdm-flag-fallback">?</span>`}</div>
          <span class="tdm-name">${home.name}</span>
        </div>
        ${midHtml}
        <div class="tdm-side tdm-away">
          <span class="tdm-name">${away.name}</span>
          <div class="tdm-flag-wrap">${awayIso ? `<span class="fi fi-${awayIso} tdm-flag-lg"></span>` : `<span class="tdm-flag-fallback">?</span>`}</div>
        </div>
      </a>`;
    }
    body.innerHTML = `<div class="tdm-date-label">${todayLabel} · ${fixtures.length} jogo${fixtures.length !== 1 ? 's' : ''}</div>
      <div class="tdm-carousel">${cards}</div>`;
    _schedulePoll(hasLive);
  } catch {
    body.innerHTML = `<p class="tdm-empty">Não foi possível carregar os jogos.</p>`;
    _schedulePoll(false);
  }
}

function _schedulePoll(hasLive) {
  if (_todayPollTimer) clearTimeout(_todayPollTimer);
  const delay = hasLive ? 60_000 : 300_000;
  _todayPollTimer = setTimeout(_loadTodayMatches, delay);
}

function _findTeamIso(apiName) {
  const n = (apiName || '').toLowerCase();
  for (const t of Object.values(TEAMS)) {
    if (t.name.toLowerCase() === n || t.short.toLowerCase() === n) return t.iso;
  }
  return null;
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
          <span class="mb-col-result">Resultado</span>
          <span class="mb-col-team mb-col-away">Visitante</span>
          <span class="mb-col-pts">Pts</span>
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
        <div class="mb-col-result">${resHtml}</div>
        <div class="mb-col-team mb-col-away">
          <span class="mb-tname mb-tname-full">${escapeHtml(away.name)}</span>
          <span class="mb-tname mb-tname-short">${away.short}</span>
          <span class="fi fi-${away.iso} mb-flag"></span>
        </div>
        <div class="mb-col-pts">
          ${icon ? `<span class="mb-icon">${icon}</span>` : ''}
          ${pts ? `<span class="mb-pts-val">+${pts}</span>` : ''}
        </div>
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
    .mb-table-head, .mb-game-row { display:grid; grid-template-columns:1fr 80px 80px 1fr 52px; align-items:center; gap:4px; padding:3px 4px; }
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
