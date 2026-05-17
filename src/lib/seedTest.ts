/**
 * Client-side seed for testing the full bolão flow without an external
 * seed-server. Creates N fake users with random bets, generates plausible
 * group + KO results, and recomputes the live ranking.
 *
 * Seeded users get uids prefixed with SEED_PREFIX so undoSeedTestData()
 * can find and remove them deterministically.
 *
 * Seeded users have Firestore profile + bets docs only — they do NOT have
 * Firebase Auth accounts and cannot log in. This is intentional: we just
 * need them to appear in admin lists and rankings for testing.
 */
import {
  saveProfile, saveGroupBetsForUser, saveKnockoutBetsForUser,
  saveGroupResults, saveKnockoutResults, updateRankingDoc,
  deleteUserData, loadAdminUserList, loadAllUsersForRanking,
  loadResults, loadScoringConfig,
} from './firestore'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { DEFAULT_SCORING } from '@/data/bracket'
import { GROUP_IDS } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import type {
  GroupBets, KnockoutBets, Results, TeamId, UserWithBets,
} from '@/types'

export const SEED_PREFIX = 'seed-test-'

const TEST_NAMES = [
  'João Silva',         'Maria Santos',       'Pedro Costa',        'Ana Oliveira',
  'Carlos Souza',       'Juliana Lima',       'Roberto Alves',      'Fernanda Pereira',
  'Lucas Ferreira',     'Beatriz Ribeiro',    'Marcos Almeida',     'Patrícia Carvalho',
  'Thiago Martins',     'Camila Rocha',       'Bruno Cardoso',      'Larissa Mendes',
  'Rafael Nunes',       'Amanda Barbosa',     'Diego Castro',       'Mariana Teixeira',
  'Felipe Gomes',       'Gabriela Dias',      'Henrique Moreira',   'Isabela Freitas',
  'Daniel Cunha',       'Letícia Pinto',      'Vinícius Araújo',    'Sabrina Monteiro',
  'Eduardo Cavalcanti', 'Renata Vieira',
]

export type LogFn = (line: string) => void
const noop: LogFn = () => {}

// ── Random data generators ───────────────────────────────────────────────────

