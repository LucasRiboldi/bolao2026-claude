#!/usr/bin/env node
// ================================================================
// seed.js — Seed de teste para o Bolão Copa 2026
// Usa Firebase Admin SDK (bypassa todas as regras do Firestore)
// Uso: node seed.js [--clear]
// ================================================================

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const auth = admin.auth();
const db   = admin.firestore();

// ================================================================
// CONFIGURAÇÃO
// ================================================================
const NUM_USERS   = 10;
const TEST_DOMAIN = 'teste.com.br';
const TEST_PASS   = '123456';
const TEST_NAMES  = [
  'Teste Alpha','Teste Bravo','Teste Charlie','Teste Delta','Teste Echo',
  'Teste Foxtrot','Teste Golf','Teste Hotel','Teste India','Teste Juliet',
];

// ================================================================
// DADOS DA COMPETIÇÃO (espelho de data.js)
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
// HELPERS DE SIMULAÇÃO
// ================================================================
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function randomGoals() {
  const pool = [0,0,0,1,1,1,1,1,2,2,2,2,2,2,3,3,3,4,4,5];
  return pool[randInt(0, pool.length - 1)];
}

function generateGroupGames(gId) {
  const [t0, t1, t2, t3] = GROUPS[gId];
  return [
    { id: `${gId}_0`, home: t0, away: t1 },
    { id: `${gId}_1`, home: t2, away: t3 },
    { id: `${gId}_2`, home: t0, away: t2 },
    { id: `${gId}_3`, home: t1, away: t3 },
    { id: `${gId}_4`, home: t0, away: t3 },
    { id: `${gId}_5`, home: t1, away: t2 },
  ];
}

function calcGroupStandings(groupBets) {
  const standings = {};
  for (const gId of Object.keys(GROUPS)) {
    const table = {};
    for (const t of GROUPS[gId]) {
      table[t] = { id: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 };
    }
    for (const game of generateGroupGames(gId)) {
      const bet = groupBets[game.id];
      if (!bet || bet.homeGoals === '' || bet.awayGoals === '') continue;
      const hg = parseInt(bet.homeGoals, 10);
      const ag = parseInt(bet.awayGoals, 10);
      if (isNaN(hg) || isNaN(ag)) continue;
      const h = table[game.home], a = table[game.away];
      h.gf += hg; h.ga += ag; h.played++;
      a.gf += ag; a.ga += hg; a.played++;
      if (hg > ag) { h.pts += 3; }
      else if (hg === ag) { h.pts += 1; a.pts += 1; }
      else { a.pts += 3; }
      h.gd = h.gf - h.ga;
      a.gd = a.gf - a.ga;
    }
    standings[gId] = Object.values(table).sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    );
  }
  return standings;
}

function getQualified(standings) {
  const winners = {}, runners = {}, thirds = [];
  for (const [gId, table] of Object.entries(standings)) {
    winners[gId] = table[0]?.id;
    runners[gId] = table[1]?.id;
    if (table[2]) thirds.push({ ...table[2], group: gId });
  }
  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  return { winners, runners, thirds: thirds.slice(0, 8) };
}

function resolveSlot(slot, qualified) {
  const pos = slot[0];
  if (pos === '1') return qualified.winners[slot[1]];
  if (pos === '2') return qualified.runners[slot[1]];
  if (pos === 'T') return qualified.thirds[parseInt(slot.split('_')[1], 10) - 1]?.id;
}

function buildR32(qualified) {
  return KNOCKOUT_SLOTS.map(s => ({
    id: s.id,
    home: resolveSlot(s.homeSlot, qualified),
    away: resolveSlot(s.awaySlot, qualified),
  }));
}

function resolveKnockoutRound(roundMatches, koBets) {
  return roundMatches.map(m => {
    const resolve = (ref) => ref.startsWith('W:') ? (koBets[ref.slice(2)] || null) : ref;
    return { id: m.id, home: resolve(m.home), away: resolve(m.away) };
  });
}

function calcScore(groupBets, knockoutBets, realGroupResults, realKoResults) {
  let pts = 0;
  const breakdown = { exact: 0, result: 0, ko: 0, bonus: 0 };

  for (const [gameId, result] of Object.entries(realGroupResults)) {
    const bet = groupBets[gameId];
    if (!bet) continue;
    const bH = parseInt(bet.homeGoals, 10), bA = parseInt(bet.awayGoals, 10);
    const rH = parseInt(result.homeGoals, 10), rA = parseInt(result.awayGoals, 10);
    if (isNaN(bH) || isNaN(bA) || isNaN(rH) || isNaN(rA)) continue;
    if (bH === rH && bA === rA) { pts += SCORING.exactScore; breakdown.exact++; }
    else if (Math.sign(bH - bA) === Math.sign(rH - rA)) { pts += SCORING.correctResult; breakdown.result++; }
  }
  for (const [matchId, winnerId] of Object.entries(realKoResults)) {
    if (knockoutBets[matchId] === winnerId) { pts += SCORING.knockoutWinner; breakdown.ko++; }
  }
  const champion = realKoResults['final'];
  if (champion && knockoutBets['final'] === champion) {
    pts += SCORING.championBonus;
    breakdown.bonus = SCORING.championBonus;
  }
  return { pts, breakdown };
}

