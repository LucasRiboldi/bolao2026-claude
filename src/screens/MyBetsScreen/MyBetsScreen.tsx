import { useAuth } from '@/contexts/AuthContext'
import { useGroupBets } from '@/hooks/useGroupBets'
import { useKnockoutBets } from '@/hooks/useKnockoutBets'
import { useStandings } from '@/hooks/useStandings'
import { GROUP_IDS, generateGroupGames } from '@/data/groups'
import { TEAMS } from '@/data/teams'
import { KNOCKOUT_ROUNDS } from '@/data/bracket'
import { StatusCard } from './StatusCard'
import { GroupBetsView } from './GroupBetsView'
import { KnockoutBetsView } from './KnockoutBetsView'
import './MyBetsScreen.css'

function buildWhatsAppText(
  groupBets: ReturnType<typeof useGroupBets>['bets'],
  koBets: ReturnType<typeof useKnockoutBets>['bets'],
): string {
  const lines: string[] = ['🏆 *Bolão Copa 2026 — Minhas Apostas*', '']

  lines.push('*FASE DE GRUPOS*')
  for (const gId of GROUP_IDS) {
    lines.push(`\nGrupo ${gId}:`)
    for (const game of generateGroupGames(gId)) {
      const b = groupBets[game.id]
      const hTeam = TEAMS[game.home]
      const aTeam = TEAMS[game.away]
      const score = b && b.homeGoals !== '' && b.awayGoals !== ''
        ? `${b.homeGoals}×${b.awayGoals}`
        : '?×?'
      lines.push(`  ${hTeam?.name ?? game.home} ${score} ${aTeam?.name ?? game.away}`)
    }
  }

  lines.push('', '*MATA-MATA*')
  const allRounds = [
    { name: 'Round de 32', ids: Array.from({ length: 16 }, (_, i) => `r32_${String(i + 1).padStart(2, '0')}`) },
    ...KNOCKOUT_ROUNDS.map(r => ({ name: r.name, ids: r.matches.map(m => m.id) })),
  ]
  for (const round of allRounds) {
    const picks = round.ids.map(id => koBets[id]).filter(Boolean)
    if (picks.length === 0) continue
    lines.push(`\n${round.name}:`)
    for (const teamId of picks) {
      const t = TEAMS[teamId!]
      lines.push(`  ${t?.name ?? teamId}`)
    }
  }

  return lines.join('\n')
}

export function MyBetsScreen() {
  const { user, profile } = useAuth()
  const locked = profile?.betsLocked ?? false
  const { bets: groupBets, loading: gLoading } = useGroupBets(user?.uid, locked)
  const { bets: koBets, loading: kLoading } = useKnockoutBets(user?.uid, locked)
  const { results, loading: rLoading } = useStandings()

  if (gLoading || kLoading || rLoading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" aria-label="Carregando apostas…" />
      </div>
    )
  }

  function handleWhatsApp() {
    const text = buildWhatsAppText(groupBets, koBets)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return (
    <div id="section-mybets" role="tabpanel">
      <StatusCard profile={profile} groupBets={groupBets} koBets={koBets} />
      <GroupBetsView bets={groupBets} results={results.groupStage} />
      <KnockoutBetsView groupBets={groupBets} koBets={koBets} koResults={results.knockout as Record<string, import('@/types').TeamId>} />
      <div className="mybets-export-wrap">
        <button className="btn btn-ghost btn-full" onClick={handleWhatsApp}>
          📤 Exportar via WhatsApp
        </button>
      </div>
    </div>
  )
}