function rand(max: number): number {
  return Math.floor(Math.random() * max)
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** Random 0–3 goal scores for all 72 group games. */
function randomGroupBets(): GroupBets {
  const out: GroupBets = {}
  for (const g of GROUP_IDS) {
    for (let i = 0; i < 6; i++) {
      out[`${g}_${i}`] = {
        homeGoals: String(rand(4)),  // 0,1,2,3
        awayGoals: String(rand(4)),
      }
    }
  }
  return out
}

/**
 * Random KO picks. For seed purposes we sample from the full 48-team pool
 * rather than enforcing that picks descend from real group results — this
 * keeps the seed lightweight and the scoring will reward whoever happens
 * to guess right.
 */
function randomKoBets(): KnockoutBets {
  const allTeams = Object.keys(TEAMS) as TeamId[]
  const r32 = shuffle(allTeams).slice(0, 16)
  const r16 = shuffle([...r32]).slice(0, 8)
  const qf  = shuffle([...r16]).slice(0, 4)
  const sf  = shuffle([...qf]).slice(0, 2)
  const champion = sf[rand(sf.length)]!
  const thirdPool = qf.filter(t => !sf.includes(t))
  const third = thirdPool[rand(thirdPool.length)]
  return { r32, r16, qf, sf, champion, third }
}

/** Plausible official group-stage results (random 0–3 goals). */
function randomGroupResults(): Results['groupStage'] {
  return randomGroupBets()  // identical shape
}

/**
 * Random KO results. Just picks any team from the 48-team pool for each
 * match slot — won't be internally consistent (e.g. a team can "win" R32
 * but not appear in R16), but for ranking-test purposes it's fine since
 * the scoring only looks at which teams advanced in each round.
 */
function randomKoResults(): Results['knockout'] {
  const allTeams = Object.keys(TEAMS)
  const pick = () => allTeams[rand(allTeams.length)]!
  const out: Record<string, string> = {}
  for (let i = 1; i <= 16; i++) out[`r32_${String(i).padStart(2, '0')}`] = pick()
  for (let i = 1; i <= 8;  i++) out[`r16_${String(i).padStart(2, '0')}`] = pick()
  for (let i = 1; i <= 4;  i++) out[`qf_${String(i).padStart(2, '0')}`]  = pick()
  for (let i = 1; i <= 2;  i++) out[`sf_${String(i).padStart(2, '0')}`]  = pick()
  out['third'] = pick()
  out['final'] = pick()
  return out
}

// ── High-level orchestrators ─────────────────────────────────────────────────

interface SeedOptions {
  count?: number
  log?: LogFn
  /** When true, generates official-style group + KO results too. */
  withResults?: boolean
}

/**
 * Creates N test users with random bets, generates official-style results,
 * and recomputes the ranking. Returns the number of users created.
 */
export async function seedTestData({
  count = 20,
  log = noop,
  withResults = true,
}: SeedOptions = {}): Promise<number> {
  const n = Math.min(count, TEST_NAMES.length)
  log(`▶ Iniciando seed: ${n} usuários + resultados + ranking`)

  // ── Step 1: create N users with bets ──────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const uid = `${SEED_PREFIX}${String(i + 1).padStart(2, '0')}`
    const name = TEST_NAMES[i]!
    const email = `teste${i + 1}@bolao.test`

    await saveProfile(uid, { name, email })
    await saveGroupBetsForUser(uid, randomGroupBets())
    await saveKnockoutBetsForUser(uid, randomKoBets())

    if ((i + 1) % 5 === 0 || i === n - 1) {
      log(`  ✓ ${i + 1}/${n} usuários criados`)
    }
  }

  // ── Step 2: generate official results (optional) ──────────────────────────
  if (withResults) {
    log('▶ Gerando resultados oficiais aleatórios…')
    const gs = randomGroupResults()
    const ko = randomKoResults()
    await saveGroupResults(gs)
    await saveKnockoutResults(ko)
    log(`  ✓ ${Object.keys(gs).length} resultados de grupos + ${Object.keys(ko).length} de mata-mata`)
  }

  // ── Step 3: recompute ranking with all users (test + real) ────────────────
  log('▶ Recalculando ranking…')
  const [users, results, scoringRaw] = await Promise.all([
    loadAllUsersForRanking(),
    loadResults(true),
    loadScoringConfig(),
  ])
  const scoring = { ...DEFAULT_SCORING, ...scoringRaw }
  const entries = users.map((u: UserWithBets) => {
    const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, results, scoring)
    return { uid: u.uid, name: u.profile.name ?? 'Sem nome', pts, breakdown }
  })
  await updateRankingDoc(sortRanking(entries))
  log(`  ✓ Ranking atualizado — ${entries.length} participantes no total`)

  log('✅ Seed concluído')
  return n
}

/**
 * Removes ALL seeded test data: deletes every user whose uid starts with
 * SEED_PREFIX, clears official results, and zeroes the ranking. Existing
 * real users and their bets are NOT touched.
 *
 * Returns the number of seed users removed.
 */
export async function undoSeedTestData(log: LogFn = noop): Promise<number> {
  log('▶ Localizando usuários seedados…')
  const allUsers = await loadAdminUserList()
  const seedUsers = allUsers.filter(u => u.uid.startsWith(SEED_PREFIX))
  log(`  ✓ ${seedUsers.length} usuário(s) com prefixo "${SEED_PREFIX}"`)

  if (seedUsers.length === 0 && allUsers.length === 0) {
    log('ℹ Nada a fazer — banco já está vazio')
    return 0
  }

  // ── Step 1: delete seeded users ───────────────────────────────────────────
  for (const u of seedUsers) {
    await deleteUserData(u.uid)
    log(`  ✓ removido: ${u.name ?? u.uid}`)
  }

  // ── Step 2: clear official results (seeded by step 2 of seedTestData) ────
  log('▶ Limpando resultados oficiais…')
  await saveGroupResults({})
  await saveKnockoutResults({})

  // ── Step 3: rebuild ranking from remaining real users (if any) ───────────
  const remaining = await loadAllUsersForRanking()
  if (remaining.length > 0) {
    log(`▶ Recalculando ranking dos ${remaining.length} usuário(s) restantes…`)
    const scoring = { ...DEFAULT_SCORING, ...(await loadScoringConfig()) }
    const entries = remaining.map(u => {
      const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, { groupStage: {}, knockout: {} }, scoring)
      return { uid: u.uid, name: u.profile.name ?? 'Sem nome', pts, breakdown }
    })
    await updateRankingDoc(sortRanking(entries))
  } else {
    log('▶ Zerando ranking…')
    await updateRankingDoc([])
  }

  log('✅ Undo concluído — estado de teste removido')
  return seedUsers.length
}
