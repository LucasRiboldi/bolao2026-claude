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
  await db.collection('users').doc(uid)
    .collection('profile').doc('info')
    .set(data, { merge: true });
}

async function loadProfile(uid) {
  const snap = await db.collection('users').doc(uid)
    .collection('profile').doc('info').get();
  return snap.exists ? snap.data() : {};
}

async function loadResults() {
  const gs = await db.collection('results').doc('groupStage').get();
  const ko = await db.collection('results').doc('knockout').get();
  return {
    groupStage: gs.exists ? gs.data() : {},
    knockout:   ko.exists ? ko.data() : {},
  };
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
}

async function loadRanking() {
  const snap = await db.collection('ranking').doc('current').get();
  return snap.exists ? snap.data().entries : [];
}

// ---- Bet lock helpers ---------------------------------------

// Trava as apostas do usuário após salvar
async function lockBets(uid) {
  await db.collection('users').doc(uid)
    .collection('profile').doc('info')
    .set({ betsLocked: true, betsSavedAt: new Date().toISOString() }, { merge: true });
}

// Admin: desbloqueio de apostas de qualquer usuário
async function unlockUserBets(targetUid) {
  await db.collection('users').doc(targetUid)
    .collection('profile').doc('info')
    .set({ betsLocked: false, betsUnlockedAt: new Date().toISOString() }, { merge: true });
}

// Carrega apostas de qualquer usuário (bolão transparente — bets são public-read)
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

// Admin: lista todos os usuários com status de bloqueio
async function loadAdminUserList() {
  const usersSnap = await db.collection('users').get();
  const list = [];
  for (const doc of usersSnap.docs) {
    const uid = doc.id;
    const profileSnap = await db.collection('users').doc(uid)
      .collection('profile').doc('info').get();
    const profile = profileSnap.exists ? profileSnap.data() : {};
    list.push({ uid, ...profile });
  }
  list.sort((a, b) => {
    if (a.betsLocked && !b.betsLocked) return -1;
    if (!a.betsLocked && b.betsLocked) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });
  return list;
}

// ---- Config global do bolão (admin escreve, todos leem) ------

async function loadAdminConfig() {
  const snap = await db.collection('config').doc('admin').get();
  return snap.exists ? snap.data() : {};
}

async function saveAdminConfig(data) {
  await db.collection('config').doc('admin').set(data, { merge: true });
}
