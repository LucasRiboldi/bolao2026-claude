import { useState, useEffect, useCallback } from 'react'
import {
  loadResults, saveGroupResults, saveKnockoutResults,
  saveSingleGroupResult, deleteSingleGroupResult,
  saveSingleKnockoutResult, deleteSingleKnockoutResult,
  deleteAllResults,
} from '@/lib/firestore'
import type { Results, TeamId, KnockoutMatch } from '@/types'
import { GROUP_IDS, generateGroupGames, GROUP_COLORS } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import { Flag } from '@/components/Flag'
import { KNOCKOUT_ROUNDS, buildR32, resolveKnockoutRound } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { AdminPageHeader } from './AdminPageHeader'

type SubTab = 'grupos' | 'mata-mata'
type RowStatus = 'idle' | 'saving' | 'saved' | 'error'

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

// ── Per-row action buttons (save / delete) ──────────────────────────────────

function RowActions({ status, canSave, onSave, onDelete }: {
  status: RowStatus
  canSave: boolean
  onSave: () => void
  onDelete: () => void
}) {
  const icon =
    status === 'saving' ? '⏳' :
    status === 'saved'  ? '✓'  :
    status === 'error'  ? '⚠'  : '💾'
  const cls =
    status === 'saved'  ? 'row-action row-action--ok'  :
    status === 'error'  ? 'row-action row-action--err' :
    'row-action'
  return (
    <div className="row-actions">
      <button
        className={cls}
        onClick={onSave}
        disabled={!canSave || status === 'saving'}
        title="Salvar este jogo no banco"
        aria-label="Salvar este jogo"
      >{icon}</button>
      <button
        className="row-action row-action--danger"
        onClick={onDelete}
        title="Apagar este resultado do banco"
        aria-label="Apagar este resultado"
      >🗑️</button>
    </div>
  )
}

// ── Group results ────────────────────────────────────────────────────────────

function GroupResultCard({ groupId, results, onChange, rowStatus, onSaveGame, onDeleteGame }: {
  groupId: typeof GROUP_IDS[number]
  results: Results['groupStage']
  onChange: (gameId: string, home: string, away: string) => void
  rowStatus: Record<string, RowStatus>
  onSaveGame: (gameId: string) => void
  onDeleteGame: (gameId: string) => void
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
            const canSave = home !== '' && away !== ''
            return (
              <div key={game.id} className="match-row-bet match-row-bet--admin">
                <div className="match-team-left">
                  <span className="match-team-name">{ht?.name ?? game.home}</span>
                  {ht && <Flag iso={ht.iso} name={ht.name} size="sm" />}
                </div>
                <div className="match-score-center">
                  <Stepper value={home} onDec={() => adjust(game.id, 'home', -1)} onInc={() => { init(game.id, 'home'); adjust(game.id, 'home', 1) }} />
                  <span className="match-sep">×</span>
                  <Stepper value={away} onDec={() => adjust(game.id, 'away', -1)} onInc={() => { init(game.id, 'away'); adjust(game.id, 'away', 1) }} />
                </div>
                <div className="match-team-right">
                  {at && <Flag iso={at.iso} name={at.name} size="sm" />}
                  <span className="match-team-name">{at?.name ?? game.away}</span>
                </div>
                <RowActions
                  status={rowStatus[game.id] ?? 'idle'}
                  canSave={canSave}
                  onSave={() => onSaveGame(game.id)}
                  onDelete={() => onDeleteGame(game.id)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── KO result picker ─────────────────────────────────────────────────────────

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
      {team && <Flag iso={team.iso} name={team.name} size="sm" />}
      <span className="ko-slot__name">{team?.name ?? (isEmpty ? '—' : teamId)}</span>
      {selected && <span className="ko-slot__check">✓</span>}
      {!selected && !isEmpty && <span className="ko-slot__label">resultado</span>}
    </div>
  )
}

// ── Confirm modal (delete-all) ───────────────────────────────────────────────

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, busy }: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
}) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal__title">{title}</div>
        <div className="confirm-modal__msg">{message}</div>
        <div className="confirm-modal__actions">
          <button className="btn" onClick={onCancel} disabled={busy}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Apagando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ResultsTab ──────────────────────────────────────────────────────────

