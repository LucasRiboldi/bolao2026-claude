// ---- Scoring & Ranking module -------------------------------

// Carrega config de pontuação do Firestore e sobrescreve SCORING padrão
async function loadAndApplyScoring() {
  try {
    const config = await loadScoringConfig();
    if (config && Object.keys(config).length > 0) {
      Object.assign(SCORING, config);
    }
  } catch {}
}

function calculateScore(groupBets, knockoutBets, results) {
  let pts = 0;
  const breakdown = { exact: 0, result: 0, ko: 0, bonus: 0 };

  // ---- Fase de grupos ----
  const gsResults = results.groupStage || {};
  for (const [gameId, result] of Object.entries(gsResults)) {
    const bet = groupBets[gameId];
    if (!bet) continue;
    const bH = parseInt(bet.homeGoals, 10);
    const bA = parseInt(bet.awayGoals, 10);
    const rH = parseInt(result.homeGoals, 10);
    const rA = parseInt(result.awayGoals, 10);
    if (isNaN(bH) || isNaN(bA) || isNaN(rH) || isNaN(rA)) continue;

    if (bH === rH && bA === rA) {
      pts += SCORING.exactScore; breakdown.exact++;
    } else if (Math.sign(bH - bA) === Math.sign(rH - rA)) {
      pts += SCORING.correctResult; breakdown.result++;
    }
  }

  // ---- Mata-mata: pontua se o time apostado AVANÇOU de fase ----
  const koResults = results.knockout || {};

  // Sets de times que avançaram em cada fase
  const advanced = { r32: new Set(), r16: new Set(), qf: new Set(), sf: new Set() };
  for (const [matchId, winnerId] of Object.entries(koResults)) {
    if      (matchId.startsWith('r32_')) advanced.r32.add(winnerId);
    else if (matchId.startsWith('r16_')) advanced.r16.add(winnerId);
    else if (matchId.startsWith('qf_'))  advanced.qf.add(winnerId);
    else if (matchId.startsWith('sf_'))  advanced.sf.add(winnerId);
  }

  for (const [matchId, betTeam] of Object.entries(knockoutBets)) {
    if (!betTeam || matchId === 'final' || matchId === 'third') continue;
    let scored = false;
    let pointsForHit = 0;
    if      (matchId.startsWith('r32_') && advanced.r32.has(betTeam)) { scored = true; pointsForHit = SCORING.r32Winner; }
    else if (matchId.startsWith('r16_') && advanced.r16.has(betTeam)) { scored = true; pointsForHit = SCORING.r16Winner; }
    else if (matchId.startsWith('qf_')  && advanced.qf.has(betTeam))  { scored = true; pointsForHit = SCORING.qfWinner;  }
    else if (matchId.startsWith('sf_')  && advanced.sf.has(betTeam))  { scored = true; pointsForHit = SCORING.sfWinner;  }
    if (scored) { pts += pointsForHit; breakdown.ko++; }
  }

  // 3º Lugar: acerto exato do vencedor
  if (knockoutBets['third'] && koResults['third'] && knockoutBets['third'] === koResults['third']) {
    pts += SCORING.r32Winner; breakdown.ko++;
  }

  // Final: campeão exato
  const champion = koResults['final'];
  if (champion && knockoutBets['final'] === champion) {
    pts += SCORING.championScore;
    breakdown.ko++;
  }

  // Bônus: acertou as DUAS finalistas (ambos os vencedores de SF)
  const betSf01 = knockoutBets['sf_01'];
  const betSf02 = knockoutBets['sf_02'];
  const bothFinalistsCorrect =
    betSf01 && betSf02 &&
    advanced.sf.has(betSf01) && advanced.sf.has(betSf02);
  if (bothFinalistsCorrect) {
    pts += SCORING.finalistBonus;
    breakdown.bonus = SCORING.finalistBonus;
  }

  return { pts, breakdown };
}

// ---- Render ranking section ---------------------------------
async function initRanking(currentUid) {
  const container = document.getElementById('ranking-content');
  container.innerHTML = '<p class="muted" style="padding:20px">Carregando ranking…</p>';

  try {
    await loadAndApplyScoring();
    // Carrega ranking pré-calculado pelo admin (ranking/current)
    let entries = await loadRanking();
    // Se vazio e usuário é admin, computa direto com acesso total
    if (entries.length === 0 && typeof isAdmin === 'function' && isAdmin()) {
      entries = await _computeRankingClient();
    }
    _renderRanking(entries, currentUid, container);
  } catch (e) {
    container.innerHTML = `
      <div class="ranking-error">
        <p class="muted">Erro ao carregar ranking.</p>
        <button class="btn btn-ghost btn-sm" onclick="initRanking('${currentUid}')">🔄 Tentar novamente</button>
      </div>`;
  }
}