// ================================================================
// GERAÇÃO DE DADOS ALEATÓRIOS
// ================================================================
function randomGroupBets() {
  const bets = {};
  for (const gId of Object.keys(GROUPS)) {
    for (const game of generateGroupGames(gId)) {
      bets[game.id] = { homeGoals: String(randomGoals()), awayGoals: String(randomGoals()) };
    }
  }
  return bets;
}

function randomKnockoutBets(r32) {
  const bets = {};
  for (const match of r32) {
    if (!match.home || !match.away) continue;
    bets[match.id] = pick([match.home, match.away]);
  }
  for (const round of KNOCKOUT_ROUNDS) {
    const resolved = resolveKnockoutRound(round.matches, bets);
    for (const match of resolved) {
      if (!match.home || !match.away) continue;
      bets[match.id] = pick([match.home, match.away]);
    }
  }
  return bets;
}

// Simula resultado REAL da competição (um conjunto fixo para todos os usuários)
function simulateRealResults() {
  const groupResults = randomGroupBets(); // mesma estrutura, resultados aleatórios
  const standings    = calcGroupStandings(groupResults);
  const qualified    = getQualified(standings);
  const r32          = buildR32(qualified);

  const koResults = {}, allPicks = {};
  for (const match of r32) {
    if (!match.home || !match.away) continue;
    const w = pick([match.home, match.away]);
    koResults[match.id] = w;
    allPicks[match.id]  = w;
  }
  for (const round of KNOCKOUT_ROUNDS) {
    const resolved = resolveKnockoutRound(round.matches, allPicks);
    for (const match of resolved) {
      if (!match.home || !match.away) continue;
      const w = pick([match.home, match.away]);
      koResults[match.id] = w;
      allPicks[match.id]  = w;
    }
  }
  return { groupResults, koResults, r32, qualified };
}

// ================================================================
// FIREBASE AUTH — criar ou recuperar usuário
// ================================================================
async function getOrCreateUser(email, displayName) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { displayName });
    return user.uid;
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const user = await auth.createUser({ email, password: TEST_PASS, displayName });
      return user.uid;
    }
    throw e;
  }
}

// ================================================================
// LOG COLORIDO
// ================================================================
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  red: '\x1b[31m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
function log(msg, color = C.reset) { console.log(`${color}${msg}${C.reset}`); }
function ok(msg)   { log(`  ✅ ${msg}`, C.green);  }
function err(msg)  { log(`  ❌ ${msg}`, C.red);    }
function info(msg) { log(`  ℹ  ${msg}`, C.blue);   }
function warn(msg) { log(`  ⚠  ${msg}`, C.yellow); }
function step(msg) { log(`\n${C.bold}${C.cyan}▶ ${msg}${C.reset}`); }

// ================================================================
// MODO --clear : apaga todos os dados de teste
// ================================================================
async function clearSeed() {
  step('Limpando dados de teste do Firestore…');

  for (let i = 1; i <= NUM_USERS; i++) {
    const email = `teste${i}@${TEST_DOMAIN}`;
    try {
      const user = await auth.getUserByEmail(email);
      // Apaga subcollections conhecidas
      const ref = db.collection('users').doc(user.uid);
      await ref.collection('bets').doc('groupStage').delete().catch(() => {});
      await ref.collection('bets').doc('knockout').delete().catch(() => {});
      await ref.collection('profile').doc('info').delete().catch(() => {});
      await auth.deleteUser(user.uid);
      ok(`Usuário ${email} removido`);
    } catch (e) {
      if (e.code !== 'auth/user-not-found') err(`${email}: ${e.message}`);
      else info(`${email} não existe, pulando`);
    }
  }

  await db.collection('results').doc('groupStage').delete().catch(() => {});
  await db.collection('results').doc('knockout').delete().catch(() => {});
  await db.collection('ranking').doc('current').delete().catch(() => {});
  ok('results/* e ranking/* removidos');

  log('\n✅ Limpeza concluída.', C.green);
}

