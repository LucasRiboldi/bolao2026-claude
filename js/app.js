// ---- Main app controller ------------------------------------

(async function main() {
  initAuth();
  initGroupStage();
  initKnockout();

  // Load public ranking on auth screen
  loadPublicRanking();

  // ---- Section navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const section = tab.dataset.section;
      showSection(section);
      if (section === 'ranking' && auth.currentUser) {
        await initRanking(auth.currentUser.uid);
      }
    });
  });

  // ---- Auth state change (entry point)
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

    // Update header
    const name = user.displayName || profile.name || user.email.split('@')[0];
    document.getElementById('hdr-username').textContent = name;

    // Load bets
    await loadGroupBetsUI(user.uid);
    await loadKnockoutBetsUI(user.uid);

    // Compute & show user score
    _refreshUserScore(user.uid);

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
    // Results may not exist yet
    document.getElementById('hdr-score').textContent = '0 pts';
  }
}
