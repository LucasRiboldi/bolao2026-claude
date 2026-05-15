// ============================================================
// results.js — Admin: lançamento de resultados oficiais
// ============================================================
//
// ARQUITETURA IMPORTANTE:
// Este módulo é COMPLETAMENTE INDEPENDENTE de standings.js.
//
//   standings.js  →  usa API-Football  →  só exibe a tabela oficial
//   results.js    →  usa Firestore     →  alimenta o scoring do bolão
//
// Não há conflito: são fontes de dados diferentes para propósitos
// diferentes. O admin pode lançar resultados aqui mesmo que a API
// esteja funcionando — eles sempre coexistem.
//
// Coleções Firestore escritas por este módulo:
//   results/groupStage  { [gameId]: { homeGoals, awayGoals } }
//   results/knockout    { [matchId]: "teamId" }
// ============================================================

// ---- Estado do módulo (privado) ----------------------------
let _resGs   = {};   // resultados da fase de grupos carregados
let _resKo   = {};   // resultados do mata-mata carregados
let _resTab  = 'groups'; // aba ativa: 'groups' | 'knockout'
let _resSaving = false;  // evita cliques duplos

// ---- Rodadas do mata-mata (IDs e rótulos) ------------------
const KO_ROUND_DEFS = [
  {
    id: 'r32',
    label: 'Rodada de 32',
    matches: _range(1, 16).map(i => `r32_${_pad(i)}`),
  },
  {
    id: 'r16',
    label: 'Oitavas de Final',
    matches: _range(1, 8).map(i => `r16_${_pad(i)}`),
  },
  {
    id: 'qf',
    label: 'Quartas de Final',
    matches: _range(1, 4).map(i => `qf_${_pad(i)}`),
  },
  {
    id: 'sf',
    label: 'Semifinais',
    matches: ['sf_01', 'sf_02'],
  },
  {
    id: 'third',
    label: '🥉 Disputa de 3º Lugar',
    matches: ['third'],
  },
  {
    id: 'final',
    label: '🏆 Final',
    matches: ['final'],
  },
];

// ---- Helpers -----------------------------------------------
function _range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
function _pad(n) {
  return String(n).padStart(2, '0');
}

// ============================================================
// PONTO DE ENTRADA — chamado por initAdminPanel()
// ============================================================
async function initResultsPanel() {
  const container = document.getElementById('results-panel');
  if (!container) return;

  container.innerHTML = '<p class="muted res-loading">⏳ Carregando resultados…</p>';

  try {
    const data = await loadResults(); // db.js
    _resGs = data.groupStage || {};
    _resKo = data.knockout   || {};
    _renderResultsPanel(container);
  } catch (err) {
    console.error('[results] Falha ao carregar:', err);
    container.innerHTML = `<p class="muted" style="padding:20px">⚠️ Erro ao carregar resultados: ${err.message}</p>`;
  }
}

// ============================================================
// RENDERIZAÇÃO — estrutura de abas
// ============================================================
function _renderResultsPanel(container) {
  const gsCount  = Object.keys(_resGs).length;
  const koCount  = Object.keys(_resKo).length;
  const gsTotal  = 72;
  const koTotal  = 32; // 16 R32 + 8 R16 + 4 QF + 2 SF + 1 terceiro + 1 final

  container.innerHTML = `
    <div class="res-stats-bar">
      <span class="res-stat">⚽ Grupos: <strong>${gsCount}/${gsTotal}</strong></span>
      <span class="res-stat">⚡ Mata-Mata: <strong>${koCount}/${koTotal}</strong></span>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="_resRefresh()" title="Recarregar resultados">🔄 Recarregar</button>
        <button class="btn btn-sm" style="background:var(--red);color:#fff;border:none"
                onclick="_clearAllResults()" title="Apagar TODOS os resultados do banco">🗑️ Apagar Tudo</button>
      </div>
    </div>

    <div class="res-tabs" role="tablist">
      <button class="res-tab ${_resTab === 'groups'   ? 'active' : ''}"
              role="tab" onclick="_resSetTab('groups')">⚽ Grupos</button>
      <button class="res-tab ${_resTab === 'knockout' ? 'active' : ''}"
              role="tab" onclick="_resSetTab('knockout')">⚡ Mata-Mata</button>
    </div>

    <div id="res-tab-body"></div>
  `;

  _renderResTabBody();
}

