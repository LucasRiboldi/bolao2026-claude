// ---- Scoring & Ranking module -------------------------------

function calculateScore(groupBets, knockoutBets, results) {
  let pts = 0;
  const breakdown = { exact: 0, result: 0, ko: 0, bonus: 0 };

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

  // Mata-mata: pontua se o time apostado AVANÇOU de fase,
  // independentemente de qual slot/partida específica ele disputou.
  const koResults = results.knockout || {};

  const advanced = { r32: new Set(), r16: new Set(), qf: new Set(), sf: new Set() };
  for (const [matchId, winnerId] of Object.entries(koResults)) {
    if      (matchId.startsWith('r32_')) advanced.r32.add(winnerId);
    else if (matchId.startsWith('r16_')) advanced.r16.add(winnerId);
    else if (matchId.startsWith('qf_'))  advanced.qf.add(winnerId);
    else if (matchId.startsWith('sf_'))  advanced.sf.add(winnerId);
  }

  for (const [matchId, betTeam] of Object.entries(knockoutBets)) {
    // Final e 3º Lugar são tratados separadamente (não usam lógica de "avançou de fase")
    if (!betTeam || matchId === 'final' || matchId === 'third') continue;
    let scored = false;
    if      (matchId.startsWith('r32_') && advanced.r32.has(betTeam)) scored = true;
    else if (matchId.startsWith('r16_') && advanced.r16.has(betTeam)) scored = true;
    else if (matchId.startsWith('qf_')  && advanced.qf.has(betTeam))  scored = true;
    else if (matchId.startsWith('sf_')  && advanced.sf.has(betTeam))  scored = true;
    if (scored) { pts += SCORING.knockoutWinner; breakdown.ko++; }
  }

  // 3º Lugar: acerto exato do vencedor da disputa
  if (knockoutBets['third'] && koResults['third'] && knockoutBets['third'] === koResults['third']) {
    pts += SCORING.knockoutWinner; breakdown.ko++;
  }

  // Final: precisa acertar o campeão exato
  const champion = koResults['final'];
  if (champion && knockoutBets['final'] === champion) {
    pts += SCORING.knockoutWinner;
    breakdown.ko++;
    pts += SCORING.championBonus;
    breakdown.bonus = SCORING.championBonus;
  }

  return { pts, breakdown };
}

// ---- Render ranking section ---------------------------------
async function initRanking(currentUid) {
  const container = document.getElementById('ranking-content');
  container.innerHTML = '<p class="muted" style="padding:20px">Carregando ranking…</p>';

  try {
    let entries = await loadRanking();
    if (entries.length === 0) {
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
          <span class="breakdown-item" title="Placares exatos">⚽ ${e.breakdown.exact}</span>
          <span class="breakdown-item" title="Resultados corretos">✓ ${e.breakdown.result}</span>
          <span class="breakdown-item" title="Mata-mata">⚡ ${e.breakdown.ko}</span>
          ${e.breakdown.bonus ? `<span class="breakdown-item" style="color:var(--gold)" title="Bônus campeão">🏆 +${e.breakdown.bonus}</span>` : ''}
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

// ---- Public ranking on auth screen — com retry automático ----
async function loadPublicRanking() {
  const el = document.getElementById('public-ranking-list');
  try {
    let entries = await loadRanking();
    if (entries.length === 0) {
      entries = await _computeRankingClient();
    }
    if (entries.length === 0) {
      el.innerHTML = '<p class="muted">Nenhum palpite registrado ainda.</p>';
      return;
    }
    const top10 = entries.slice(0, 10);
    el.innerHTML = top10.map((e, i) => {
      const pos = i + 1;
      const cls = pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? 'bronze' : '';
      return `<div class="rank-row">
        <div class="rank-pos ${cls}">${pos}</div>
        <div class="rank-name">${escapeHtml(e.name)}</div>
        <div class="rank-pts">${e.pts} pts</div>
      </div>`;
    }).join('');
  } catch {
    el.innerHTML = `<div class="rank-error">
      <p class="muted" style="font-size:.82rem">Não foi possível carregar.</p>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="loadPublicRanking()">🔄 Tentar novamente</button>
    </div>`;
  }
}
