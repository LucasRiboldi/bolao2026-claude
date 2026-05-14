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

    // Carrega config admin (WhatsApp, etc.)
    _loadWhatsAppButton();

    // Exibe elementos de admin
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
