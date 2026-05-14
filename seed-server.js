#!/usr/bin/env node
// ================================================================
// seed-server.js — Servidor local de seed para o Bolão Copa 2026
// Usa Firebase Admin SDK (bypassa todas as regras do Firestore)
//
// Como usar:
//   npm install          ← apenas na primeira vez
//   node seed-server.js  ← inicia o servidor na porta 3001
//
// Deixe este terminal aberto e use o test-seed.html no browser.
// ================================================================

const http = require('http');
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();
const db   = admin.firestore();

// ================================================================
// CONFIG
// ================================================================
const PORT        = 3001;
const NUM_USERS   = 10;
const TEST_DOMAIN = 'teste.com.br';
const TEST_PASS   = '123456';
const TEST_NAMES  = [
  'Teste Alpha','Teste Bravo','Teste Charlie','Teste Delta','Teste Echo',
  'Teste Foxtrot','Teste Golf','Teste Hotel','Teste India','Teste Juliet',
];

// ================================================================
// DADOS DA COMPETIÇÃO
// ================================================================
const SCORING = { exactScore: 3, correctResult: 1, knockoutWinner: 2, championBonus: 5 };

const TEAMS = {
  'mexico':      { name: 'México',          short: 'MEX' },
  'southafrica': { name: 'África do Sul',   short: 'RSA' },
  'southkorea':  { name: 'Coreia do Sul',   short: 'KOR' },
  'czechia':     { name: 'Tchéquia',        short: 'CZE' },
  'canada':      { name: 'Canadá',          short: 'CAN' },
  'switzerland': { name: 'Suíça',           short: 'SUI' },
  'qatar':       { name: 'Catar',           short: 'QAT' },
  'bosnia':      { name: 'Bósnia e Herz.',  short: 'BIH' },
  'brazil':      { name: 'Brasil',          short: 'BRA' },
  'morocco':     { name: 'Marrocos',        short: 'MAR' },
  'haiti':       { name: 'Haiti',           short: 'HAI' },
  'scotland':    { name: 'Escócia',         short: 'SCO' },
  'usa':         { name: 'Estados Unidos',  short: 'USA' },
  'paraguay':    { name: 'Paraguai',        short: 'PAR' },
  'australia':   { name: 'Austrália',       short: 'AUS' },
  'turkey':      { name: 'Turquia',         short: 'TUR' },
  'germany':     { name: 'Alemanha',        short: 'GER' },
  'curacao':     { name: 'Curaçao',         short: 'CUW' },
  'ivorycoast':  { name: 'Costa do Marfim', short: 'CIV' },
  'ecuador':     { name: 'Equador',         short: 'ECU' },
  'netherlands': { name: 'Holanda',         short: 'NED' },
  'japan':       { name: 'Japão',           short: 'JPN' },
  'tunisia':     { name: 'Tunísia',         short: 'TUN' },
  'sweden':      { name: 'Suécia',          short: 'SWE' },
  'belgium':     { name: 'Bélgica',         short: 'BEL' },
  'egypt':       { name: 'Egito',           short: 'EGY' },
  'iran':        { name: 'Irã',             short: 'IRN' },
  'newzealand':  { name: 'Nova Zelândia',   short: 'NZL' },
  'spain':       { name: 'Espanha',         short: 'ESP' },
  'capeverde':   { name: 'Cabo Verde',      short: 'CPV' },
  'saudiarabia': { name: 'Arábia Saudita',  short: 'KSA' },
  'uruguay':     { name: 'Uruguai',         short: 'URU' },
  'france':      { name: 'França',          short: 'FRA' },
  'senegal':     { name: 'Senegal',         short: 'SEN' },
  'norway':      { name: 'Noruega',         short: 'NOR' },
  'iraq':        { name: 'Iraque',          short: 'IRQ' },
  'argentina':   { name: 'Argentina',       short: 'ARG' },
  'algeria':     { name: 'Argélia',         short: 'ALG' },
  'austria':     { name: 'Áustria',         short: 'AUT' },
  'jordan':      { name: 'Jordânia',        short: 'JOR' },
  'portugal':    { name: 'Portugal',        short: 'POR' },
  'uzbekistan':  { name: 'Uzbequistão',     short: 'UZB' },
  'colombia':    { name: 'Colômbia',        short: 'COL' },
  'drcongo':     { name: 'RD Congo',        short: 'COD' },
  'england':     { name: 'Inglaterra',      short: 'ENG' },
  'croatia':     { name: 'Croácia',         short: 'CRO' },
  'ghana':       { name: 'Gana',            short: 'GHA' },
  'panama':      { name: 'Panamá',          short: 'PAN' },
};

const GROUPS = {
  A: ['mexico','southafrica','southkorea','czechia'],
  B: ['canada','switzerland','qatar','bosnia'],
  C: ['brazil','morocco','haiti','scotland'],
  D: ['usa','paraguay','australia','turkey'],
  E: ['germany','curacao','ivorycoast','ecuador'],
  F: ['netherlands','japan','tunisia','sweden'],
  G: ['belgium','egypt','iran','newzealand'],
  H: ['spain','capeverde','saudiarabia','uruguay'],
  I: ['france','senegal','norway','iraq'],
  J: ['argentina','algeria','austria','jordan'],
  K: ['portugal','uzbekistan','colombia','drcongo'],
  L: ['england','croatia','ghana','panama'],
};