// ================================================================
// SEED PRINCIPAL
// ================================================================
async function runSeed() {
  log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════╗`);
  log(`║   🧪  Seed de Teste — Bolão Copa 2026       ║`);
  log(`╚══════════════════════════════════════════════╝${C.reset}\n`);

  // ---- 1. Simular resultados reais ------------------------------------
  step('Simulando resultados reais da competição…');
  const { groupResults: realGroup, koResults: realKo, r32, qualified } = simulateRealResults();
  const champion = realKo['final'];
  const cName    = TEAMS[champion]?.name ?? champion;

  ok(`72 jogos de grupo simulados`);
  ok(`${Object.keys(realKo).length} confrontos do mata-mata simulados`);
  warn(`Campeão simulado: ${cName}`);

  // ---- 2. Gravar resultados no Firestore (Admin bypassa as rules) -----
  step('Gravando resultados reais no Firestore…');
  await db.collection('results').doc('groupStage').set(realGroup);
  await db.collection('results').doc('knockout').set(realKo);
  ok('results/groupStage e results/knockout gravados');

  // ---- 3. Criar usuários e palpites -----------------------------------
  step(`Criando ${NUM_USERS} usuários de teste…`);
  const ranking = [];

  for (let i = 1; i <= NUM_USERS; i++) {
    const email = `teste${i}@${TEST_DOMAIN}`;
    const name  = TEST_NAMES[i - 1];

    try {
      info(`[${i}/${NUM_USERS}] ${name} (${email})…`);

      const uid = await getOrCreateUser(email, name);

      // Perfil
      await db.collection('users').doc(uid)
        .collection('profile').doc('info')
        .set({ name, email, seededAt: new Date().toISOString() });

      // Palpites de grupo (aleatórios para cada usuário)
      const groupBets = randomGroupBets();
      await db.collection('users').doc(uid)
        .collection('bets').doc('groupStage')
        .set(groupBets);

      // Palpites de mata-mata (baseados nos classificados reais simulados)
      const koBets = randomKnockoutBets(r32);
      await db.collection('users').doc(uid)
        .collection('bets').doc('knockout')
        .set(koBets);

      // Calcular pontuação
      const { pts, breakdown } = calcScore(groupBets, koBets, realGroup, realKo);
      ranking.push({ uid, name, email, pts, breakdown });

      const champHit = breakdown.bonus > 0 ? ' 🏆 ACERTOU O CAMPEÃO!' : '';
      ok(`${name}: ${pts} pts  (exatos=${breakdown.exact} result=${breakdown.result} ko=${breakdown.ko})${champHit}`);

    } catch (e) {
      err(`${name}: ${e.message}`);
    }
  }

  // ---- 4. Ordenar e gravar ranking ------------------------------------
  step('Calculando ranking final…');
  ranking.sort((a, b) => b.pts - a.pts);

  const rankingForFirestore = ranking.map(({ uid, name, pts, breakdown }) => ({ uid, name, pts, breakdown }));
  await db.collection('ranking').doc('current').set({ entries: rankingForFirestore });
  ok(`Ranking gravado com ${rankingForFirestore.length} entradas`);

  // ---- 5. Exibir tabela -----------------------------------------------
  log(`\n${C.bold}${'─'.repeat(72)}`);
  log(`  🏆  RANKING FINAL  (Campeão simulado: ${cName})`);
  log(`${'─'.repeat(72)}${C.reset}`);

  const medals = ['🥇','🥈','🥉'];
  ranking.forEach((e, i) => {
    const pos   = medals[i] ?? `${i + 1}º `;
    const bar   = e.breakdown.bonus > 0 ? ` ★ bônus +${e.breakdown.bonus}` : '';
    const line  = `${pos}  ${e.name.padEnd(18)} ${String(e.pts).padStart(3)} pts` +
                  `   exatos=${e.breakdown.exact}  result=${e.breakdown.result}  ko=${e.breakdown.ko}${bar}`;
    const color = i === 0 ? C.yellow : i === 1 ? '\x1b[37m' : i === 2 ? '\x1b[33m' : C.reset;
    log(`  ${line}`, color);
  });

  log(`\n${C.bold}${C.green}✅ Seed concluído! Abra o app e verifique o Ranking.${C.reset}\n`);
  log(`${C.gray}  Usuários: teste1@${TEST_DOMAIN} … teste${NUM_USERS}@${TEST_DOMAIN}  |  Senha: ${TEST_PASS}${C.reset}\n`);
}

// ================================================================
// ENTRY POINT
// ================================================================
(async () => {
  const isClear = process.argv.includes('--clear');
  try {
    if (isClear) await clearSeed();
    else         await runSeed();
  } catch (e) {
    console.error('\n❌ Erro fatal:', e.message);
    process.exit(1);
  }
  process.exit(0);
})();
