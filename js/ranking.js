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

  const koResults = results.knockout || {};
  for (const [matchId, winnerId] of Object.entries(koResults)) {
    if (knockoutBets[matchId] === winnerId) {
      pts += SCORING.knockoutWinner; breakdown.ko++;
    }
  }

  const champion = koResults['final'];
  if (champion && knockoutBets['final'] === champion) {
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
    container.innerHTML = `<p class="muted" style="padding:20px">Erro ao carregar ranking.</p>`;
  }
}

async function _computeRankingClient() {
  const results = await loadResults();
  const users   = await loadAllUsersForRanking();
  const entries = users.map(u => {
    const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, results);
    return { uid: u.uid, name: u.profile.name || 'Sem nome', pts, breakdown };
  });
  entries.sort((a, b) => b.pts - a.pts);
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
    const safeName = (e.name || '').replace(/'/g, "\\'");

    html += `<div class="ranking-row ${isMe ? 'me' : ''}">
      <div class="pos">${medal}</div>
      <div class="ranking-info">
        <div class="name">${e.name}${isMe ? ' <em style="color:var(--accent);font-size:.8rem">(você)</em>' : ''}</div>
        ${e.breakdown ? `<div class="ranking-breakdown">
          <span class="breakdown-item">⚽ ${e.breakdown.exact}</span>
          <span class="breakdown-item">✓ ${e.breakdown.result}</span>
          <span class="breakdown-item">⚡ ${e.breakdown.ko}</span>
          ${e.breakdown.bonus ? `<span class="breakdown-item" style="color:var(--gold)">🏆 +${e.breakdown.bonus}</span>` : ''}
        </div>` : ''}
      </div>
      <div class="ranking-right">
        <span class="pts">${e.pts} pts</span>
        <button class="btn-bh" title="Ver apostas" onclick="openBetHistory('${e.uid}','${safeName}')">📋</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// ---- Public ranking on auth screen — sempre calcula ao vivo ----
async function loadPublicRanking() {
  const el = document.getElementById('public-ranking-list');
  try {
    // Tenta primeiro o ranking pré-computado (admin); se vazio, calcula ao vivo
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
        <div class="rank-name">${e.name}</div>
        <div class="rank-pts">${e.pts} pts</div>
      </div>`;
    }).join('');
  } catch {
    el.innerHTML = '<p class="muted">Não foi possível carregar.</p>';
  }
}
