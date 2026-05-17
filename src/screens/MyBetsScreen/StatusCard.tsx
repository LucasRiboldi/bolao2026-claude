import type { UserProfile, GroupBets, KnockoutBets } from '@/types'

interface StatusCardProps {
  profile: UserProfile | null
  groupBets: GroupBets
  koBets: KnockoutBets
}

function formatDate(iso: string | undefined): string | null {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return null
  }
}

export function StatusCard({ profile, groupBets, koBets }: StatusCardProps) {
  const locked = profile?.betsLocked ?? false
  const groupFilled = Object.values(groupBets).filter(
    b => b.homeGoals !== '' && b.awayGoals !== ''
  ).length
  const koFilled = Object.keys(koBets).length
  const savedDate = formatDate(profile?.betsSavedAt)

  return (
    <div className="mybets-status">
      <div className="mybets-status__icon">{locked ? '🔒' : '🟢'}</div>
      <div className="mybets-status__body">
        <div className="mybets-status__title">
          {locked ? 'Apostas salvas' : 'Apostas abertas para edição'}
        </div>
        <div className="mybets-status__counts">
          {groupFilled} / 72 grupos · {koFilled} mata-mata
        </div>
        {savedDate && (
          <div className="mybets-status__date">Salvo em: {savedDate}</div>
        )}
      </div>
    </div>
  )
}