const KNOCKOUT_SLOTS = [
  { id: 'r32_01', homeSlot: '2A',  awaySlot: '2B'   },
  { id: 'r32_02', homeSlot: '1E',  awaySlot: 'T3_1' },
  { id: 'r32_03', homeSlot: '1F',  awaySlot: '2C'   },
  { id: 'r32_04', homeSlot: '1C',  awaySlot: '2F'   },
  { id: 'r32_05', homeSlot: '1I',  awaySlot: 'T3_2' },
  { id: 'r32_06', homeSlot: '2E',  awaySlot: '2I'   },
  { id: 'r32_07', homeSlot: '1A',  awaySlot: 'T3_3' },
  { id: 'r32_08', homeSlot: '1L',  awaySlot: 'T3_4' },
  { id: 'r32_09', homeSlot: '1D',  awaySlot: 'T3_5' },
  { id: 'r32_10', homeSlot: '1G',  awaySlot: 'T3_6' },
  { id: 'r32_11', homeSlot: '2K',  awaySlot: '2L'   },
  { id: 'r32_12', homeSlot: '1H',  awaySlot: '2J'   },
  { id: 'r32_13', homeSlot: '1B',  awaySlot: 'T3_7' },
  { id: 'r32_14', homeSlot: '1J',  awaySlot: '2H'   },
  { id: 'r32_15', homeSlot: '1K',  awaySlot: 'T3_8' },
  { id: 'r32_16', homeSlot: '2D',  awaySlot: '2G'   },
];

const KNOCKOUT_ROUNDS = [
  { name: 'Oitavas', matches: [
    { id: 'r16_01', home: 'W:r32_02', away: 'W:r32_05' },
    { id: 'r16_02', home: 'W:r32_01', away: 'W:r32_03' },
    { id: 'r16_03', home: 'W:r32_04', away: 'W:r32_06' },
    { id: 'r16_04', home: 'W:r32_07', away: 'W:r32_08' },
    { id: 'r16_05', home: 'W:r32_11', away: 'W:r32_12' },
    { id: 'r16_06', home: 'W:r32_09', away: 'W:r32_10' },
    { id: 'r16_07', home: 'W:r32_14', away: 'W:r32_16' },
    { id: 'r16_08', home: 'W:r32_13', away: 'W:r32_15' },
  ]},
  { name: 'Quartas', matches: [
    { id: 'qf_01', home: 'W:r16_01', away: 'W:r16_02' },
    { id: 'qf_02', home: 'W:r16_05', away: 'W:r16_06' },
    { id: 'qf_03', home: 'W:r16_03', away: 'W:r16_04' },
    { id: 'qf_04', home: 'W:r16_07', away: 'W:r16_08' },
  ]},
  { name: 'Semifinais', matches: [
    { id: 'sf_01', home: 'W:qf_01', away: 'W:qf_02' },
    { id: 'sf_02', home: 'W:qf_03', away: 'W:qf_04' },
  ]},
  { name: 'Final', matches: [
    { id: 'final', home: 'W:sf_01', away: 'W:sf_02' },
  ]},
];

// ================================================================
// HELPERS
// ================================================================
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)         { return arr[randInt(0, arr.length - 1)]; }
function randomGoals()     { const p=[0,0,0,1,1,1,1,1,2,2,2,2,2,2,3,3,3,4,4,5]; return p[randInt(0,p.length-1)]; }

function generateGroupGames(gId) {
  const [t0,t1,t2,t3] = GROUPS[gId];
  return [
    { id:`${gId}_0`, home:t0, away:t1 }, { id:`${gId}_1`, home:t2, away:t3 },
    { id:`${gId}_2`, home:t0, away:t2 }, { id:`${gId}_3`, home:t1, away:t3 },
    { id:`${gId}_4`, home:t0, away:t3 }, { id:`${gId}_5`, home:t1, away:t2 },
  ];
}

function calcGroupStandings(bets) {
  const standings = {};
  for (const gId of Object.keys(GROUPS)) {
    const table = {};
    for (const t of GROUPS[gId]) table[t] = { id:t, pts:0, gf:0, ga:0, gd:0 };
    for (const game of generateGroupGames(gId)) {
      const bet = bets[game.id];
      if (!bet || bet.homeGoals==='' || bet.awayGoals==='') continue;
      const hg=parseInt(bet.homeGoals,10), ag=parseInt(bet.awayGoals,10);
      if (isNaN(hg)||isNaN(ag)) continue;
      const h=table[game.home], a=table[game.away];
      h.gf+=hg; h.ga+=ag; a.gf+=ag; a.ga+=hg;
      if (hg>ag) h.pts+=3; else if (hg===ag){h.pts+=1;a.pts+=1;} else a.pts+=3;
      h.gd=h.gf-h.ga; a.gd=a.gf-a.ga;
    }
    standings[gId] = Object.values(table).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  }
  return standings;
}

function getQualified(standings) {
  const winners={}, runners={}, thirds=[];
  for (const [gId, table] of Object.entries(standings)) {
    winners[gId]=table[0]?.id; runners[gId]=table[1]?.id;
    if (table[2]) thirds.push({...table[2], group:gId});
  }
  thirds.sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
  return { winners, runners, thirds: thirds.slice(0,8) };
}