async function _computeRankingClient() {
  const results = await loadResults();
  const users   = await loadAllUsersForRanking();
  const entries = users.map(u => {
    const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, results);
    return { uid: u.uid, name: u.profile.name || 'Sem nome', pts, breakdown };
  });

  // Critério de desempate: pts > exatos > resultados certos > mata-mata > nome
  entries.sort((a, b) =>
    b.pts - a.pts ||
    (b.breakdown?.exact  || 0) - (a.breakdown?.exact  || 0) ||
    (b.breakdown?.result || 0) - (a.breakdown?.result || 0) ||
    (b.breakdown?.ko     || 0) - (a.breakdown?.ko     || 0) ||
    (a.name || '').localeCompare(b.name || '')
  );
  return entries;
}

function _renderRanking(entries, currentUid, container) {
  if (entries.length === 0) {
    container.innerHTML = `<p class="muted" style="padding:20px">Nenhum usuário ainda.</p>`;
    return;
  }

  let html = `<div class="ranking-table">`;
  entries.forEach((e, i) => {
    const pos   = i + 1;
    const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`;
    const isMe  = e.uid === currentUid;
    const safeName = escapeHtml(e.name || '');

    html += `<div class="ranking-row ${isMe ? 'me' : ''}">
      <div class="pos">${medal}</div>
      <div class="ranking-info">
        <div class="name">${safeName}${isMe ? ' <em style="color:var(--accent);font-size:.8rem">(você)</em>' : ''}</div>
        ${e.breakdown ? `<div class="ranking-breakdown">
          <span class="breakdown-item" title="Placares exatos (${SCORING.exactScore}pts cada)">⚽ ${e.breakdown.exact}</span>
          <span class="breakdown-item" title="Resultados corretos (${SCORING.correctResult}pts cada)">✓ ${e.breakdown.result}</span>
          <span class="breakdown-item" title="Acertos mata-mata">⚡ ${e.breakdown.ko}</span>
          ${e.breakdown.bonus ? `<span class="breakdown-item" style="color:var(--gold)" title="Bônus finalistas">🏆 +${e.breakdown.bonus}</span>` : ''}
        </div>` : ''}
      </div>
      <div class="ranking-right">
        <span class="pts">${e.pts} pts</span>
        <button class="btn-bh" title="Ver apostas" onclick="openBetHistory('${e.uid}','${safeName.replace(/'/g,"&#39;")}')">📋</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ---- Public ranking on auth screen ----
async function loadPublicRanking() {
  const el = document.getElementById('public-ranking-list');
  try {
    await loadAndApplyScoring();
    // Usa sempre o ranking pré-calculado (ranking/current) — sem requerer auth
    const entries = await loadRanking();
    if (entries.length === 0) {
      el.innerHTML = '<p class="muted">Nenhum palpite registrado ainda.</p>';
      return;
    }
    const top10  = entries.slice(0, 10);
    const maxPts = top10[0]?.pts || 1;
    el.innerHTML = top10.map((e, i) => {
      const pos     = i + 1;
      const medal   = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null;
      const tierCls = pos === 1 ? 'rank-gold' : pos === 2 ? 'rank-silver' : pos === 3 ? 'rank-bronze' : '';
      const pct     = maxPts > 0 ? Math.round((e.pts / maxPts) * 100) : 0;
      return `<div class="rank-entry ${tierCls}">
        <div class="rank-pos">${medal || `<span class="rank-num">${pos}</span>`}</div>
        <div class="rank-info">
          <span class="rank-name">${escapeHtml(e.name)}</span>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="rank-pts">${e.pts}<span class="rank-pts-unit"> pts</span></div>
      </div>`;
    }).join('');
  } catch {
    el.innerHTML = `<div class="rank-error">
      <p class="muted" style="font-size:.82rem">Não foi possível carregar.</p>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="loadPublicRanking()">🔄 Tentar novamente</button>
    </div>`;
  }
}
