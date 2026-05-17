import { useState } from 'react'
import type { GroupBets, KnockoutBets, KoArrayKey, KoSingleKey, TeamId } from '@/types'
import { TEAMS } from '@/data/teams'
import { buildR32 } from '@/data/bracket'
import { calcGroupStandings, getQualified } from '@/utils/standings'
import { Flag } from '@/components/Flag'
import { KO_ROUND_MAX } from '@/hooks/useKnockoutBets'

interface KnockoutSectionProps {
  groupBets: GroupBets
  koBets: KnockoutBets
  locked: boolean
  saving: boolean
  onToggle: (round: KoArrayKey, teamId: TeamId) => void
  onSingle: (round: KoSingleKey, teamId: TeamId) => void
  onSave: () => Promise<void>
}

const ROUND_COLORS: Record<string, string> = {
  r32:      '#e74c3c',
  r16:      '#e67e22',
  qf:       '#f39c12',
  sf:       '#2ecc71',
  champion: '#d4aa2c',
  third:    '#607d8b',
}

function sortTeams(ids: TeamId[]): TeamId[] {
  return [...ids].sort((a, b) => (TEAMS[a]?.name ?? '').localeCompare(TEAMS[b]?.name ?? '', 'pt-BR'))
}

function TeamChip({
  teamId, selected, locked, blocked, onClick,
}: {
  teamId: TeamId; selected: boolean; locked: boolean; blocked: boolean; onClick: () => void
}) {
  const team = TEAMS[teamId]
  if (!team) return null
  const disabled = locked || (blocked && !selected)
  return (
    <div
      className={[
        'ko-chip',
        selected ? 'ko-chip--selected' : '',
        locked ? 'ko-chip--locked' : '',
        blocked && !selected ? 'ko-chip--blocked' : '',
      ].filter(Boolean).join(' ')}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : 'button'}
      title={blocked && !selected ? `Limite atingido — desmarque outro para selecionar este` : team.name}
    >
      <Flag iso={team.iso} name={team.name} size="sm" />
      <span className="ko-chip__name">{team.name}</span>
      {selected && <span className="ko-chip__check">✓</span>}
    </div>
  )
}

interface RoundBlockProps {
  label: string
  colorKey: string
  teams: TeamId[]
  picked: TeamId[]
  target: number
  locked: boolean
  onToggle: (teamId: TeamId) => void
  cols?: number
}

function RoundBlock({ label, colorKey, teams, picked, target, locked, onToggle, cols = 4 }: RoundBlockProps) {
  const color = ROUND_COLORS[colorKey] ?? 'var(--border)'
  const count = picked.length
  const atMax = count >= target

  if (teams.length === 0) {
    return (
      <div className="ko-round-section">
        <div className="ko-round-header" style={{ borderLeftColor: color }}>
          <span className="ko-round-title">{label}</span>
          <span className="ko-round-badge" style={{ background: color }}>0/{target}</span>
        </div>
        <div className="ko-round-empty">Preencha a fase anterior primeiro</div>
      </div>
    )
  }

  const badgeStyle: React.CSSProperties = atMax
    ? { background: color, boxShadow: '0 0 0 2px rgba(74,222,128,.4)' }
    : { background: color }

  return (
    <div className="ko-round-section">
      <div className="ko-round-header" style={{ borderLeftColor: color }}>
        <span className="ko-round-title">{label}</span>
        <span className="ko-round-badge" style={badgeStyle}>
          {count}/{target}{atMax ? ' ✓' : ''}
        </span>
      </div>
      {atMax && (
        <div className="ko-round-hint">
          Limite atingido. Desmarque um time para escolher outro.
        </div>
      )}
      <div className="ko-chip-grid" style={{ '--ko-cols': cols } as React.CSSProperties}>
        {teams.map(teamId => (
          <TeamChip
            key={teamId}
            teamId={teamId}
            selected={picked.includes(teamId)}
            locked={locked}
            blocked={atMax}
            onClick={() => onToggle(teamId)}
          />
        ))}
      </div>
    </div>
  )
}

