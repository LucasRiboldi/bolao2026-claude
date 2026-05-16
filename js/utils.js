// ---- Toast notifications ------------------------------------
let _toastTimer = null;
function showToast(msg, type = 'info', duration = 3000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'toast'; }, duration);
}

// ---- Loading overlay ----------------------------------------
function showLoading()  { document.getElementById('loading-overlay').classList.remove('hidden'); }
function hideLoading()  { document.getElementById('loading-overlay').classList.add('hidden'); }

// ---- Screen switching ---------------------------------------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ---- Section switching inside dashboard ---------------------
function showSection(id) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
  document.getElementById(`section-${id}`).classList.remove('hidden');
  document.querySelectorAll('.nav-tab').forEach(t => {
    const isActive = t.dataset.section === id;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

// ---- HTML escaping ------------------------------------------
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- Debounce -----------------------------------------------
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ---- Global Escape key handler for modals -------------------
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  // Fechar modal de histórico se aberto
  const bhModal = document.getElementById('bet-history-modal');
  if (bhModal && !bhModal.classList.contains('hidden')) {
    if (typeof closeBetHistory === 'function') closeBetHistory();
    return;
  }
  // Fechar modal de edição se aberto
  const ebModal = document.getElementById('edit-bets-modal');
  if (ebModal && !ebModal.classList.contains('hidden')) {
    if (typeof closeEditBets === 'function') closeEditBets();
  }
});

// ---- Validate goal input ------------------------------------
function validateGoalInput(input) {
  let v = parseInt(input.value, 10);
  if (isNaN(v) || v < 0) { input.value = ''; return; }
  if (v > 99) v = 99;
  input.value = v;
  input.classList.toggle('filled', input.value !== '');
}
