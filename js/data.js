// ============================================================
// data.js — Static data: teams, groups, fixtures, bracket
// Official FIFA World Cup 2026 draw (December 5 2025)
// ============================================================

// Pontuação padrão — pode ser sobrescrita pelo admin via Firestore config/scoring
let SCORING = {
  exactScore:     17,  // Placar exato (grupos)
  correctResult:   8,  // Resultado certo, placar errado (grupos)
  r32Winner:       5,  // Classificado para os 32-avos (avança de R32)
  r16Winner:      11,  // Classificado para as oitavas (avança de R16)
  qfWinner:       20,  // Classificado para as quartas (avança de QF)
  sfWinner:       40,  // Classificado para a semifinal (avança de SF → finalista)
  championScore:  71,  // Acertou o campeão
  finalistBonus:  26,  // Bônus por acertar as DUAS finalistas
};

// ---- 48 teams -----------------------------------------------
// flag = emoji fallback · iso = flag-icons CSS class (fi fi-{iso})
const TEAMS = {
  // GROUP A
  'mexico':      { name: 'México',           short: 'MEX', flag: '🇲🇽', iso: 'mx' },
  'southafrica': { name: 'África do Sul',    short: 'RSA', flag: '🇿🇦', iso: 'za' },
  'southkorea':  { name: 'Coreia do Sul',    short: 'KOR', flag: '🇰🇷', iso: 'kr' },
  'czechia':     { name: 'Tchéquia',         short: 'CZE', flag: '🇨🇿', iso: 'cz' },
  // GROUP B
  'canada':      { name: 'Canadá',           short: 'CAN', flag: '🇨🇦', iso: 'ca' },
  'switzerland': { name: 'Suíça',            short: 'SUI', flag: '🇨🇭', iso: 'ch' },
  'qatar':       { name: 'Catar',            short: 'QAT', flag: '🇶🇦', iso: 'qa' },
  'bosnia':      { name: 'Bósnia e Herz.',   short: 'BIH', flag: '🇧🇦', iso: 'ba' },
  // GROUP C
  'brazil':      { name: 'Brasil',           short: 'BRA', flag: '🇧🇷', iso: 'br' },
  'morocco':     { name: 'Marrocos',         short: 'MAR', flag: '🇲🇦', iso: 'ma' },
  'haiti':       { name: 'Haiti',            short: 'HAI', flag: '🇭🇹', iso: 'ht' },
  'scotland':    { name: 'Escócia',          short: 'SCO', flag: '🏴',   iso: 'gb-sct' },
  // GROUP D
  'usa':         { name: 'Estados Unidos',   short: 'USA', flag: '🇺🇸', iso: 'us' },
  'paraguay':    { name: 'Paraguai',         short: 'PAR', flag: '🇵🇾', iso: 'py' },
  'australia':   { name: 'Austrália',        short: 'AUS', flag: '🇦🇺', iso: 'au' },
  'turkey':      { name: 'Turquia',          short: 'TUR', flag: '🇹🇷', iso: 'tr' },
  // GROUP E
  'germany':     { name: 'Alemanha',         short: 'GER', flag: '🇩🇪', iso: 'de' },
  'curacao':     { name: 'Curaçao',          short: 'CUW', flag: '🇨🇼', iso: 'cw' },
  'ivorycoast':  { name: 'Costa do Marfim',  short: 'CIV', flag: '🇨🇮', iso: 'ci' },
  'ecuador':     { name: 'Equador',          short: 'ECU', flag: '🇪🇨', iso: 'ec' },
  // GROUP F
  'netherlands': { name: 'Holanda',          short: 'NED', flag: '🇳🇱', iso: 'nl' },
  'japan':       { name: 'Japão',            short: 'JPN', flag: '🇯🇵', iso: 'jp' },
  'tunisia':     { name: 'Tunísia',          short: 'TUN', flag: '🇹🇳', iso: 'tn' },
  'sweden':      { name: 'Suécia',           short: 'SWE', flag: '🇸🇪', iso: 'se' },
  // GROUP G
  'belgium':     { name: 'Bélgica',          short: 'BEL', flag: '🇧🇪', iso: 'be' },
  'egypt':       { name: 'Egito',            short: 'EGY', flag: '🇪🇬', iso: 'eg' },
  'iran':        { name: 'Irã',              short: 'IRN', flag: '🇮🇷', iso: 'ir' },
  'newzealand':  { name: 'Nova Zelândia',    short: 'NZL', flag: '🇳🇿', iso: 'nz' },
  // GROUP H
  'spain':       { name: 'Espanha',          short: 'ESP', flag: '🇪🇸', iso: 'es' },
  'capeverde':   { name: 'Cabo Verde',       short: 'CPV', flag: '🇨🇻', iso: 'cv' },
  'saudiarabia': { name: 'Arábia Saudita',   short: 'KSA', flag: '🇸🇦', iso: 'sa' },
  'uruguay':     { name: 'Uruguai',          short: 'URU', flag: '🇺🇾', iso: 'uy' },
  // GROUP I
  'france':      { name: 'França',           short: 'FRA', flag: '🇫🇷', iso: 'fr' },
  'senegal':     { name: 'Senegal',          short: 'SEN', flag: '🇸🇳', iso: 'sn' },
  'norway':      { name: 'Noruega',          short: 'NOR', flag: '🇳🇴', iso: 'no' },
  'iraq':        { name: 'Iraque',           short: 'IRQ', flag: '🇮🇶', iso: 'iq' },
  // GROUP J
  'argentina':   { name: 'Argentina',        short: 'ARG', flag: '🇦🇷', iso: 'ar' },
  'algeria':     { name: 'Argélia',          short: 'ALG', flag: '🇩🇿', iso: 'dz' },
  'austria':     { name: 'Áustria',          short: 'AUT', flag: '🇦🇹', iso: 'at' },
  'jordan':      { name: 'Jordânia',         short: 'JOR', flag: '🇯🇴', iso: 'jo' },
  // GROUP K
  'portugal':    { name: 'Portugal',         short: 'POR', flag: '🇵🇹', iso: 'pt' },
  'uzbekistan':  { name: 'Uzbequistão',      short: 'UZB', flag: '🇺🇿', iso: 'uz' },
  'colombia':    { name: 'Colômbia',         short: 'COL', flag: '🇨🇴', iso: 'co' },
  'drcongo':     { name: 'RD Congo',         short: 'COD', flag: '🇨🇩', iso: 'cd' },
  // GROUP L
  'england':     { name: 'Inglaterra',       short: 'ENG', flag: '🏴',   iso: 'gb-eng' },
  'croatia':     { name: 'Croácia',          short: 'CRO', flag: '🇭🇷', iso: 'hr' },
  'ghana':       { name: 'Gana',             short: 'GHA', flag: '🇬🇭', iso: 'gh' },
  'panama':      { name: 'Panamá',           short: 'PAN', flag: '🇵🇦', iso: 'pa' },
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

// ---- Datas das rodadas da fase de grupos (Copa 2026) ---------
// Rodada 1: 11–15 jun · Rodada 2: 16–20 jun · Rodada 3: 24–25 jun
const ROUND_DATES = {
  1: '11–15 jun',
  2: '16–20 jun',
  3: '24–25 jun',
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
// ---- Rodada de 32 — Chaveamento OFICIAL FIFA Copa 2026 -------------
// Fonte: Wikipedia / Regulamento oficial FIFA (Annex B)
// Matches 73-88 do calendário oficial.
// T3_N = N-ésimo melhor 3º colocado (os 8 melhores entre 12 grupos).
// A designação exata do T3 para cada jogo depende de quais grupos
// tiveram seus 3ºs classificados — implementamos a ordem por ranking.
const KNOCKOUT_SLOTS = [
  { id: 'r32_01', homeSlot: '2A',  awaySlot: '2B'  }, // M73: 2ºA vs 2ºB
  { id: 'r32_02', homeSlot: '1E',  awaySlot: 'T3_1'}, // M74: 1ºE vs melhor 3º
  { id: 'r32_03', homeSlot: '1F',  awaySlot: '2C'  }, // M75: 1ºF vs 2ºC
  { id: 'r32_04', homeSlot: '1C',  awaySlot: '2F'  }, // M76: 1ºC vs 2ºF
  { id: 'r32_05', homeSlot: '1I',  awaySlot: 'T3_2'}, // M77: 1ºI vs melhor 3º
  { id: 'r32_06', homeSlot: '2E',  awaySlot: '2I'  }, // M78: 2ºE vs 2ºI
  { id: 'r32_07', homeSlot: '1A',  awaySlot: 'T3_3'}, // M79: 1ºA vs melhor 3º
  { id: 'r32_08', homeSlot: '1L',  awaySlot: 'T3_4'}, // M80: 1ºL vs melhor 3º
  { id: 'r32_09', homeSlot: '1D',  awaySlot: 'T3_5'}, // M81: 1ºD vs melhor 3º
  { id: 'r32_10', homeSlot: '1G',  awaySlot: 'T3_6'}, // M82: 1ºG vs melhor 3º
  { id: 'r32_11', homeSlot: '2K',  awaySlot: '2L'  }, // M83: 2ºK vs 2ºL
  { id: 'r32_12', homeSlot: '1H',  awaySlot: '2J'  }, // M84: 1ºH vs 2ºJ
  { id: 'r32_13', homeSlot: '1B',  awaySlot: 'T3_7'}, // M85: 1ºB vs melhor 3º
  { id: 'r32_14', homeSlot: '1J',  awaySlot: '2H'  }, // M86: 1ºJ vs 2ºH
  { id: 'r32_15', homeSlot: '1K',  awaySlot: 'T3_8'}, // M87: 1ºK vs melhor 3º
  { id: 'r32_16', homeSlot: '2D',  awaySlot: '2G'  }, // M88: 2ºD vs 2ºG
];

// Oitavas → Final (cada jogo referencia vencedor de jogo anterior)
// Mapeamento oficial: M89=W74vsW77, M90=W73vsW75, M91=W76vsW78,
// M92=W79vsW80, M93=W83vsW84, M94=W81vsW82, M95=W86vsW88, M96=W85vsW87
const KNOCKOUT_ROUNDS = [
  {
    name: 'Oitavas',
    matches: [
      { id: 'r16_01', home: 'W:r32_02', away: 'W:r32_05' }, // M89
      { id: 'r16_02', home: 'W:r32_01', away: 'W:r32_03' }, // M90
      { id: 'r16_03', home: 'W:r32_04', away: 'W:r32_06' }, // M91
      { id: 'r16_04', home: 'W:r32_07', away: 'W:r32_08' }, // M92
      { id: 'r16_05', home: 'W:r32_11', away: 'W:r32_12' }, // M93
      { id: 'r16_06', home: 'W:r32_09', away: 'W:r32_10' }, // M94
      { id: 'r16_07', home: 'W:r32_14', away: 'W:r32_16' }, // M95
      { id: 'r16_08', home: 'W:r32_13', away: 'W:r32_15' }, // M96
    ],
  },
  {
    name: 'Quartas',
    matches: [
      { id: 'qf_01', home: 'W:r16_01', away: 'W:r16_02' }, // M97
      { id: 'qf_02', home: 'W:r16_05', away: 'W:r16_06' }, // M98
      { id: 'qf_03', home: 'W:r16_03', away: 'W:r16_04' }, // M99
      { id: 'qf_04', home: 'W:r16_07', away: 'W:r16_08' }, // M100
    ],
  },
  {
    name: 'Semifinais',
    matches: [
      { id: 'sf_01', home: 'W:qf_01', away: 'W:qf_02' }, // M101
      { id: 'sf_02', home: 'W:qf_03', away: 'W:qf_04' }, // M102
    ],
  },
  {
    name: 'Terceiro Lugar',
    matches: [
      { id: 'third', home: 'L:sf_01', away: 'L:sf_02' }, // M103 (18/jul — Miami)
    ],
  },
  {
    name: 'Final',
    matches: [
      { id: 'final', home: 'W:sf_01', away: 'W:sf_02' }, // M104 (19/jul — MetLife)
    ],
  },
];

// ---- Simulation helpers -------------------------------------

// ---- H2H tiebreaker helpers (regra oficial FIFA) -------------
// Passo 1: pontos/GD/GF apenas nos confrontos diretos entre times empatados
// Passo 2 (se ainda empatados): GD geral → GF geral
// Passo 3: fair play / Ranking FIFA (não implementável sem dados externos)

function _h2hStats(teamIds, results) {
  const set = new Set(teamIds);
  const s = {};
  for (const id of teamIds) s[id] = { pts: 0, gf: 0, ga: 0, gd: 0 };
  for (const r of results) {
    if (!set.has(r.home) || !set.has(r.away)) continue;
    s[r.home].gf += r.hg; s[r.home].ga += r.ag;
    s[r.away].gf += r.ag; s[r.away].ga += r.hg;
    if      (r.hg > r.ag) s[r.home].pts += 3;
    else if (r.hg === r.ag) { s[r.home].pts += 1; s[r.away].pts += 1; }
    else                    s[r.away].pts += 3;
  }
  for (const id of teamIds) s[id].gd = s[id].gf - s[id].ga;
  return s;
}

function _rankGroupTeams(teams, results) {
  teams.sort((a, b) => b.pts - a.pts);
  const ranked = [];
  let i = 0;
  while (i < teams.length) {
    let j = i;
    while (j < teams.length && teams[j].pts === teams[i].pts) j++;
    const tied = teams.slice(i, j);
    if (tied.length === 1) {
      ranked.push(tied[0]);
    } else {
      // Passo 1: H2H entre os times empatados
      const h2h = _h2hStats(tied.map(t => t.id), results);
      tied.sort((a, b) => {
        const ha = h2h[a.id], hb = h2h[b.id];
        return hb.pts - ha.pts   // H2H pontos
            || hb.gd  - ha.gd   // H2H saldo de gols
            || hb.gf  - ha.gf   // H2H gols marcados
            || b.gd   - a.gd    // Passo 2: saldo geral
            || b.gf   - a.gf;   // Passo 2: gols marcados geral
      });
      ranked.push(...tied);
    }
    i = j;
  }
  return ranked;
}

function calcGroupStandings(groupBets) {
  const standings = {};
  for (const gId of Object.keys(GROUPS)) {
    const table = {};
    for (const t of GROUPS[gId]) {
      table[t] = { id: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 };
    }
    const results = []; // guarda partidas para cálculo H2H

    for (const game of generateGroupGames(gId)) {
      const bet = groupBets[game.id];
      if (bet === undefined || bet.homeGoals === '' || bet.awayGoals === '') continue;
      const hg = parseInt(bet.homeGoals, 10);
      const ag = parseInt(bet.awayGoals, 10);
      if (isNaN(hg) || isNaN(ag)) continue;

      results.push({ home: game.home, away: game.away, hg, ag });

      const h = table[game.home];
      const a = table[game.away];
      h.gf += hg; h.ga += ag; h.played++;
      a.gf += ag; a.ga += hg; a.played++;
      if      (hg > ag) h.pts += 3;
      else if (hg === ag) { h.pts += 1; a.pts += 1; }
      else               a.pts += 3;
      h.gd = h.gf - h.ga;
      a.gd = a.gf - a.ga;
    }
    standings[gId] = _rankGroupTeams(Object.values(table), results);
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

  thirds.sort((a, b) =>
    b.pts - a.pts ||
    b.gd  - a.gd  ||
    b.gf  - a.gf  ||
    a.ga  - b.ga  // menor gols contra = melhor
  );
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

// Resolve um round do mata-mata dado os palpites e o estado já resolvido.
// prevResolved: { [matchId]: { home, away } } — necessário para resolver L: (perdedor)
function resolveKnockoutRound(roundMatches, koBets, prevResolved = {}) {
  return roundMatches.map(m => {
    const resolve = (ref) => {
      if (!ref) return null;
      if (ref.startsWith('W:')) {
        return koBets[ref.slice(2)] || null;
      }
      if (ref.startsWith('L:')) {
        // Perdedor = o time que NÃO foi apostado como vencedor daquela partida
        const prevId = ref.slice(2);
        const prev   = prevResolved[prevId];
        if (!prev) return null;
        const winner = koBets[prevId];
        if (!winner) return null;
        return prev.home === winner ? prev.away : prev.home;
      }
      return ref;
    };
    return { id: m.id, home: resolve(m.home), away: resolve(m.away) };
  });
}

function teamLabel(id, useFull = true) {
  if (!id) return '?';
  const t = TEAMS[id];
  if (!t) return id;
  return `${t.flag} ${useFull ? t.name : t.short}`;
}
