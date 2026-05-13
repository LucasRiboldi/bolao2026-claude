// ============================================================
// data.js — Static data: teams, groups, fixtures, bracket
// Official FIFA World Cup 2026 draw (December 5 2025)
// ============================================================

const SCORING = {
  exactScore:     3,
  correctResult:  1,
  knockoutWinner: 2,
  championBonus:  5,
};

// ---- 48 teams -----------------------------------------------
const TEAMS = {
  // GROUP A
  'mexico':      { name: 'México',           short: 'MEX', flag: '🇲🇽' },
  'southafrica': { name: 'África do Sul',    short: 'RSA', flag: '🇿🇦' },
  'southkorea':  { name: 'Coreia do Sul',    short: 'KOR', flag: '🇰🇷' },
  'czechia':     { name: 'Tchéquia',         short: 'CZE', flag: '🇨🇿' },
  // GROUP B
  'canada':      { name: 'Canadá',           short: 'CAN', flag: '🇨🇦' },
  'switzerland': { name: 'Suíça',            short: 'SUI', flag: '🇨🇭' },
  'qatar':       { name: 'Catar',            short: 'QAT', flag: '🇶🇦' },
  'bosnia':      { name: 'Bósnia e Herz.',   short: 'BIH', flag: '🇧🇦' },
  // GROUP C
  'brazil':      { name: 'Brasil',           short: 'BRA', flag: '🇧🇷' },
  'morocco':     { name: 'Marrocos',         short: 'MAR', flag: '🇲🇦' },
  'haiti':       { name: 'Haiti',            short: 'HAI', flag: '🇭🇹' },
  'scotland':    { name: 'Escócia',          short: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  // GROUP D
  'usa':         { name: 'Estados Unidos',   short: 'USA', flag: '🇺🇸' },
  'paraguay':    { name: 'Paraguai',         short: 'PAR', flag: '🇵🇾' },
  'australia':   { name: 'Austrália',        short: 'AUS', flag: '🇦🇺' },
  'turkey':      { name: 'Turquia',          short: 'TUR', flag: '🇹🇷' },
  // GROUP E
  'germany':     { name: 'Alemanha',         short: 'GER', flag: '🇩🇪' },
  'curacao':     { name: 'Curaçao',          short: 'CUW', flag: '🇨🇼' },
  'ivorycoast':  { name: 'Costa do Marfim',  short: 'CIV', flag: '🇨🇮' },
  'ecuador':     { name: 'Equador',          short: 'ECU', flag: '🇪🇨' },
  // GROUP F
  'netherlands': { name: 'Holanda',          short: 'NED', flag: '🇳🇱' },
  'japan':       { name: 'Japão',            short: 'JPN', flag: '🇯🇵' },
  'tunisia':     { name: 'Tunísia',          short: 'TUN', flag: '🇹🇳' },
  'sweden':      { name: 'Suécia',           short: 'SWE', flag: '🇸🇪' },
  // GROUP G
  'belgium':     { name: 'Bélgica',          short: 'BEL', flag: '🇧🇪' },
  'egypt':       { name: 'Egito',            short: 'EGY', flag: '🇪🇬' },
  'iran':        { name: 'Irã',              short: 'IRN', flag: '🇮🇷' },
  'newzealand':  { name: 'Nova Zelândia',    short: 'NZL', flag: '🇳🇿' },
  // GROUP H
  'spain':       { name: 'Espanha',          short: 'ESP', flag: '🇪🇸' },
  'capeverde':   { name: 'Cabo Verde',       short: 'CPV', flag: '🇨🇻' },
  'saudiarabia': { name: 'Arábia Saudita',   short: 'KSA', flag: '🇸🇦' },
  'uruguay':     { name: 'Uruguai',          short: 'URU', flag: '🇺🇾' },
  // GROUP I
  'france':      { name: 'França',           short: 'FRA', flag: '🇫🇷' },
  'senegal':     { name: 'Senegal',          short: 'SEN', flag: '🇸🇳' },
  'norway':      { name: 'Noruega',          short: 'NOR', flag: '🇳🇴' },
  'iraq':        { name: 'Iraque',           short: 'IRQ', flag: '🇮🇶' },
  // GROUP J
  'argentina':   { name: 'Argentina',        short: 'ARG', flag: '🇦🇷' },
  'algeria':     { name: 'Argélia',          short: 'ALG', flag: '🇩🇿' },
  'austria':     { name: 'Áustria',          short: 'AUT', flag: '🇦🇹' },
  'jordan':      { name: 'Jordânia',         short: 'JOR', flag: '🇯🇴' },
  // GROUP K
  'portugal':    { name: 'Portugal',         short: 'POR', flag: '🇵🇹' },
  'uzbekistan':  { name: 'Uzbequistão',      short: 'UZB', flag: '🇺🇿' },
  'colombia':    { name: 'Colômbia',         short: 'COL', flag: '🇨🇴' },
  'drcongo':     { name: 'RD Congo',         short: 'COD', flag: '🇨🇩' },
  // GROUP L
  'england':     { name: 'Inglaterra',       short: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'croatia':     { name: 'Croácia',          short: 'CRO', flag: '🇭🇷' },
  'ghana':       { name: 'Gana',             short: 'GHA', flag: '🇬🇭' },
  'panama':      { name: 'Panamá',           short: 'PAN', flag: '🇵🇦' },
};

// ---- 12 groups ----------------------------------------------
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

// ---- Generate 6 round-robin games per group -----------------
// Standard schedule: [t0 vs t1], [t2 vs t3], [t0 vs t2], [t1 vs t3], [t0 vs t3], [t1 vs t2]
function generateGroupGames(groupId) {
  const [t0, t1, t2, t3] = GROUPS[groupId];
  return [
    { id: `${groupId}_0`, home: t0, away: t1, round: 1 },
    { id: `${groupId}_1`, home: t2, away: t3, round: 1 },
    { id: `${groupId}_2`, home: t0, away: t2, round: 2 },
    { id: `${groupId}_3`, home: t1, away: t3, round: 2 },
    { id: `${groupId}_4`, home: t0, away: t3, round: 3 },
    { id: `${groupId}_5`, home: t1, away: t2, round: 3 },
  ];
}

// ---- All 72 group games keyed by id -------------------------
const ALL_GROUP_GAMES = {};
for (const gId of Object.keys(GROUPS)) {
  for (const game of generateGroupGames(gId)) {
    ALL_GROUP_GAMES[game.id] = game;
  }
}

// ---- Knockout bracket definition (R32 → Final) --------------
// Each slot references which group position fills it.
// Third-place slots (T3_1..T3_8) are filled by best-8 thirds sorted pts/GD/GF.
const KNOCKOUT_SLOTS = [
  // Round of 32 (16 matches)
  { id: 'r32_01', homeSlot: '1A', awaySlot: '2F' },
  { id: 'r32_02', homeSlot: '2A', awaySlot: '1B' },
  { id: 'r32_03', homeSlot: '1C', awaySlot: '2D' },
  { id: 'r32_04', homeSlot: '2C', awaySlot: '1D' },
  { id: 'r32_05', homeSlot: '1E', awaySlot: '2J' },
  { id: 'r32_06', homeSlot: '2E', awaySlot: '1F' },
  { id: 'r32_07', homeSlot: '1G', awaySlot: '2H' },
  { id: 'r32_08', homeSlot: '2G', awaySlot: '1H' },
  { id: 'r32_09', homeSlot: '1I', awaySlot: '2L' },
  { id: 'r32_10', homeSlot: '2I', awaySlot: '1J' },
  { id: 'r32_11', homeSlot: '1K', awaySlot: '2B' },
  { id: 'r32_12', homeSlot: '2K', awaySlot: '1L' },
  { id: 'r32_13', homeSlot: 'T3_1', awaySlot: 'T3_2' },
  { id: 'r32_14', homeSlot: 'T3_3', awaySlot: 'T3_4' },
  { id: 'r32_15', homeSlot: 'T3_5', awaySlot: 'T3_6' },
  { id: 'r32_16', homeSlot: 'T3_7', awaySlot: 'T3_8' },
];

// R16 through Final: each match references the winner of two prior matches
const KNOCKOUT_ROUNDS = [
  {
    name: 'Oitavas',
    matches: [
      { id: 'r16_01', home: 'W:r32_01', away: 'W:r32_02' },
      { id: 'r16_02', home: 'W:r32_03', away: 'W:r32_04' },
      { id: 'r16_03', home: 'W:r32_05', away: 'W:r32_06' },
      { id: 'r16_04', home: 'W:r32_07', away: 'W:r32_08' },
      { id: 'r16_05', home: 'W:r32_09', away: 'W:r32_10' },
      { id: 'r16_06', home: 'W:r32_11', away: 'W:r32_12' },
      { id: 'r16_07', home: 'W:r32_13', away: 'W:r32_14' },
      { id: 'r16_08', home: 'W:r32_15', away: 'W:r32_16' },
    ],
  },
  {
    name: 'Quartas',
    matches: [
      { id: 'qf_01', home: 'W:r16_01', away: 'W:r16_02' },
      { id: 'qf_02', home: 'W:r16_03', away: 'W:r16_04' },
      { id: 'qf_03', home: 'W:r16_05', away: 'W:r16_06' },
      { id: 'qf_04', home: 'W:r16_07', away: 'W:r16_08' },
    ],
  },
  {
    name: 'Semifinais',
    matches: [
      { id: 'sf_01', home: 'W:qf_01', away: 'W:qf_02' },
      { id: 'sf_02', home: 'W:qf_03', away: 'W:qf_04' },
    ],
  },
  {
    name: 'Final',
    matches: [
      { id: 'final', home: 'W:sf_01', away: 'W:sf_02' },
    ],
  },
];

// ---- Simulation helpers -------------------------------------

function calcGroupStandings(groupBets) {
  const standings = {};
  for (const gId of Object.keys(GROUPS)) {
    const table = {};
    for (const t of GROUPS[gId]) {
      table[t] = { id: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 };
    }
    for (const game of generateGroupGames(gId)) {
      const bet = groupBets[game.id];
      if (bet === undefined || bet.homeGoals === '' || bet.awayGoals === '') continue;
      const hg = parseInt(bet.homeGoals, 10);
      const ag = parseInt(bet.awayGoals, 10);
      if (isNaN(hg) || isNaN(ag)) continue;

      const h = table[game.home];
      const a = table[game.away];
      h.gf += hg; h.ga += ag; h.played++;
      a.gf += ag; a.ga += hg; a.played++;
      if (hg > ag) { h.pts += 3; }
      else if (hg === ag) { h.pts += 1; a.pts += 1; }
      else { a.pts += 3; }
      h.gd = h.gf - h.ga;
      a.gd = a.gf - a.ga;
    }
    const sorted = Object.values(table).sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    );
    standings[gId] = sorted;
  }
  return standings;
}

function getQualified(standings) {
  const winners  = {};
  const runners  = {};
  const thirds   = [];

  for (const [gId, table] of Object.entries(standings)) {
    winners[gId] = table[0]?.id;
    runners[gId] = table[1]?.id;
    if (table[2]) {
      thirds.push({ ...table[2], group: gId });
    }
  }

  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const best8 = thirds.slice(0, 8);

  return { winners, runners, thirds: best8 };
}

// Resolve slot label (e.g. "1A", "2F", "T3_1") → team id
function resolveSlot(slot, qualified) {
  const pos = slot[0]; // '1', '2', or 'T'
  if (pos === '1') return qualified.winners[slot[1]];
  if (pos === '2') return qualified.runners[slot[1]];
  if (pos === 'T') {
    const idx = parseInt(slot.split('_')[1], 10) - 1;
    return qualified.thirds[idx]?.id;
  }
  return undefined;
}

function buildR32(qualified) {
  return KNOCKOUT_SLOTS.map(s => ({
    id: s.id,
    home: resolveSlot(s.homeSlot, qualified),
    away: resolveSlot(s.awaySlot, qualified),
    homeLabel: s.homeSlot,
    awayLabel: s.awaySlot,
  }));
}

// Given knockout bets (map of matchId → winnerId), resolve later rounds
function resolveKnockoutRound(roundMatches, koBets) {
  return roundMatches.map(m => {
    const resolveRef = (ref) => {
      if (!ref.startsWith('W:')) return ref;
      const prevId = ref.slice(2);
      return koBets[prevId] || null;
    };
    return {
      id: m.id,
      home: resolveRef(m.home),
      away: resolveRef(m.away),
    };
  });
}

function teamLabel(id, useFull = true) {
  if (!id) return '?';
  const t = TEAMS[id];
  if (!t) return id;
  return `${t.flag} ${useFull ? t.name : t.short}`;
}
