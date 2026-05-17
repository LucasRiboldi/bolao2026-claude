import { useState, useEffect } from 'react'
import { loadResults, saveGroupResults, saveKnockoutResults } from '@/lib/firestore'
import type { Results, TeamId, KnockoutMatch } from '@/types'
import { GROUP_IDS, generateGroupGames, GROUP_COLORS } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'

type SubTab = 'grupos' | 'mata-mata'

// ── Stepper (same logic as BetScreen) ────────────────────────────────────────

function Stepper({ value, onDec, onInc }: { value: string; onDec: () => void; onInc: () => void }) {
  const n = value === '' ? null : parseInt(value, 10)
  const filled = n !== null
  return (
    <div className="stepper">
      <button className="stepper__btn" onClick={onDec} disabled={n === null || n <= 0} aria-label="Diminuir">−</button>
      <div className={`stepper__val${filled ? ' stepper__val--filled' : ''}`}>{filled ? n : '?'}</div>
      <button className="stepper__btn" onClick={onInc} aria-label="Aumentar">+</button>
    </div>
  )
}

// ── Group results (reuse group-card / match-row-bet classes) ─────────────────

function GroupResultCard({ groupId, results, onChange }: {
  groupId: typeof GROUP_IDS[number]
  results: Results['groupStage']
  onChange: (gameId: string, home: string, away: string) => void
}) {
  const [open, setOpen] = useState(false)
  const games = generateGroupGames(groupId)
  const color = GROUP_COLORS[groupId]

  function adjust(gameId: string, side: 'home' | 'away', delta: number) {
    const bet = results[gameId]
    const home = bet?.homeGoals ?? ''
    const away = bet?.awayGoals ?? ''
    const curr = side === 'home' ? home : away
    const other = side === 'home' ? away : home
    const n = curr === '' ? 0 : parseInt(curr, 10)
    const next = String(Math.max(0, n + delta))
    onChange(gameId, side === 'home' ? next : other, side === 'away' ? next : other)
  }

  function init(gameId: string, side: 'home' | 'away') {
    const bet = results[gameId]
    if (bet?.homeGoals !== '' || bet?.awayGoals !== '') return
    onChange(gameId, side === 'home' ? '0' : '', side === 'away' ? '0' : '')
  }

  return (
    <div className="group-card" style={{ borderLeftColor: color }}>
      <div className="group-card__header" onClick={() => setOpen(o => !o)} role="button" aria-expanded={open} tabIndex={0} onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}>
        <div className="group-card__title">Grupo {groupId}</div>
        <span className={`group-card__chevron${open ? ' group-card__chevron--open' : ''}`}>▾</span>
      </div>
      {open && (
        <div className="group-card__games">
          {games.map(game => {
            const bet = results[game.id]
            const home = bet?.homeGoals ?? ''
            const away = bet?.awayGoals ?? ''
            const ht = TEAMS[game.home]
            const at = TEAMS[game.away]
            return (
              <div key={game.id} className="match-row-bet">
                <div className="match-team-left">
                  <span className="match-team-name">{ht?.short ?? game.home}</span>
                  <span className="match-team-flag">{ht?.flag}</span>
                </div>
                <div className="match-score-center">
                  <Stepper value={home} onDec={() => adjust(game.id, 'home', -1)} onInc={() => { init(game.id, 'home'); adjust(game.id, 'home', 1) }} />
                  <span className="match-sep">×</span>
                  <Stepper value={away} onDec={() => adjust(game.id, 'away', -1)} onInc={() => { init(game.id, 'away'); adjust(game.id, 'away', 1) }} />
                </div>
                <div className="match-team-right">
                  <span className="match-team-flag">{at?.flag}</span>
                  <span className="match-team-name">{at?.short ?? game.away}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── KO result picker ──────────────────────────────────────────────────────────

function KoResultSlot({ match, side, koBets, onPick }: {
  match: KnockoutMatch
  side: 'home' | 'away'
  koBets: Results['knockout']
  onPick: (matchId: string, teamId: TeamId) => void
}) {
  const teamId = side === 'home' ? match.home : match.away
  const team = teamId ? TEAMS[teamId] : null
  const winner = koBets[match.id]
  const selected = !!teamId && winner === teamId
  const isEmpty = !teamId

  return (
    <div
      className={`ko-slot${selected ? ' ko-slot--selected' : ''}${isEmpty ? ' ko-slot--empty' : ''}`}
      onClick={() => !isEmpty && teamId && onPick(match.id, teamId)}
      role={isEmpty ? undefined : 'button'}
    >
      <span className="ko-slot__flag">{team?.flag ?? '🏳'}</span>
      <span className="ko-slot__name">{team?.name ?? (isEmpty ? '—' : teamId)}</span>
      {selected && <span className="ko-slot__check">✓</span>}
      {!selected && !isEmpty && <span className="ko-slot__label">resultado</span>}
    </div>
  )
}

// ── Main ResultsTab ───────────────────────────────────────────────────────────

export function ResultsTab() {
  const [subTab, setSubTab] = useState<SubTab>('grupos')
  const [groupResults, setGroupResults] = useState<Results['groupStage']>({})
  const [koResults, setKoResults] = useState<Results['knockout']>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults(true).then(r => {
      setGroupResults(r.groupStage)
      setKoResults(r.knockout)
    }).finally(() => setLoading(false))
  }, [])

  function setGroupResult(gameId: string, home: string, away: string) {
    setGroupResults(prev => ({ ...prev, [gameId]: { homeGoals: home, awayGoals: away } }))
  }

  function pickKoWinner(matchId: string, teamId: TeamId) {
    setKoResults(prev => ({ ...prev, [matchId]: teamId }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (subTab === 'grupos') await saveGroupResults(groupResults)
      else await saveKnockoutResults(koResults)
    } finally {
      setSaving(false)
    }
  }

  const standings = calcGroupStandings(groupResults)
  const qualified = getQualified(standings)
  const r32 = buildR32(qualified)
  const allResolved: Record<string, KnockoutMatch> = {}
  for (const m of r32) allResolved[m.id] = m
  const koRounds = [
    { name: 'Round de 32', matches: r32 },
    ...KNOCKOUT_ROUNDS.map(round => {
      const resolved = resolveKnockoutRound(round.matches, koResults, allResolved)
      for (const m of resolved) allResolved[m.id] = m
      return { name: round.name, matches: resolved }
    }),
  ]

  if (loading) return <div className="spinner-wrap" style={{ paddingTop: 32 }}><div className="spinner" /></div>

  return (
    <div className="admin-results-wrap">
      <div className="admin-results-subtabs">
        <button className={`admin-results-subtab${subTab === 'grupos' ? ' admin-results-subtab--active' : ''}`} onClick={() => setSubTab('grupos')}>⚽ Grupos</button>
        <button className={`admin-results-subtab${subTab === 'mata-mata' ? ' admin-results-subtab--active' : ''}`} onClick={() => setSubTab('mata-mata')}>⚡ Mata-Mata</button>
      </div>

      {subTab === 'grupos' && GROUP_IDS.map(gId => (
        <GroupResultCard key={gId} groupId={gId} results={groupResults} onChange={setGroupResult} />
      ))}

      {subTab === 'mata-mata' && (
        <div className="ko-section">
          {koRounds.map(round => (
            <div key={round.name}>
              <div className="ko-section__title">{round.name}</div>
              {round.matches.map(match => (
                <div key={match.id} className="ko-match">
                  <KoResultSlot match={match} side="home" koBets={koResults} onPick={pickKoWinner} />
                  <KoResultSlot match={match} side="away" koBets={koResults} onPick={pickKoWinner} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="admin-results-save">
        <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : '💾 Salvar Resultados'}
        </button>
      </div>
    </div>
  )
}
