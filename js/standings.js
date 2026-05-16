// ---- Mapeamento nome API → iso para bandeiras ------------------
function _isoByName(apiName) {
  const n = apiName.toLowerCase();
  for (const [, t] of Object.entries(TEAMS)) {
    if (t.name.toLowerCase() === n || t.short.toLowerCase() === n) return t.iso;
  }
  return 'un'; // fallback: flag desconhecida
}

// ---- Classificação Oficial — API-Football ----------------------
// Copa do Mundo FIFA 2026 · League ID 1 · Season 2026
// API Key: b89962f0944bdce04ad5fec40c67e32d

const API_FOOTBALL_KEY  = 'b89962f0944bdce04ad5fec40c67e32d';
const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const WC_LEAGUE_ID      = 1;
const WC_SEASON         = 2026;

const STANDINGS_TTL_MS   = 5 * 60 * 1000; // 5 minutos
let _standingsLoadedAt   = 0;

// ---- Helper para fetch com timeout 8s --------------------------
async function _apiFetch(url) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), 8000);
  try {
    return await fetch(url, {
      headers: { 'x-apisports-key': API_FOOTBALL_KEY },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(tid);
  }
}

// ---- Inicializa a aba de classificação --------------------------
async function initStandings() {
  const now = Date.now();
  if (now - _standingsLoadedAt < STANDINGS_TTL_MS) return;

  const container = document.getElementById('standings-content');
  container.innerHTML = '<div class="standings-loading"><div class="spinner"></div><p>Carregando classificação oficial…</p></div>';

  try {
    const res = await _apiFetch(
      `${API_FOOTBALL_BASE}/standings?league=${WC_LEAGUE_ID}&season=${WC_SEASON}`
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // API retornou dados válidos?
    const hasData = data.response && data.response.length > 0 &&
                    data.response[0].league &&
                    data.response[0].league.standings &&
                    data.response[0].league.standings.length > 0;

    if (hasData) {
      const leagueData = data.response[0].league;
      container.innerHTML = _renderApiStandings(leagueData.standings);
    } else {
      // Competição ainda não começou ou sem dados: mostra tabela local (zerada)
      container.innerHTML = _renderPreTournament();
    }
    _standingsLoadedAt = Date.now();

  } catch (e) {
    console.warn('Classificação API-Football indisponível:', e.message);
    // Fallback: tabela local com times e zeros
    container.innerHTML = `
      <div class="standings-notice">
        <span class="standings-notice-icon">⚠️</span>
        <span>Classificação ao vivo indisponível. Exibindo grupos com dados locais.</span>
      </div>
      ${_renderLocalGroups()}`;
    // Em caso de erro, permite retry em 1 minuto
    _standingsLoadedAt = Date.now() - STANDINGS_TTL_MS + 60_000;
  }
}

// ---- Renderiza classificação retornada pela API ----------------
function _renderApiStandings(groups) {
  // Helper para escapar valores em atributos inline JS
  const safeAttr = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  let html = `<div class="standings-container">`;

  for (const group of groups) {
    if (!group || group.length === 0) continue;
    const groupName = group[0].group || 'Grupo';

    html += `
    <div class="standings-group-card">
      <div class="standings-group-header">${groupName}</div>
      <div class="standings-table-wrap">
        <table class="fifa-table">
          <thead>
            <tr>
              <th class="col-pos">#</th>
              <th class="col-team">Seleção</th>
              <th title="Jogos">J</th>
              <th title="Vitórias">V</th>
              <th title="Empates">E</th>
              <th title="Derrotas">D</th>
              <th title="Gols Pro">GP</th>
              <th title="Gols Contra">GC</th>
              <th title="Saldo">SG</th>
              <th class="col-pts" title="Pontos">Pts</th>
            </tr>
          </thead>
          <tbody>`;

    group.forEach((entry, idx) => {
      const qualCls = idx === 0 ? 'q-1' : idx === 1 ? 'q-2' : idx === 2 ? 'q-3' : '';
      const gd      = entry.goalsDiff >= 0 ? `+${entry.goalsDiff}` : entry.goalsDiff;

      html += `
      <tr class="${qualCls}">
        <td class="col-pos">${entry.rank}</td>
        <td class="col-team">
          <div class="team-cell-st">
            <img src="${entry.team.logo}" alt="${safeAttr(entry.team.name)}"
                 class="team-logo-sm" loading="lazy"
                 onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'fi fi-'+(_isoByName('${safeAttr(entry.team.name)}'))+' team-flag-icon'}))">
            <span class="team-name-st">${entry.team.name}</span>
          </div>
        </td>
        <td>${entry.all.played}</td>
        <td>${entry.all.win}</td>
        <td>${entry.all.draw}</td>
        <td>${entry.all.lose}</td>
        <td>${entry.all.goals.for}</td>
        <td>${entry.all.goals.against}</td>
        <td>${gd}</td>
        <td class="col-pts"><strong>${entry.points}</strong></td>
      </tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>
      <div class="qual-legend">
        <span class="ql q1"></span>Classificado direto
        <span class="ql q3" style="margin-left:12px"></span>Possível melhor 3º
      </div>
    </div>`;
  }

  html += `</div>
  <p class="standings-source">Fonte: API-Football · Copa do Mundo FIFA 2026</p>`;
  return html;
}

// ---- Pré-torneio: mostra times com zerado ----------------------
function _renderPreTournament() {
  return `
  <div class="standings-notice">
    <span class="standings-notice-icon">🗓️</span>
    <span>A Copa do Mundo 2026 começa em <strong>junho de 2026</strong>. A classificação será atualizada automaticamente após o início da competição.</span>
  </div>
  ${_renderLocalGroups()}`;
}

// ---- Tabela local usando dados de data.js ---------------------
function _renderLocalGroups() {
  let html = `<div class="standings-container">`;

  for (const [gId, teamIds] of Object.entries(GROUPS)) {
    html += `
    <div class="standings-group-card">
      <div class="standings-group-header">Grupo ${gId}</div>
      <div class="standings-table-wrap">
        <table class="fifa-table">
          <thead>
            <tr>
              <th class="col-pos">#</th>
              <th class="col-team">Seleção</th>
              <th>J</th><th>V</th><th>E</th><th>D</th>
              <th>GP</th><th>GC</th><th>SG</th>
              <th class="col-pts">Pts</th>
            </tr>
          </thead>
          <tbody>`;

    teamIds.forEach((tid, idx) => {
      const t      = TEAMS[tid];
      const qualCls = idx < 2 ? `q-${idx + 1}` : '';
      html += `
      <tr class="${qualCls}">
        <td class="col-pos">${idx + 1}</td>
        <td class="col-team">
          <div class="team-cell-st">
            <span class="fi fi-${t.iso} team-flag-icon"></span>
            <span class="team-name-st">${t.name}</span>
          </div>
        </td>
        <td>0</td><td>0</td><td>0</td><td>0</td>
        <td>0</td><td>0</td><td>0</td>
        <td class="col-pts"><strong>0</strong></td>
      </tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>
      <div class="qual-legend">
        <span class="ql q1"></span>Classificado direto
        <span class="ql q3" style="margin-left:12px"></span>Possível melhor 3º
      </div>
    </div>`;
  }

  html += `</div>`;
  return html;
}
