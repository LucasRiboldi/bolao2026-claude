// ---- Main app controller ------------------------------------

(async function main() {
  initAuth();
  initGroupStage();
  initKnockout();

  loadPublicRanking();

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const section = tab.dataset.section;
      showSection(section);

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

    await loadGroupBetsUI(user.uid);
    await loadKnockoutBetsUI(user.uid);

    _refreshUserScore(user.uid);
    _loadWhatsAppButton();
    _loadTodayMatches();
    initAdminUI();

    showScreen('dashboard-screen');
    showSection('groups');
  } catch (e) {
    showToast('Erro ao carregar dados. Tente novamente.', 'error');
  } finally {
    hideLoading();
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
async function _loadTodayMatches() {
  const card = document.getElementById('today-matches-card');
  if (!card) return;
  const body = card.querySelector('.tdm-body');

  const today = new Date().toISOString().split('T')[0];
  try {
    const resp = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`,
      { headers: { 'x-apisports-key': 'b89962f0944bdce04ad5fec40c67e32d' } }
    );
    const data = await resp.json();
    const fixtures = (data.response || []);

    if (fixtures.length === 0) {
      body.innerHTML = `<p class="tdm-empty">Sem jogos da Copa hoje.</p>`;
      return;
    }

    let html = '';
    for (const f of fixtures) {
      const home    = f.teams.home;
      const away    = f.teams.away;
      const status  = f.fixture.status.short;
      const time    = new Date(f.fixture.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      const homeIso = _findTeamIso(home.name);
      const awayIso = _findTeamIso(away.name);

      const scoreHtml = status === 'NS'
        ? `<span class="tdm-time">${time}</span>`
        : (status === 'FT' || status === 'AET' || status === 'PEN')
          ? `<span class="tdm-score">${f.goals.home ?? 0}–${f.goals.away ?? 0}</span>`
          : `<span class="tdm-score tdm-live">${f.goals.home ?? 0}–${f.goals.away ?? 0} <span class="tdm-live-dot"></span></span>`;

      html += `<a class="tdm-match" href="https://cazetv.com/ao-vivo/" target="_blank" rel="noopener">
        <div class="tdm-team tdm-team-home">
          ${homeIso ? `<span class="fi fi-${homeIso} tdm-flag"></span>` : ''}
          <span class="tdm-name">${home.name}</span>
        </div>
        <div class="tdm-score-block">${scoreHtml}</div>
        <div class="tdm-team tdm-team-away">
          <span class="tdm-name">${away.name}</span>
          ${awayIso ? `<span class="fi fi-${awayIso} tdm-flag"></span>` : ''}
        </div>
      </a>`;
    }
    body.innerHTML = html;
  } catch {
    body.innerHTML = `<p class="tdm-empty">Não foi possível carregar os jogos.</p>`;
  }
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
      loadResults(),
    ]);
    container.innerHTML = _renderBetHistory(groupBets, knockoutBets, results);
  } catch (e) {
    container.innerHTML = `<p class="muted" style="padding:20px">Erro ao carregar apostas: ${e.message}</p>`;
  }
}