function resolveSlot(slot, q) {
  const pos=slot[0];
  if (pos==='1') return q.winners[slot[1]];
  if (pos==='2') return q.runners[slot[1]];
  if (pos==='T') return q.thirds[parseInt(slot.split('_')[1],10)-1]?.id;
}

function buildR32(q) {
  return KNOCKOUT_SLOTS.map(s=>({ id:s.id, home:resolveSlot(s.homeSlot,q), away:resolveSlot(s.awaySlot,q) }));
}

function resolveKnockoutRound(matches, bets) {
  return matches.map(m=>{
    const r=ref=>ref.startsWith('W:')?(bets[ref.slice(2)]||null):ref;
    return { id:m.id, home:r(m.home), away:r(m.away) };
  });
}

function randomGroupBets() {
  const bets={};
  for (const gId of Object.keys(GROUPS))
    for (const g of generateGroupGames(gId))
      bets[g.id]={ homeGoals:String(randomGoals()), awayGoals:String(randomGoals()) };
  return bets;
}

function randomKnockoutBets(r32) {
  const bets={};
  for (const m of r32) { if (m.home&&m.away) bets[m.id]=pick([m.home,m.away]); }
  for (const round of KNOCKOUT_ROUNDS) {
    for (const m of resolveKnockoutRound(round.matches,bets))
      if (m.home&&m.away) bets[m.id]=pick([m.home,m.away]);
  }
  return bets;
}

function calcScore(gBets, kBets, realGroup, realKo) {
  let pts=0; const bd={exact:0,result:0,ko:0,bonus:0};
  for (const [id,res] of Object.entries(realGroup)) {
    const b=gBets[id]; if (!b) continue;
    const bH=parseInt(b.homeGoals,10), bA=parseInt(b.awayGoals,10);
    const rH=parseInt(res.homeGoals,10), rA=parseInt(res.awayGoals,10);
    if (isNaN(bH)||isNaN(bA)||isNaN(rH)||isNaN(rA)) continue;
    if (bH===rH&&bA===rA){ pts+=SCORING.exactScore; bd.exact++; }
    else if (Math.sign(bH-bA)===Math.sign(rH-rA)){ pts+=SCORING.correctResult; bd.result++; }
  }
  for (const [id,w] of Object.entries(realKo))
    if (kBets[id]===w){ pts+=SCORING.knockoutWinner; bd.ko++; }
  const champ=realKo['final'];
  if (champ&&kBets['final']===champ){ pts+=SCORING.championBonus; bd.bonus=SCORING.championBonus; }
  return { pts, breakdown:bd };
}

function simulateRealResults() {
  const groupResults = randomGroupBets();
  const standings    = calcGroupStandings(groupResults);
  const qualified    = getQualified(standings);
  const r32          = buildR32(qualified);
  const koResults={}, picks={};
  for (const m of r32) {
    if (!m.home||!m.away) continue;
    const w=pick([m.home,m.away]); koResults[m.id]=w; picks[m.id]=w;
  }
  for (const round of KNOCKOUT_ROUNDS) {
    for (const m of resolveKnockoutRound(round.matches,picks)) {
      if (!m.home||!m.away) continue;
      const w=pick([m.home,m.away]); koResults[m.id]=w; picks[m.id]=w;
    }
  }
  return { groupResults, koResults, r32, qualified };
}

async function getOrCreateUser(email, displayName) {
  try {
    const u = await auth.getUserByEmail(email);
    await auth.updateUser(u.uid, { displayName });
    return u.uid;
  } catch(e) {
    if (e.code==='auth/user-not-found') {
      const u = await auth.createUser({ email, password:TEST_PASS, displayName });
      return u.uid;
    }
    throw e;
  }
}

// Critério de desempate oficial
function rankSort(a, b) {
  if (b.pts !== a.pts)                                   return b.pts - a.pts;
  if ((b.breakdown.exact||0)  !== (a.breakdown.exact||0))  return (b.breakdown.exact||0)  - (a.breakdown.exact||0);
  if ((b.breakdown.result||0) !== (a.breakdown.result||0)) return (b.breakdown.result||0) - (a.breakdown.result||0);
  if ((b.breakdown.ko||0)     !== (a.breakdown.ko||0))     return (b.breakdown.ko||0)     - (a.breakdown.ko||0);
  return (a.name||'').localeCompare(b.name||'', 'pt-BR');
}