export function KnockoutSection({ groupBets, koBets, locked, saving, onToggle, onSingle, onSave }: KnockoutSectionProps) {
  const [saved, setSaved] = useState(false)

  const standings = calcGroupStandings(groupBets)
  const qualified = getQualified(standings)
  const r32Matches = buildR32(qualified)

  // Pool of teams for each round
  const r32Pool = sortTeams(
    [...new Set(r32Matches.flatMap(m => [m.home, m.away]).filter(Boolean) as TeamId[])]
  )
  const r16Pool = sortTeams(koBets.r32 ?? [])
  const qfPool  = sortTeams(koBets.r16 ?? [])
  const sfPool  = sortTeams(koBets.qf  ?? [])
  // 3rd-place candidates: 2 teams that lost in SF (i.e. in QF picks but NOT in SF picks)
  const thirdPool = sortTeams((koBets.qf ?? []).filter(t => !(koBets.sf ?? []).includes(t)))
  // Final candidates: the 2 SF winners (user's picks)
  const finalPool = sortTeams(koBets.sf ?? [])

  async function handleSave() {
    await onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="ko-section">
      <div className="ko-section-intro">
        <span>⚡ Mata-Mata</span>
        <span className="ko-section-intro__sub">Selecione os times que avançam em cada fase</span>
      </div>

      <RoundBlock
        label={`Round de 32 — escolha ${KO_ROUND_MAX.r32}`}
        colorKey="r32"
        teams={r32Pool}
        picked={koBets.r32 ?? []}
        target={KO_ROUND_MAX.r32}
        locked={locked}
        onToggle={t => onToggle('r32', t)}
      />

      <RoundBlock
        label={`Oitavas — escolha ${KO_ROUND_MAX.r16}`}
        colorKey="r16"
        teams={r16Pool}
        picked={koBets.r16 ?? []}
        target={KO_ROUND_MAX.r16}
        locked={locked}
        onToggle={t => onToggle('r16', t)}
      />

      <RoundBlock
        label={`Quartas — escolha ${KO_ROUND_MAX.qf}`}
        colorKey="qf"
        teams={qfPool}
        picked={koBets.qf ?? []}
        target={KO_ROUND_MAX.qf}
        locked={locked}
        onToggle={t => onToggle('qf', t)}
      />

      <RoundBlock
        label={`Semifinais — escolha ${KO_ROUND_MAX.sf} finalistas`}
        colorKey="sf"
        teams={sfPool}
        picked={koBets.sf ?? []}
        target={KO_ROUND_MAX.sf}
        locked={locked}
        onToggle={t => onToggle('sf', t)}
        cols={2}
      />

      {(thirdPool.length > 0 || finalPool.length > 0) && (
        <div className="ko-finals-row">
          <div className="ko-finals-col">
            <RoundBlock
              label="3° Lugar"
              colorKey="third"
              teams={thirdPool}
              picked={koBets.third ? [koBets.third] : []}
              target={1}
              locked={locked}
              onToggle={t => onSingle('third', t)}
              cols={1}
            />
          </div>
          <div className="ko-finals-col">
            <RoundBlock
              label="Campeão"
              colorKey="champion"
              teams={finalPool}
              picked={koBets.champion ? [koBets.champion] : []}
              target={1}
              locked={locked}
              onToggle={t => onSingle('champion', t)}
              cols={1}
            />
          </div>
        </div>
      )}

      {!locked && (
        <div className="ko-section__save-row">
          <button
            className={`btn btn-ghost btn-sm${saved ? ' btn--saved' : ''}`}
            onClick={handleSave}
            disabled={saving}
            aria-label="Salvar palpites do mata-mata"
          >
            {saved ? '✓ Salvo!' : saving ? 'Salvando…' : '💾 Salvar Mata-Mata'}
          </button>
        </div>
      )}
    </div>
  )
}
