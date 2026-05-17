import { useAuth } from '@/contexts/AuthContext'
import { useGroupBets } from '@/hooks/useGroupBets'
import { useKnockoutBets } from '@/hooks/useKnockoutBets'
import { useStandings } from '@/hooks/useStandings'
import { GROUP_IDS, generateGroupGames } from '@/data/groups'
import { TEAMS } from '@/data/teams'
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

  const koRounds: { name: string; teams: string[] | undefined }[] = [
    { name: 'Round de 32', teams: koBets.r32 },
    { name: 'Oitavas',     teams: koBets.r16 },
    { name: 'Quartas',     teams: koBets.qf  },
    { name: 'Semifinais',  teams: koBets.sf  },
    { name: 'Campeão',     teams: koBets.champion ? [koBets.champion] : undefined },
    { name: '3° Lugar',    teams: koBets.third    ? [koBets.third]    : undefined },
  ]
  lines.push('', '*MATA-MATA*')
  for (const round of koRounds) {
    if (!round.teams?.length) continue
    lines.push(`\n${round.name}:`)
    for (const teamId of round.teams) {
      lines.push(`  ${TEAMS[teamId]?.name ?? teamId}`)
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
