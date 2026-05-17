import { useAuth } from '@/contexts/AuthContext'
import { useGroupBets } from '@/hooks/useGroupBets'
import { useKnockoutBets } from '@/hooks/useKnockoutBets'
import { GROUP_IDS } from '@/data/groups'
import { ProgressBar } from './ProgressBar'
import { GroupCard } from './GroupCard'
import { KnockoutSection } from './KnockoutSection'
import './BetScreen.css'

const TOTAL_GROUP_GAMES = 72

export function BetScreen() {
  const { user, globalLocked } = useAuth()
  // Bets are editable as long as admin hasn't activated the global lock.
  // Per-user betsLocked is no longer enforced on the participant's own screen.
  const locked = globalLocked
  const { bets, loading: gLoading, saving: gSaving, setBet, save: saveGroups } = useGroupBets(user?.uid, locked)
  const { bets: koBets, loading: kLoading, saving: kSaving, togglePick, setSingle, save: saveKo } = useKnockoutBets(user?.uid, locked)

  const filled = Object.values(bets).filter(b => b.homeGoals !== '' && b.awayGoals !== '').length

  if (gLoading || kLoading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" aria-label="Carregando apostas…" />
      </div>
    )
  }

  return (
    <div id="section-groups" role="tabpanel">
      <ProgressBar filled={filled} total={TOTAL_GROUP_GAMES} />

      {locked && (
        <div className="bet-lock-banner">
          🔒 Apostas bloqueadas pelo administrador. Edições não permitidas.
        </div>
      )}

      {GROUP_IDS.map((groupId, i) => (
        <GroupCard
          key={groupId}
          groupId={groupId}
          bets={bets}
          locked={locked}
          onChange={setBet}
          onSave={saveGroups}
          saving={gSaving}
          defaultOpen={i === 0}
        />
      ))}

      <KnockoutSection
        groupBets={bets}
        koBets={koBets}
        locked={locked}
        saving={kSaving}
        onToggle={togglePick}
        onSingle={setSingle}
        onSave={saveKo}
      />
    </div>
  )
}