// ================================================================
// SSE HELPER
// ================================================================
function sseHeaders(res) {
  res.writeHead(200, {
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
}

function send(res, type, data={}) {
  res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
}

// ================================================================
// SEED HANDLER
// ================================================================
async function handleSeed(res) {
  sseHeaders(res);
  send(res, 'log', { msg: '🎲 Simulando resultados reais da competição…', level: 'info' });
  send(res, 'progress', { pct: 2 });

  try {
    const { groupResults, koResults, r32 } = simulateRealResults();
    const champion = koResults['final'];
    const cName    = TEAMS[champion]?.name ?? champion;

    send(res, 'log', { msg: `✅ 72 jogos simulados · Campeão: ${cName}`, level: 'ok' });
    send(res, 'champion', { id: champion, name: cName });

    send(res, 'log', { msg: '💾 Gravando resultados no Firestore…', level: 'info' });
    await db.collection('results').doc('groupStage').set(groupResults);
    await db.collection('results').doc('knockout').set(koResults);
    send(res, 'log', { msg: '✅ Resultados gravados', level: 'ok' });
    send(res, 'progress', { pct: 10 });

    const seedRanking = [];

    for (let i = 1; i <= NUM_USERS; i++) {
      const email = `teste${i}@${TEST_DOMAIN}`;
      const name  = TEST_NAMES[i - 1];
      const pct   = 10 + Math.round((i / NUM_USERS) * 70);

      send(res, 'user_start', { index: i, name, email });
      send(res, 'log', { msg: `👤 [${i}/${NUM_USERS}] ${name}…`, level: 'info' });

      try {
        const uid = await getOrCreateUser(email, name);

        await db.collection('users').doc(uid)
          .collection('profile').doc('info')
          .set({ name, email, seededAt: new Date().toISOString() });

        const gBets = randomGroupBets();
        await db.collection('users').doc(uid).collection('bets').doc('groupStage').set(gBets);

        const kBets = randomKnockoutBets(r32);
        await db.collection('users').doc(uid).collection('bets').doc('knockout').set(kBets);

        const { pts, breakdown } = calcScore(gBets, kBets, groupResults, koResults);
        seedRanking.push({ uid, name, email, pts, breakdown });

        const champHit = breakdown.bonus > 0 ? ' 🏆 ACERTOU!' : '';
        send(res, 'user_done', { index: i, uid, pts, breakdown });
        send(res, 'log', { msg: `   ✅ ${name}: ${pts} pts (exatos=${breakdown.exact} result=${breakdown.result} ko=${breakdown.ko}${champHit})`, level: 'ok' });
      } catch(e) {
        send(res, 'user_err', { index: i, msg: e.message });
        send(res, 'log', { msg: `   ❌ ${name}: ${e.message}`, level: 'err' });
      }
      send(res, 'progress', { pct });
    }

    // Carrega usuários reais (não-teste) e calcula pontos deles também
    send(res, 'log', { msg: '👥 Calculando pontos de usuários reais…', level: 'info' });
    const testEmailSet = new Set(seedRanking.map(r => r.email));
    const allRanking   = [...seedRanking];

    try {
      const profilesSnap = await db.collectionGroup('profile').get();
      let realCount = 0;
      for (const doc of profilesSnap.docs) {
        const profile = doc.data();
        if (!profile.email || testEmailSet.has(profile.email)) continue;
        const uid = doc.ref.parent.parent.id;
        try {
          const [gSnap, kSnap] = await Promise.all([
            db.collection('users').doc(uid).collection('bets').doc('groupStage').get(),
            db.collection('users').doc(uid).collection('bets').doc('knockout').get(),
          ]);
          const gBets = gSnap.exists ? gSnap.data() : {};
          const kBets = kSnap.exists ? kSnap.data() : {};
          const { pts, breakdown } = calcScore(gBets, kBets, groupResults, koResults);
          allRanking.push({ uid, name: profile.name, email: profile.email, pts, breakdown });
          realCount++;
          send(res, 'log', { msg: `  + ${profile.name}: ${pts} pts (real)`, level: 'ok' });
        } catch(e) {
          send(res, 'log', { msg: `  ⚠ ${profile.name || uid}: ${e.message}`, level: 'warn' });
        }
      }
      if (realCount === 0) send(res, 'log', { msg: '  ℹ Nenhum usuário real encontrado além dos de teste', level: 'info' });
    } catch(e) {
      send(res, 'log', { msg: `⚠ Erro ao carregar usuários reais: ${e.message}`, level: 'warn' });
    }

    allRanking.sort(rankSort);

    send(res, 'log', { msg: '📊 Gravando ranking…', level: 'info' });
    await db.collection('ranking').doc('current').set({
      entries: allRanking.map(({ uid, name, pts, breakdown }) => ({ uid, name, pts, breakdown })),
    });

    send(res, 'progress', { pct: 100 });
    send(res, 'log', { msg: `✅ Ranking gravado com ${allRanking.length} entradas (${seedRanking.length} teste + ${allRanking.length - seedRanking.length} real)`, level: 'ok' });
    send(res, 'done', { ranking: allRanking });

  } catch(e) {
    send(res, 'error', { msg: e.message });
  }
  res.end();
}

// ================================================================
// CLEAR HANDLER
// ================================================================
async function handleClear(res) {
  sseHeaders(res);
  send(res, 'log', { msg: '🗑 Iniciando limpeza…', level: 'warn' });

  try {
    for (let i = 1; i <= NUM_USERS; i++) {
      const email = `teste${i}@${TEST_DOMAIN}`;
      send(res, 'log', { msg: `Removendo ${email}…`, level: 'info' });
      try {
        const u = await auth.getUserByEmail(email);
        await db.collection('users').doc(u.uid).collection('bets').doc('groupStage').delete().catch(()=>{});
        await db.collection('users').doc(u.uid).collection('bets').doc('knockout').delete().catch(()=>{});
        await db.collection('users').doc(u.uid).collection('profile').doc('info').delete().catch(()=>{});
        await auth.deleteUser(u.uid);
        send(res, 'log', { msg: `✅ ${email} removido`, level: 'ok' });
      } catch(e) {
        if (e.code==='auth/user-not-found') send(res, 'log', { msg: `ℹ ${email} não existe`, level: 'info' });
        else send(res, 'log', { msg: `⚠ ${email}: ${e.message}`, level: 'warn' });
      }
      send(res, 'user_done', { index: i, cleared: true });
    }

    await db.collection('results').doc('groupStage').delete().catch(()=>{});
    await db.collection('results').doc('knockout').delete().catch(()=>{});
    await db.collection('ranking').doc('current').delete().catch(()=>{});
    send(res, 'log', { msg: '✅ results/* e ranking/* removidos', level: 'ok' });
    send(res, 'done', { cleared: true });
  } catch(e) {
    send(res, 'error', { msg: e.message });
  }
  res.end();
}

// ================================================================
// RECALC RANKING HANDLER
// Recalcula pontos de TODOS os usuários com os resultados atuais
// ================================================================
async function handleRecalcRanking(res) {
  sseHeaders(res);
  send(res, 'log', { msg: '🔄 Iniciando recálculo do ranking…', level: 'info' });
  send(res, 'progress', { pct: 5 });

  try {
    const [gsSnap, koSnap] = await Promise.all([
      db.collection('results').doc('groupStage').get(),
      db.collection('results').doc('knockout').get(),
    ]);

    if (!gsSnap.exists || !koSnap.exists) {
      send(res, 'error', { msg: 'Resultados não encontrados. Execute o Seed primeiro para simular resultados.' });
      res.end(); return;
    }

    const groupResults = gsSnap.data();
    const koResults    = koSnap.data();
    const champion     = koResults['final'];
    const champName    = TEAMS[champion]?.name ?? champion;

    send(res, 'log', { msg: `✅ Resultados carregados · Campeão simulado: ${champName}`, level: 'ok' });
    send(res, 'progress', { pct: 15 });

    const profilesSnap = await db.collectionGroup('profile').get();
    const profiles = profilesSnap.docs.map(d => ({ uid: d.ref.parent.parent.id, ...d.data() }));
    send(res, 'log', { msg: `👥 ${profiles.length} usuários encontrados`, level: 'info' });

    const ranking = [];
    let processed = 0;

    for (const profile of profiles) {
      processed++;
      const pct = 15 + Math.round((processed / profiles.length) * 75);
      send(res, 'progress', { pct });
      send(res, 'recalc_user', { index: processed, total: profiles.length, name: profile.name });

      try {
        const [gSnap, kSnap] = await Promise.all([
          db.collection('users').doc(profile.uid).collection('bets').doc('groupStage').get(),
          db.collection('users').doc(profile.uid).collection('bets').doc('knockout').get(),
        ]);
        const gBets = gSnap.exists ? gSnap.data() : {};
        const kBets = kSnap.exists ? kSnap.data() : {};

        const { pts, breakdown } = calcScore(gBets, kBets, groupResults, koResults);
        const champHit = breakdown.bonus > 0 ? ' 🏆' : '';
        ranking.push({ uid: profile.uid, name: profile.name, email: profile.email, pts, breakdown });
        send(res, 'log', { msg: `  ${profile.name}: ${pts} pts${champHit}`, level: pts > 0 ? 'ok' : 'info' });
      } catch(e) {
        send(res, 'log', { msg: `  ⚠ ${profile.name || profile.uid}: ${e.message}`, level: 'warn' });
      }
    }

    ranking.sort(rankSort);

    await db.collection('ranking').doc('current').set({
      entries: ranking.map(({ uid, name, pts, breakdown }) => ({ uid, name, pts, breakdown })),
    });

    send(res, 'progress', { pct: 100 });
    send(res, 'log', { msg: `✅ Ranking atualizado com ${ranking.length} entradas`, level: 'ok' });
    send(res, 'done', { ranking });
  } catch(e) {
    send(res, 'error', { msg: e.message });
  }
  res.end();
}

// ================================================================
// REPORT HANDLER
// Gera relatório completo: distribuição de pontos, palpites do
// campeão, completude dos palpites, métricas por usuário
// ================================================================
async function handleReport(res) {
  sseHeaders(res);
  send(res, 'log', { msg: '📊 Carregando dados para relatório…', level: 'info' });
  send(res, 'progress', { pct: 5 });

  try {
    const [gsSnap, koSnap, rankSnap] = await Promise.all([
      db.collection('results').doc('groupStage').get(),
      db.collection('results').doc('knockout').get(),
      db.collection('ranking').doc('current').get(),
    ]);

    const groupResults = gsSnap.exists ? gsSnap.data() : null;
    const koResults    = koSnap.exists ? koSnap.data() : null;
    const hasResults   = !!(groupResults && koResults);
    const champion     = hasResults ? koResults['final'] : null;
    const champName    = champion ? (TEAMS[champion]?.name ?? champion) : null;
    const totalGameResults = groupResults ? Object.keys(groupResults).length : 0;

    send(res, 'progress', { pct: 15 });

    const profilesSnap = await db.collectionGroup('profile').get();
    send(res, 'log', { msg: `👥 ${profilesSnap.size} usuários encontrados`, level: 'info' });
    send(res, 'progress', { pct: 20 });

    const users = [];
    await Promise.all(profilesSnap.docs.map(async (doc) => {
      const profile = doc.data();
      const uid     = doc.ref.parent.parent.id;

      const [gSnap, kSnap] = await Promise.all([
        db.collection('users').doc(uid).collection('bets').doc('groupStage').get(),
        db.collection('users').doc(uid).collection('bets').doc('knockout').get(),
      ]);

      const gBets         = gSnap.exists ? gSnap.data() : null;
      const kBets         = kSnap.exists ? kSnap.data() : null;
      const groupBetCount = gBets ? Object.keys(gBets).length : 0;
      const koBetCount    = kBets ? Object.keys(kBets).length : 0;

      let pts = 0, breakdown = { exact: 0, result: 0, ko: 0, bonus: 0 };
      if (hasResults && gBets && kBets) {
        const s = calcScore(gBets, kBets, groupResults, koResults);
        pts = s.pts; breakdown = s.breakdown;
      }

      users.push({
        uid,
        name:         profile.name || 'Sem nome',
        email:        profile.email || '',
        isTest:       (profile.email || '').includes(`@${TEST_DOMAIN}`),
        groupBetCount,
        koBetCount,
        groupPct:     Math.round(groupBetCount / 72 * 100),
        koPct:        Math.round(koBetCount / 31 * 100),
        pts,
        breakdown,
        champPick:    kBets ? kBets['final'] : null,
        betsLocked:   !!profile.betsLocked,
      });
    }));

    users.sort(rankSort);
    send(res, 'progress', { pct: 75 });

    // Distribuição de palpites do campeão
    const champPicksMap = {};
    for (const u of users) {
      if (u.champPick) champPicksMap[u.champPick] = (champPicksMap[u.champPick] || 0) + 1;
    }
    const champPicksSorted = Object.entries(champPicksMap)
      .map(([id, count]) => ({ id, name: TEAMS[id]?.name ?? id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Histograma de pontos
    const pts_all   = users.map(u => u.pts);
    const maxPts    = Math.max(...pts_all, 1);
    const bucket    = Math.max(5, Math.ceil(maxPts / 8));
    const numBuckets = Math.ceil((maxPts + 1) / bucket);
    const histogram = Array.from({ length: numBuckets }, (_, i) => ({
      label: `${i * bucket}–${(i + 1) * bucket - 1}`,
      count: pts_all.filter(p => p >= i * bucket && p < (i + 1) * bucket).length,
    }));

    // Stats gerais
    const totalPts = pts_all.reduce((s, p) => s + p, 0);
    const stats = {
      totalUsers:     users.length,
      testUsers:      users.filter(u => u.isTest).length,
      realUsers:      users.filter(u => !u.isTest).length,
      avgPts:         users.length > 0 ? Math.round(totalPts / users.length * 10) / 10 : 0,
      maxPts,
      lockedUsers:    users.filter(u => u.betsLocked).length,
      fullGroupUsers: users.filter(u => u.groupPct === 100).length,
      hasResults,
      champion,
      champName,
      totalGameResults,
    };

    send(res, 'progress', { pct: 100 });
    send(res, 'log', { msg: '✅ Relatório gerado com sucesso', level: 'ok' });
    send(res, 'done', { stats, users, champPicksSorted, histogram });
  } catch(e) {
    send(res, 'error', { msg: e.message });
  }
  res.end();
}

// ================================================================
// AUDIT HANDLER
// Roda uma bateria de verificações e retorna resultado de cada uma
// ================================================================
async function handleAudit(res) {
  sseHeaders(res);
  send(res, 'log', { msg: '🔍 Iniciando auditoria completa…', level: 'info' });

  const checks = [];
  function check(id, label, status, detail = '') {
    checks.push({ id, label, status, detail });
    send(res, 'audit_check', { id, label, status, detail });
    send(res, 'log', {
      msg: `  [${status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌'}] ${label}${detail ? ': ' + detail : ''}`,
      level: status === 'ok' ? 'ok' : status === 'warn' ? 'warn' : 'err',
    });
  }

  // ── 1. Conexão com Firebase ──────────────────────────────────
  try {
    await db.collection('_audit').doc('_ping').get();
    check('firebase_conn', 'Conexão com Firebase', 'ok', `Projeto: ${serviceAccount.project_id}`);
  } catch(e) {
    check('firebase_conn', 'Conexão com Firebase', 'fail', e.message);
  }

  // ── 2. Documento results/groupStage ─────────────────────────
  let groupResults = null;
  try {
    const snap = await db.collection('results').doc('groupStage').get();
    if (!snap.exists) {
      check('results_gs_exists', 'Resultados de grupos (existe)', 'fail', 'Documento não existe — execute o Seed');
    } else {
      groupResults = snap.data();
      const count = Object.keys(groupResults).length;
      if (count === 72)       check('results_gs_exists', 'Resultados de grupos (existe)', 'ok', `72/72 jogos`);
      else if (count > 0)     check('results_gs_exists', 'Resultados de grupos (existe)', 'warn', `${count}/72 jogos — incompleto`);
      else                    check('results_gs_exists', 'Resultados de grupos (existe)', 'fail', 'Documento vazio');
    }
  } catch(e) { check('results_gs_exists', 'Resultados de grupos (existe)', 'fail', e.message); }

  // ── 3. Completude dos resultados de grupos ───────────────────
  if (groupResults) {
    const allGames = Object.keys(GROUPS).flatMap(g => generateGroupGames(g).map(m => m.id));
    const missing  = allGames.filter(id => !groupResults[id]);
    if (missing.length === 0) check('results_gs_complete', 'Resultados de grupos (completo)', 'ok', 'Todos os 72 IDs presentes');
    else check('results_gs_complete', 'Resultados de grupos (completo)', 'warn', `Faltando: ${missing.slice(0,5).join(', ')}${missing.length > 5 ? '…' : ''}`);
  }

  // ── 4. Documento results/knockout ────────────────────────────
  let koResults = null;
  const expectedKoIds = [
    ...KNOCKOUT_SLOTS.map(s => s.id),
    ...KNOCKOUT_ROUNDS.flatMap(r => r.matches.map(m => m.id)),
  ];
  try {
    const snap = await db.collection('results').doc('knockout').get();
    if (!snap.exists) {
      check('results_ko', 'Resultados mata-mata', 'fail', 'Documento não existe');
    } else {
      koResults = snap.data();
      const count = Object.keys(koResults).length;
      if (count === expectedKoIds.length) check('results_ko', 'Resultados mata-mata', 'ok', `${count}/${expectedKoIds.length} confrontos`);
      else check('results_ko', 'Resultados mata-mata', 'warn', `${count}/${expectedKoIds.length} confrontos`);
    }
  } catch(e) { check('results_ko', 'Resultados mata-mata', 'fail', e.message); }

  // ── 5. Usuários no Firestore ─────────────────────────────────
  let profiles = [];
  try {
    const snap = await db.collectionGroup('profile').get();
    profiles = snap.docs.map(d => ({ uid: d.ref.parent.parent.id, ...d.data() }));
    check('users_count', `Usuários cadastrados`, 'ok', `${profiles.length} usuário(s) encontrado(s)`);
  } catch(e) { check('users_count', 'Usuários cadastrados', 'fail', e.message); }

  // ── 6. Consistência palpites de grupos ───────────────────────
  if (profiles.length > 0) {
    let noBets = 0, incomplete = 0;
    for (const p of profiles) {
      try {
        const snap = await db.collection('users').doc(p.uid).collection('bets').doc('groupStage').get();
        if (!snap.exists || Object.keys(snap.data() || {}).length === 0) noBets++;
        else if (Object.keys(snap.data()).length < 72) incomplete++;
      } catch(e) { noBets++; }
    }
    if (noBets === 0 && incomplete === 0) {
      check('bets_gs', 'Palpites de grupos', 'ok', `Todos os ${profiles.length} usuários têm 72 palpites`);
    } else {
      const parts = [];
      if (noBets > 0)    parts.push(`${noBets} sem palpites`);
      if (incomplete > 0) parts.push(`${incomplete} incompletos (<72)`);
      check('bets_gs', 'Palpites de grupos', 'warn', parts.join(', '));
    }
  }

  // ── 7. Consistência palpites de mata-mata ────────────────────
  if (profiles.length > 0) {
    let noBets = 0;
    for (const p of profiles) {
      try {
        const snap = await db.collection('users').doc(p.uid).collection('bets').doc('knockout').get();
        if (!snap.exists || Object.keys(snap.data() || {}).length === 0) noBets++;
      } catch(e) { noBets++; }
    }
    if (noBets === 0) check('bets_ko', 'Palpites de mata-mata', 'ok', `Todos os ${profiles.length} usuários têm palpites KO`);
    else check('bets_ko', 'Palpites de mata-mata', 'warn', `${noBets}/${profiles.length} sem palpites de mata-mata`);
  }

  // ── 8. Documento ranking/current ────────────────────────────
  try {
    const snap = await db.collection('ranking').doc('current').get();
    if (!snap.exists) {
      check('ranking_doc', 'Ranking gravado', 'fail', 'Documento não existe — execute Recalcular');
    } else {
      const entries = snap.data().entries || [];
      if (entries.length === profiles.length) {
        check('ranking_doc', 'Ranking gravado', 'ok', `${entries.length} entradas (igual ao nº de usuários)`);
      } else {
        check('ranking_doc', 'Ranking gravado', 'warn',
          `${entries.length} no ranking vs ${profiles.length} usuários — execute Recalcular`);
      }
    }
  } catch(e) { check('ranking_doc', 'Ranking gravado', 'fail', e.message); }

  // ── 9. Teste unitário: placar exato ──────────────────────────
  {
    const gB = { 'A_0': { homeGoals: '2', awayGoals: '1' } };
    const gR = { 'A_0': { homeGoals: 2,   awayGoals: 1   } };
    const kB = {};
    const kR = {};
    const { pts, breakdown } = calcScore(gB, kB, gR, kR);
    const ok = pts === SCORING.exactScore && breakdown.exact === 1 && breakdown.result === 0;
    check('unit_exact', 'Teste: placar exato (2-1 vs 2-1)', ok ? 'ok' : 'fail',
      ok ? `+${pts} pts ✓` : `Esperado ${SCORING.exactScore} pts, obteve ${pts}`);
  }

  // ── 10. Teste unitário: resultado correto (não exato) ────────
  {
    const gB = { 'A_0': { homeGoals: '3', awayGoals: '0' } };
    const gR = { 'A_0': { homeGoals: 2,   awayGoals: 1   } };
    const { pts, breakdown } = calcScore(gB, {}, gR, {});
    const ok = pts === SCORING.correctResult && breakdown.result === 1 && breakdown.exact === 0;
    check('unit_result', 'Teste: resultado certo (3-0 vs 2-1)', ok ? 'ok' : 'fail',
      ok ? `+${pts} pt ✓` : `Esperado ${SCORING.correctResult} pt, obteve ${pts}`);
  }

  // ── 11. Teste unitário: empate correto ───────────────────────
  {
    const gB = { 'A_0': { homeGoals: '2', awayGoals: '2' } };
    const gR = { 'A_0': { homeGoals: 0,   awayGoals: 0   } };
    const { pts } = calcScore(gB, {}, gR, {});
    const ok = pts === SCORING.correctResult;
    check('unit_draw', 'Teste: empate certo (2-2 vs 0-0)', ok ? 'ok' : 'fail',
      ok ? `+${pts} pt ✓` : `Esperado ${SCORING.correctResult} pt, obteve ${pts}`);
  }

  // ── 12. Teste unitário: campeão correto ──────────────────────
  {
    const kB = { 'r32_01': 'brazil', 'r16_01': 'brazil', 'qf_01': 'brazil', 'sf_01': 'brazil', 'final': 'brazil' };
    const kR = { 'r32_01': 'brazil', 'r16_01': 'brazil', 'qf_01': 'brazil', 'sf_01': 'brazil', 'final': 'brazil' };
    const { pts, breakdown } = calcScore({}, kB, {}, kR);
    const expectedPts = 5 * SCORING.knockoutWinner + SCORING.championBonus;
    const ok = pts === expectedPts && breakdown.bonus === SCORING.championBonus;
    check('unit_champion', `Teste: campeão + 5 acertos KO`, ok ? 'ok' : 'fail',
      ok ? `+${pts} pts ✓` : `Esperado ${expectedPts} pts, obteve ${pts}`);
  }

  // ── 13. Teste de desempate ────────────────────────────────────
  {
    const r1 = { name: 'A', pts: 10, breakdown: { exact: 2, result: 4, ko: 0, bonus: 0 } };
    const r2 = { name: 'B', pts: 10, breakdown: { exact: 1, result: 6, ko: 0, bonus: 0 } };
    const sorted = [r2, r1].sort(rankSort);
    const ok = sorted[0].name === 'A'; // r1 tem mais exatos → deve vir primeiro
    check('unit_tiebreak', 'Teste: desempate por placares exatos', ok ? 'ok' : 'fail',
      ok ? 'Mais exatos vence com pontos iguais ✓' : 'Desempate incorreto');
  }

  // ── 14. Teste de desempate alfabético ─────────────────────────
  {
    const r1 = { name: 'Ana', pts: 5, breakdown: { exact: 1, result: 0, ko: 0, bonus: 0 } };
    const r2 = { name: 'Zeca', pts: 5, breakdown: { exact: 1, result: 0, ko: 0, bonus: 0 } };
    const sorted = [r2, r1].sort(rankSort);
    const ok = sorted[0].name === 'Ana';
    check('unit_alpha', 'Teste: desempate alfabético (Ana < Zeca)', ok ? 'ok' : 'fail',
      ok ? 'Ordem alfabética correta ✓' : 'Ordem alfabética incorreta');
  }

  const summary = {
    total: checks.length,
    ok:    checks.filter(c => c.status === 'ok').length,
    warn:  checks.filter(c => c.status === 'warn').length,
    fail:  checks.filter(c => c.status === 'fail').length,
  };

  send(res, 'progress', { pct: 100 });
  send(res, 'log', {
    msg: `📋 Auditoria concluída: ${summary.ok} ok · ${summary.warn} avisos · ${summary.fail} falhas`,
    level: summary.fail > 0 ? 'err' : summary.warn > 0 ? 'warn' : 'ok',
  });
  send(res, 'done', { checks, summary });
  res.end();
}

// ================================================================
// HTTP SERVER
// ================================================================
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/api/seed'   && req.method === 'GET') { handleSeed(res);          return; }
  if (req.url === '/api/clear'  && req.method === 'GET') { handleClear(res);         return; }
  if (req.url === '/api/recalc' && req.method === 'GET') { handleRecalcRanking(res); return; }
  if (req.url === '/api/report' && req.method === 'GET') { handleReport(res);        return; }
  if (req.url === '/api/audit'  && req.method === 'GET') { handleAudit(res);         return; }

  if (req.url === '/api/ping' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, project: serviceAccount.project_id }));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║   🧪  Seed Server — Bolão Copa 2026          ║`);
  console.log(`╚══════════════════════════════════════════════╝`);
  console.log(`\n  ✅  Servidor rodando em http://localhost:${PORT}`);
  console.log(`  🔗  Endpoints:`);
  console.log(`       /api/ping    — verifica conexão`);
  console.log(`       /api/seed    — cria 10 usuários + simula resultados`);
  console.log(`       /api/clear   — limpa dados de teste`);
  console.log(`       /api/recalc  — recalcula ranking de todos os usuários`);
  console.log(`       /api/report  — gera relatório completo`);
  console.log(`       /api/audit   — auditoria e testes unitários`);
  console.log(`\n  📄  Abra http://127.0.0.1:5500/test-seed.html`);
  console.log(`\n  Ctrl+C para encerrar\n`);
});
