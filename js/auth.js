// ---- Auth UI ------------------------------------------------
let _currentTab = 'login';

function initAuth() {
  const tabs   = document.querySelectorAll('.auth-tab');
  const form   = document.getElementById('auth-form');
  const errEl  = document.getElementById('auth-error');
  const nameF  = document.getElementById('field-name');
  const submit = document.getElementById('auth-submit');

  tabs.forEach(tab => tab.addEventListener('click', async () => {
    _currentTab = tab.dataset.tab;
    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.tab === _currentTab);
      t.setAttribute('aria-selected', t.dataset.tab === _currentTab ? 'true' : 'false');
    });
    nameF.classList.toggle('hidden', _currentTab === 'login');
    document.getElementById('inp-password').autocomplete =
      _currentTab === 'login' ? 'current-password' : 'new-password';
    submit.textContent = _currentTab === 'login' ? 'Entrar no Bolão ⚽' : 'Criar conta ⚽';
    errEl.classList.add('hidden');

    const banner = document.getElementById('reg-closed-banner');
    if (banner && _currentTab === 'register') {
      try {
        const config = await loadAdminConfig();
        banner.classList.toggle('hidden', config.registrationOpen !== false);
      } catch { banner.classList.add('hidden'); }
    } else if (banner) {
      banner.classList.add('hidden');
    }
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');
    const email    = document.getElementById('inp-email').value.trim();
    const password = document.getElementById('inp-password').value;
    const name     = document.getElementById('inp-name').value.trim();

    if (!email || !password) { showError('Preencha e-mail e senha.'); return; }
    if (_currentTab === 'register' && !name) { showError('Informe seu nome.'); return; }
    if (password.length < 6) { showError('Senha deve ter mínimo 6 caracteres.'); return; }

    submit.disabled = true;
    showLoading();
    try {
      if (_currentTab === 'login') {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        try {
          const config = await loadAdminConfig();
          if (config.registrationOpen === false) {
            showError('Cadastro temporariamente fechado. Contate o administrador.');
            submit.disabled = false;
            hideLoading();
            return;
          }
        } catch { /* default: open */ }
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        await saveProfile(cred.user.uid, { name, email });
      }
    } catch (err) {
      showError(friendlyError(err.code));
      submit.disabled = false;
    } finally {
      hideLoading();
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => auth.signOut());

  // Google Sign-In
  const btnGoogle = document.getElementById('btn-google-signin');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
      } catch (e) {
        if (e.code !== 'auth/popup-closed-by-user') {
          showToast('Erro ao entrar com Google: ' + e.message, 'error');
        }
      }
    });
  }
}

function showError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'Usuário não encontrado.',
    'auth/wrong-password':       'Senha incorreta.',
    'auth/email-already-in-use': 'E-mail já cadastrado.',
    'auth/invalid-email':        'E-mail inválido.',
    'auth/too-many-requests':    'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
  };
  return map[code] || 'Erro de autenticação. Tente novamente.';
}
