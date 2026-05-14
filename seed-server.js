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

    // Grava resultados reais
    send(res, 'log', { msg: '💾 Gravando resultados no Firestore…', level: 'info' });
    await db.collection('results').doc('groupStage').set(groupResults);
    await db.collection('results').doc('knockout').set(koResults);
    send(res, 'log', { msg: '✅ Resultados gravados', level: 'ok' });
    send(res, 'progress', { pct: 10 });

    const ranking = [];

    for (let i = 1; i <= NUM_USERS; i++) {
      const email = `teste${i}@${TEST_DOMAIN}`;
      const name  = TEST_NAMES[i - 1];
      const pct   = 10 + Math.round((i / NUM_USERS) * 80);

      send(res, 'user_start', { index: i, name, email });
      send(res, 'log', { msg: `👤 [${i}/${NUM_USERS}] ${name}…`, level: 'info' });

      try {
        const uid = await getOrCreateUser(email, name);

        await db.collection('users').doc(uid)
          .collection('profile').doc('info')
          .set({ name, email, seededAt: new Date().toISOString() });

        const gBets = randomGroupBets();
        await db.collection('users').doc(uid)
          .collection('bets').doc('groupStage').set(gBets);

        const kBets = randomKnockoutBets(r32);
        await db.collection('users').doc(uid)
          .collection('bets').doc('knockout').set(kBets);

        const { pts, breakdown } = calcScore(gBets, kBets, groupResults, koResults);
        ranking.push({ uid, name, email, pts, breakdown });

        const champHit = breakdown.bonus > 0 ? ' 🏆 ACERTOU!' : '';
        send(res, 'user_done', { index: i, uid, pts, breakdown });
        send(res, 'log', { msg: `   ✅ ${name}: ${pts} pts (exatos=${breakdown.exact} result=${breakdown.result} ko=${breakdown.ko}${champHit})`, level: 'ok' });
      } catch(e) {
        send(res, 'user_err', { index: i, msg: e.message });
        send(res, 'log', { msg: `   ❌ ${name}: ${e.message}`, level: 'err' });
      }
      send(res, 'progress', { pct });
    }

    // Grava ranking
    send(res, 'log', { msg: '📊 Gravando ranking…', level: 'info' });
    ranking.sort((a, b) => b.pts - a.pts);
    const forFirestore = ranking.map(({ uid, name, pts, breakdown }) => ({ uid, name, pts, breakdown }));
    await db.collection('ranking').doc('current').set({ entries: forFirestore });

    send(res, 'progress', { pct: 100 });
    send(res, 'log', { msg: `✅ Ranking gravado com ${forFirestore.length} entradas`, level: 'ok' });
    send(res, 'done', { ranking });

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
// HTTP SERVER
// ================================================================
const server = http.createServer((req, res) => {
  // CORS para qualquer origem local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.url === '/api/seed'  && req.method === 'GET') { handleSeed(res);  return; }
  if (req.url === '/api/clear' && req.method === 'GET') { handleClear(res); return; }
  if (req.url === '/api/ping'  && req.method === 'GET') {
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
  console.log(`  📄  Abra http://127.0.0.1:5500/test-seed.html`);
  console.log(`\n  Ctrl+C para encerrar\n`);
});