function _resSetTab(tab) {
  _resTab = tab;
  document.querySelectorAll('.res-tab').forEach(b => {
    b.classList.toggle('active',
      (tab === 'groups' && b.textContent.includes('Grupos')) ||
      (tab === 'knockout' && b.textContent.includes('Mata'))
    );
  });
  _renderResTabBody();
}

async function _resRefresh() {
  await initResultsPanel();
}

// ============================================================
// ABA: GRUPOS
// ============================================================
function _renderResTabBody() {
  const body = document.getElementById('res-tab-body');
  if (!body) return;

  if (_resTab === 'groups') {
    body.innerHTML = _buildGroupsHtml();
    _bindGroupEvents(body);
  } else {
    body.innerHTML = _buildKoHtml();
    _bindKoEvents(body);
  }
}

function _buildGroupsHtml() {
  let html = '<div class="res-groups-wrap">';

  for (const gId of Object.keys(GROUPS)) {
    const color = (typeof GROUP_COLORS !== 'undefined' && GROUP_COLORS[gId]) || '#888';
    const games = generateGroupGames(gId); // data.js

    html += `
      <div class="res-group" style="border-left:3px solid ${color}">
        <div class="res-group-title" style="color:${color}">Grupo ${gId}</div>`;

    for (const g of games) {
      html += _buildGroupGameRow(g, color);
    }

    html += `</div>`; // .res-group
  }

  html += `</div>`; // .res-groups-wrap
  return html;
}

function _buildGroupGameRow(g, color) {
  const res = _resGs[g.id];
  const hv  = res ? res.homeGoals : '';
  const av  = res ? res.awayGoals : '';
  const saved = res !== undefined && hv !== '' && av !== '';
  const home  = TEAMS[g.home];
  const away  = TEAMS[g.away];

  return `
    <div class="res-game-row${saved ? ' res-has-result' : ''}" data-game="${g.id}">
      <span class="res-team res-home">
        <span class="fi fi-${home.iso}"></span>
        <span class="res-tname">${home.short}</span>
      </span>

      <div class="res-score-wrap">
        <input type="number" class="res-score-inp" min="0" max="20" step="1"
               data-game="${g.id}" data-side="home"
               value="${hv}" placeholder="–" inputmode="numeric">
        <span class="res-sep">×</span>
        <input type="number" class="res-score-inp" min="0" max="20" step="1"
               data-game="${g.id}" data-side="away"
               value="${av}" placeholder="–" inputmode="numeric">
      </div>

      <span class="res-team res-away">
        <span class="res-tname">${away.short}</span>
        <span class="fi fi-${away.iso}"></span>
      </span>

      <div class="res-row-actions">
        <button class="res-btn res-btn-save" data-game="${g.id}" title="Salvar resultado">💾</button>
        ${saved
          ? `<button class="res-btn res-btn-clear" data-game="${g.id}" title="Apagar resultado">🗑️</button>`
          : ''}
      </div>

      ${saved
        ? `<span class="res-badge-saved" title="${hv}–${av}">✓</span>`
        : ''}
    </div>`;
}

function _bindGroupEvents(container) {
  // Salvar resultado de um jogo
  container.querySelectorAll('.res-btn-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (_resSaving) return;
      const gameId = btn.dataset.game;
      const row    = container.querySelector(`.res-game-row[data-game="${gameId}"]`);
      const hInp   = row.querySelector(`.res-score-inp[data-side="home"]`);
      const aInp   = row.querySelector(`.res-score-inp[data-side="away"]`);

      const hRaw = hInp.value.trim();
      const aRaw = aInp.value.trim();

      // Validação
      const hErr = _validateGoals(hRaw);
      const aErr = _validateGoals(aRaw);
      if (hErr || aErr) {
        showToast(hErr || aErr, 'error');
        return;
      }

      _resSaving = true;
      _setRowLoading(btn, true);

      try {
        await _saveGroupResult(gameId, parseInt(hRaw, 10), parseInt(aRaw, 10));
        showToast('Resultado salvo! ✅', 'success');
        // Re-render aba para atualizar badges e botões de limpar
        _renderResTabBody();
      } catch (err) {
        console.error('[results] Erro ao salvar grupo:', err);
        showToast('Erro ao salvar: ' + err.message, 'error');
        _setRowLoading(btn, false);
      } finally {
        _resSaving = false;
      }
    });
  });

  // Apagar resultado de um jogo
  container.querySelectorAll('.res-btn-clear').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (_resSaving) return;
      if (!confirm('Apagar este resultado do Firestore?')) return;
      const gameId = btn.dataset.game;

      _resSaving = true;
      _setRowLoading(btn, true);

      try {
        await _clearGroupResult(gameId);
        showToast('Resultado apagado.', 'success');
        _renderResTabBody();
      } catch (err) {
        console.error('[results] Erro ao apagar grupo:', err);
        showToast('Erro ao apagar: ' + err.message, 'error');
        _setRowLoading(btn, false);
      } finally {
        _resSaving = false;
      }
    });
  });
}