export function ResultsTab() {
  const [subTab, setSubTab] = useState<SubTab>('grupos')
  const [groupResults, setGroupResults] = useState<Results['groupStage']>({})
  const [koResults, setKoResults] = useState<Results['knockout']>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({})
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    loadResults(true).then(r => {
      setGroupResults(r.groupStage)
      setKoResults(r.knockout)
    }).finally(() => setLoading(false))
  }, [])

  function setGroupResult(gameId: string, home: string, away: string) {
    setGroupResults(prev => ({ ...prev, [gameId]: { homeGoals: home, awayGoals: away } }))
    setRowStatus(prev => ({ ...prev, [gameId]: 'idle' }))
  }

  function pickKoWinner(matchId: string, teamId: TeamId) {
    setKoResults(prev => ({ ...prev, [matchId]: teamId }))
    setRowStatus(prev => ({ ...prev, [matchId]: 'idle' }))
  }

  // Flash 'saved' for ~1.5s then back to idle
  const flashSaved = useCallback((id: string) => {
    setRowStatus(prev => ({ ...prev, [id]: 'saved' }))
    setTimeout(() => setRowStatus(prev => {
      if (prev[id] !== 'saved') return prev
      const next = { ...prev }; delete next[id]; return next
    }), 1500)
  }, [])

  async function handleSaveGame(gameId: string) {
    const bet = groupResults[gameId]
    if (!bet || bet.homeGoals === '' || bet.awayGoals === '') return
    setRowStatus(prev => ({ ...prev, [gameId]: 'saving' }))
    try {
      await saveSingleGroupResult(gameId, bet)
      flashSaved(gameId)
    } catch {
      setRowStatus(prev => ({ ...prev, [gameId]: 'error' }))
    }
  }

  async function handleDeleteGame(gameId: string) {
    setRowStatus(prev => ({ ...prev, [gameId]: 'saving' }))
    try {
      await deleteSingleGroupResult(gameId)
      setGroupResults(prev => { const n = { ...prev }; delete n[gameId]; return n })
      flashSaved(gameId)
    } catch {
      setRowStatus(prev => ({ ...prev, [gameId]: 'error' }))
    }
  }

  async function handleSaveKoMatch(matchId: string) {
    const winner = koResults[matchId]
    if (!winner) return
    setRowStatus(prev => ({ ...prev, [matchId]: 'saving' }))
    try {
      await saveSingleKnockoutResult(matchId, winner)
      flashSaved(matchId)
    } catch {
      setRowStatus(prev => ({ ...prev, [matchId]: 'error' }))
    }
  }

  async function handleDeleteKoMatch(matchId: string) {
    setRowStatus(prev => ({ ...prev, [matchId]: 'saving' }))
    try {
      await deleteSingleKnockoutResult(matchId)
      setKoResults(prev => { const n = { ...prev }; delete n[matchId]; return n })
      flashSaved(matchId)
    } catch {
      setRowStatus(prev => ({ ...prev, [matchId]: 'error' }))
    }
  }

  async function handleSaveAll() {
    setSaving(true)
    try {
      if (subTab === 'grupos') await saveGroupResults(groupResults)
      else await saveKnockoutResults(koResults)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAll() {
    setDeletingAll(true)
    try {
      await deleteAllResults()
      setGroupResults({})
      setKoResults({})
      setConfirmDeleteAll(false)
    } finally {
      setDeletingAll(false)
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

  if (loading) return <div className="spinner-wrap spinner-wrap--inline"><div className="spinner" /></div>

  return (
    <div className="admin-results-wrap">
      <AdminPageHeader
        icon="⚽"
        title="Lançar resultados oficiais"
        description="Resultados da fase de grupos e do mata-mata. Cada salvar atualiza o ranking automaticamente em ~2s."
      />

      <div className="admin-results-subtabs">
        <button className={`admin-results-subtab${subTab === 'grupos' ? ' admin-results-subtab--active' : ''}`} onClick={() => setSubTab('grupos')}>⚽ Grupos</button>
        <button className={`admin-results-subtab${subTab === 'mata-mata' ? ' admin-results-subtab--active' : ''}`} onClick={() => setSubTab('mata-mata')}>⚡ Mata-Mata</button>
      </div>

      {subTab === 'grupos' && GROUP_IDS.map(gId => (
        <GroupResultCard
          key={gId}
          groupId={gId}
          results={groupResults}
          onChange={setGroupResult}
          rowStatus={rowStatus}
          onSaveGame={handleSaveGame}
          onDeleteGame={handleDeleteGame}
        />
      ))}

      {subTab === 'mata-mata' && (
        <div className="ko-section">
          {koRounds.map(round => (
            <div key={round.name}>
              <div className="ko-section__title">{round.name}</div>
              {round.matches.map(match => {
                const hasWinner = !!koResults[match.id]
                return (
                  <div key={match.id} className="ko-match ko-match--admin">
                    <div className="ko-match__slots">
                      <KoResultSlot match={match} side="home" koBets={koResults} onPick={pickKoWinner} />
                      <KoResultSlot match={match} side="away" koBets={koResults} onPick={pickKoWinner} />
                    </div>
                    <RowActions
                      status={rowStatus[match.id] ?? 'idle'}
                      canSave={hasWinner}
                      onSave={() => handleSaveKoMatch(match.id)}
                      onDelete={() => handleDeleteKoMatch(match.id)}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      <div className="admin-results-actions">
        <button className="btn btn-primary btn-full" onClick={handleSaveAll} disabled={saving}>
          {saving ? 'Salvando…' : '💾 Salvar todos (em massa)'}
        </button>
        <button className="btn btn-danger btn-full" onClick={() => setConfirmDeleteAll(true)}>
          🗑️ Apagar TODOS os resultados
        </button>
      </div>

      {confirmDeleteAll && (
        <ConfirmModal
          title="Apagar todos os resultados?"
          message="Esta ação apaga TODOS os resultados oficiais (grupos + mata-mata) do banco de dados. Esta operação é irreversível e afeta o ranking de todos os participantes. Tem certeza?"
          confirmLabel="Sim, apagar tudo"
          onConfirm={handleDeleteAll}
          onCancel={() => setConfirmDeleteAll(false)}
          busy={deletingAll}
        />
      )}
    </div>
  )
}
