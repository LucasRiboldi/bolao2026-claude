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
  const { user, profile } = useAuth()
  const locked = profile?.betsLocked ?? false
  const { bets, loading: gLoading, saving, setBet, save } = useGroupBets(user?.uid, locked)
  const { bets: koBets, loading: kLoading, pickWinner, persist } = useKnockoutBets(user?.uid, locked)

  const filled = Object.values(bets).filter(b => b.homeGoals !== '' && b.awayGoals !== '').length

  async function handleSave() {
    await save()
    await persist()
  }

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

      {GROUP_IDS.map((groupId, i) => (
        <GroupCard
          key={groupId}
          groupId={groupId}
          bets={bets}
          locked={locked}
          onChange={setBet}
          defaultOpen={i === 0}
        />
      ))}

      <KnockoutSection
        groupBets={bets}
        koBets={koBets}
        locked={locked}
        onPick={pickWinner}
      />

      {!locked && (
        <div className="bet-save-wrap">
          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando…' : 'Salvar Apostas'}
          </button>
        </div>
      )}

      {locked && (
        <div className="bet-save-wrap">
          <div style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text-muted)', padding: '8px' }}>
            🔒 Apostas bloqueadas
          </div>
        </div>
      )}
    </div>
  )
}