// ============================================================
// ABA: MATA-MATA
// ============================================================
function _buildKoHtml() {
  // Lista de times em ordem alfabética para o select
  const teamOpts = Object.entries(TEAMS)
    .sort((a, b) => a[1].name.localeCompare(b[1].name, 'pt'))
    .map(([id, t]) => `<option value="${id}">${t.name} (${t.short})</option>`)
    .join('');

  let html = '<div class="res-ko-wrap">';

  for (const round of KO_ROUND_DEFS) {
    html += `
      <div class="res-ko-round">
        <div class="res-ko-round-title">${round.label}</div>`;

    for (const matchId of round.matches) {
      html += _buildKoMatchRow(matchId, teamOpts);
    }

    html += `</div>`; // .res-ko-round
  }

  html += `</div>`;
  return html;
}

function _buildKoMatchRow(matchId, teamOpts) {
  const winnerId = _resKo[matchId];
  const saved    = !!winnerId;
  const winner   = winnerId ? TEAMS[winnerId] : null;

  // Injeta "selected" na option correta
  const optsHtml = saved
    ? teamOpts.replace(`value="${winnerId}"`, `value="${winnerId}" selected`)
    : teamOpts;

  return `
    <div class="res-ko-row${saved ? ' res-has-result' : ''}" data-match="${matchId}">
      <span class="res-ko-id">${matchId}</span>

      <select class="res-ko-select" data-match="${matchId}">
        <option value="">— Selecionar vencedor —</option>
        ${optsHtml}
      </select>

      <div class="res-row-actions">
        <button class="res-btn res-ko-save-btn" data-match="${matchId}" title="Salvar vencedor">💾</button>
        ${saved
          ? `<button class="res-btn res-ko-clear-btn" data-match="${matchId}" title="Apagar">🗑️</button>`
          : ''}
      </div>

      ${saved && winner
        ? `<span class="res-badge-saved" title="Vencedor salvo">
             <span class="fi fi-${winner.iso}"></span> ${winner.short}
           </span>`
        : ''}
    </div>`;
}

function _bindKoEvents(container) {
  // Salvar vencedor de uma partida KO
  container.querySelectorAll('.res-ko-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (_resSaving) return;
      const matchId  = btn.dataset.match;
      const row      = container.querySelector(`.res-ko-row[data-match="${matchId}"]`);
      const sel      = row.querySelector('.res-ko-select');
      const winnerId = sel.value;

      if (!winnerId) {
        showToast('Selecione um vencedor antes de salvar.', 'error');
        return;
      }

      _resSaving = true;
      _setRowLoading(btn, true);

      try {
        await _saveKoResult(matchId, winnerId);
        showToast('Vencedor salvo! ✅', 'success');
        _renderResTabBody();
      } catch (err) {
        console.error('[results] Erro ao salvar KO:', err);
        showToast('Erro ao salvar: ' + err.message, 'error');
        _setRowLoading(btn, false);
      } finally {
        _resSaving = false;
      }
    });
  });

  // Apagar vencedor
  container.querySelectorAll('.res-ko-clear-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (_resSaving) return;
      if (!confirm('Apagar este resultado do Firestore?')) return;
      const matchId = btn.dataset.match;

      _resSaving = true;
      _setRowLoading(btn, true);

      try {
        await _clearKoResult(matchId);
        showToast('Resultado apagado.', 'success');
        _renderResTabBody();
      } catch (err) {
        console.error('[results] Erro ao apagar KO:', err);
        showToast('Erro ao apagar: ' + err.message, 'error');
        _setRowLoading(btn, false);
      } finally {
        _resSaving = false;
      }
    });
  });
}

