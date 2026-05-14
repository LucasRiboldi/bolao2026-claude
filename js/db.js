// ---- Firestore CRUD helpers ---------------------------------

async function saveGroupBets(uid, bets) {
  await db.collection('users').doc(uid)
    .collection('bets').doc('groupStage')
    .set(bets);
}

async function loadGroupBets(uid) {
  const snap = await db.collection('users').doc(uid)
    .collection('bets').doc('groupStage').get();
  return snap.exists ? snap.data() : {};
}

async function saveKnockoutBets(uid, bets) {
  await db.collection('users').doc(uid)
    .collection('bets').doc('knockout')
    .set(bets);
}

async function loadKnockoutBets(uid) {
  const snap = await db.collection('users').doc(uid)
    .collection('bets').doc('knockout').get();
  return snap.exists ? snap.data() : {};
}

async function saveProfile(uid, data) {
  // Garante que o documento pai users/{uid} existe (necessário para queries admin)
  await db.collection('users').doc(uid)
    .set({ _exists: true }, { merge: true });
  await db.collection('users').doc(uid)
    .collection('profile').doc('info')
    .set(data, { merge: true });
}

async function loadProfile(uid) {
  const snap = await db.collection('users').doc(uid)
    .collection('profile').doc('info').get();
  return snap.exists ? snap.data() : {};
}

// Cache de sessão para resultados (reduz leituras Firestore)
let _resultsCache = null;

async function loadResults(forceRefresh = false) {
  if (_resultsCache && !forceRefresh) return _resultsCache;

  const cached = sessionStorage.getItem('bolao_results');
  if (cached && !forceRefresh) {
    try {
      _resultsCache = JSON.parse(cached);
      return _resultsCache;
    } catch {}
  }

  const gs = await db.collection('results').doc('groupStage').get();
  const ko = await db.collection('results').doc('knockout').get();
  const data = {
    groupStage: gs.exists ? gs.data() : {},
    knockout:   ko.exists ? ko.data() : {},
  };
  _resultsCache = data;
  sessionStorage.setItem('bolao_results', JSON.stringify(data));
  return data;
}

function invalidateResultsCache() {
  _resultsCache = null;
  sessionStorage.removeItem('bolao_results');
}

async function loadAllUsersForRanking() {
  const usersSnap = await db.collection('users').get();
  const list = [];
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const profileSnap = await userDoc.ref.collection('profile').doc('info').get();
    const gsSnap = await userDoc.ref.collection('bets').doc('groupStage').get();
    const koSnap = await userDoc.ref.collection('bets').doc('knockout').get();
    list.push({
      uid,
      profile:      profileSnap.exists ? profileSnap.data() : {},
      groupBets:    gsSnap.exists ? gsSnap.data() : {},
      knockoutBets: koSnap.exists ? koSnap.data() : {},
    });
  }
  return list;
}

async function updateRankingDoc(rankingArray) {
  await db.collection('ranking').doc('current').set({ entries: rankingArray });
  // Invalida cache ao atualizar
  sessionStorage.removeItem('bolao_ranking');
}

// Cache de sessão para ranking
async function loadRanking(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = sessionStorage.getItem('bolao_ranking');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
  }
  const snap = await db.collection('ranking').doc('current').get();
  const entries = snap.exists ? snap.data().entries : [];
  if (entries.length > 0) {
    sessionStorage.setItem('bolao_ranking', JSON.stringify(entries));
  }
  return entries;
}

// ---- Bet lock helpers ---------------------------------------

async function lockBets(uid) {
  await db.collection('users').doc(uid)
    .collection('profile').doc('info')
    .set({ betsLocked: true, betsSavedAt: new Date().toISOString() }, { merge: true });
}

async function unlockUserBets(targetUid) {
  await db.collection('users').doc(targetUid)
    .collection('profile').doc('info')
    .set({ betsLocked: false, betsUnlockedAt: new Date().toISOString() }, { merge: true });
}

async function loadUserBetsForHistory(targetUid) {
  const gs = await db.collection('users').doc(targetUid)
    .collection('bets').doc('groupStage').get();
  const ko = await db.collection('users').doc(targetUid)
    .collection('bets').doc('knockout').get();
  return {
    groupBets:    gs.exists ? gs.data() : {},
    knockoutBets: ko.exists ? ko.data() : {},
  };
}

// Admin: lista TODOS os usuários via collectionGroup (funciona mesmo sem doc pai)
async function loadAdminUserList() {
  const list = [];
  const seen = new Set();

  // Abordagem primária: collectionGroup 'profile' — encontra todos os perfis
  try {
    const profilesSnap = await db.collectionGroup('profile').get();
    for (const doc of profilesSnap.docs) {
      if (doc.id !== 'info') continue;
      const uid = doc.ref.parent.parent.id;
      if (seen.has(uid)) continue;
      seen.add(uid);
      list.push({ uid, ...doc.data() });
    }
  } catch {
    // Fallback: lista via users collection (usuários com doc pai)
    const usersSnap = await db.collection('users').get();
    for (const doc of usersSnap.docs) {
      const uid = doc.id;
      if (seen.has(uid)) continue;
      seen.add(uid);
      const profileSnap = await db.collection('users').doc(uid)
        .collection('profile').doc('info').get();
      const profile = profileSnap.exists ? profileSnap.data() : {};
      list.push({ uid, ...profile });
    }
  }

  list.sort((a, b) => {
    if (a.betsLocked && !b.betsLocked) return -1;
    if (!a.betsLocked && b.betsLocked) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });
  return list;
}

// ---- Config global do bolão ---------------------------------

async function loadAdminConfig() {
  const snap = await db.collection('config').doc('admin').get();
  return snap.exists ? snap.data() : {};
}

async function saveAdminConfig(data) {
  await db.collection('config').doc('admin').set(data, { merge: true });
}
