// ---- Firestore CRUD helpers ---------------------------------

// Save group-stage bets for a user
async function saveGroupBets(uid, bets) {
  await db.collection('users').doc(uid)
    .collection('bets').doc('groupStage')
    .set(bets);
}

// Load group-stage bets
async function loadGroupBets(uid) {
  const snap = await db.collection('users').doc(uid)
    .collection('bets').doc('groupStage').get();
  return snap.exists ? snap.data() : {};
}

// Save knockout bets
async function saveKnockoutBets(uid, bets) {
  await db.collection('users').doc(uid)
    .collection('bets').doc('knockout')
    .set(bets);
}

// Load knockout bets
async function loadKnockoutBets(uid) {
  const snap = await db.collection('users').doc(uid)
    .collection('bets').doc('knockout').get();
  return snap.exists ? snap.data() : {};
}

// Save / update user profile
async function saveProfile(uid, data) {
  await db.collection('users').doc(uid)
    .collection('profile').doc('info')
    .set(data, { merge: true });
}

// Load user profile
async function loadProfile(uid) {
  const snap = await db.collection('users').doc(uid)
    .collection('profile').doc('info').get();
  return snap.exists ? snap.data() : {};
}

// Load real results (set by admin in Firestore)
async function loadResults() {
  const gs = await db.collection('results').doc('groupStage').get();
  const ko = await db.collection('results').doc('knockout').get();
  return {
    groupStage: gs.exists ? gs.data() : {},
    knockout:   ko.exists ? ko.data() : {},
  };
}

// Load all users' profiles + bets for ranking (up to 200 users)
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
      profile:    profileSnap.exists ? profileSnap.data() : {},
      groupBets:  gsSnap.exists ? gsSnap.data() : {},
      knockoutBets: koSnap.exists ? koSnap.data() : {},
    });
  }
  return list;
}

// Update ranking aggregation document (called after scoring)
async function updateRankingDoc(rankingArray) {
  await db.collection('ranking').doc('current').set({ entries: rankingArray });
}

// Load aggregated ranking (fast, no per-user reads)
async function loadRanking() {
  const snap = await db.collection('ranking').doc('current').get();
  return snap.exists ? snap.data().entries : [];
}