// ============================================================
// VALIDAÇÃO
// ============================================================

/**
 * Valida um valor de gol.
 * @param {string} val — valor do input
 * @returns {string|null} — mensagem de erro ou null se válido
 */
function _validateGoals(val) {
  if (val === '' || val === null || val === undefined) {
    return 'Preencha o número de gols (pode ser 0).';
  }
  const n = Number(val);
  if (!Number.isInteger(n)) return 'O valor deve ser um número inteiro.';
  if (n < 0)  return 'Gols não podem ser negativos.';
  if (n > 20) return 'Valor muito alto (máximo: 20 gols).';
  return null; // válido
}

// ============================================================
// ESCRITA NO FIRESTORE
// (independente da API standings.js — nunca se sobrepõem)
// ============================================================

/**
 * Salva o resultado de um jogo da fase de grupos.
 * Usa merge:true para nunca apagar outros jogos do documento.
 */
async function _saveGroupResult(gameId, homeGoals, awayGoals) {
  const data = {
    [gameId]: {
      homeGoals: String(homeGoals),
      awayGoals: String(awayGoals),
    },
  };
  await db.collection('results').doc('groupStage').set(data, { merge: true });
  // Atualiza o estado local imediatamente (sem precisar recarregar do Firestore)
  _resGs[gameId] = { homeGoals: String(homeGoals), awayGoals: String(awayGoals) };
}

/**
 * Remove o resultado de um jogo de grupos do Firestore.
 * Usa FieldValue.delete() para remover apenas aquele campo.
 */
async function _clearGroupResult(gameId) {
  const update = { [gameId]: firebase.firestore.FieldValue.delete() };
  await db.collection('results').doc('groupStage').update(update);
  delete _resGs[gameId];
}

/**
 * Salva o vencedor de uma partida do mata-mata.
 */
async function _saveKoResult(matchId, winnerId) {
  await db.collection('results').doc('knockout')
    .set({ [matchId]: winnerId }, { merge: true });
  _resKo[matchId] = winnerId;
}

/**
 * Remove o vencedor de uma partida do mata-mata.
 */
async function _clearKoResult(matchId) {
  const update = { [matchId]: firebase.firestore.FieldValue.delete() };
  await db.collection('results').doc('knockout').update(update);
  delete _resKo[matchId];
}

/**
 * Apaga todos os resultados do Firestore (grupos + mata-mata).
 */
async function _clearAllResults() {
  const gsCount = Object.keys(_resGs).length;
  const koCount = Object.keys(_resKo).length;
  const total   = gsCount + koCount;

  if (total === 0) {
    showToast('Não há resultados salvos para apagar.', 'error');
    return;
  }
  if (!confirm(`⚠️ Apagar TODOS os ${total} resultado(s) oficiais do banco?\n\nEsta ação não pode ser desfeita.`)) return;

  try {
    const batch = db.batch();
    if (gsCount > 0) batch.delete(db.collection('results').doc('groupStage'));
    if (koCount > 0) batch.delete(db.collection('results').doc('knockout'));
    await batch.commit();

    _resGs = {};
    _resKo = {};
    invalidateResultsCache();
    _renderResultsPanel(document.getElementById('results-panel'));

    // Zera pontuação de todos e atualiza ranking
    showToast('Resultados apagados. Recalculando ranking…', 'success');
    if (typeof adminRecalcRanking === 'function') {
      await adminRecalcRanking({ silent: true });
    }
    showToast('Ranking zerado e atualizado. ✅', 'success');
  } catch (err) {
    console.error('[results] Erro ao apagar tudo:', err);
    showToast('Erro ao apagar: ' + err.message, 'error');
  }
}

// ============================================================
// UTILITÁRIO DE UI
// ============================================================

/** Ativa/desativa estado de carregamento em um botão */
function _setRowLoading(btn, loading) {
  if (loading) {
    btn.dataset.origText = btn.textContent;
    btn.textContent = '⏳';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.origText || '💾';
    btn.disabled = false;
  }
}
