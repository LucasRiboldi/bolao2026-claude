/**
 * KPI dashboard shown at the top of the admin area. Loads real-time
 * counts and surfaces the state of the system at a glance:
 *   - Total participants
 *   - Results entered (group + KO)
 *   - Current leader
 *   - Lock / registration status
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  loadAdminUserList, loadResults, loadRanking, loadAdminConfig,
} from '@/lib/firestore'

interface Kpis {
  totalUsers: number
  groupResults: number
  koResults: number
  leader: { name: string; pts: number } | null
  regOpen: boolean
  globalLocked: boolean
  loading: boolean
}

const INITIAL: Kpis = {
  totalUsers: 0,
  groupResults: 0,
  koResults: 0,
  leader: null,
  regOpen: true,
  globalLocked: false,
  loading: true,
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [kpis, setKpis] = useState<Kpis>(INITIAL)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [users, results, ranking, config] = await Promise.all([
          loadAdminUserList(),
          loadResults(true),
          loadRanking(true),
          loadAdminConfig(),
        ])
        if (cancelled) return
        const leader = ranking[0] ?? null
        setKpis({
          totalUsers: users.length,
          groupResults: Object.keys(results.groupStage).length,
          koResults: Object.keys(results.knockout).length,
          leader: leader ? { name: leader.name, pts: leader.pts } : null,
          regOpen: config.registrationOpen ?? true,
          globalLocked: config.globalLocked ?? false,
          loading: false,
        })
      } catch {
        if (!cancelled) setKpis(s => ({ ...s, loading: false }))
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return (
    <section className="admin-dashboard" aria-label="Resumo do painel administrativo">
      <div className="admin-dashboard__greeting">
        <span className="admin-dashboard__welcome">Painel administrativo</span>
        <span className="admin-dashboard__user">{user?.email}</span>
      </div>

      <div className="admin-kpi-grid">
        <KpiCard
          icon="👥"
          label="Participantes"
          value={kpis.loading ? '—' : kpis.totalUsers}
          tone="neutral"
        />
        <KpiCard
          icon="⚽"
          label="Resultados grupos"
          value={kpis.loading ? '—' : `${kpis.groupResults}/72`}
          tone={kpis.groupResults === 0 ? 'neutral' : kpis.groupResults < 72 ? 'warning' : 'success'}
        />
        <KpiCard
          icon="⚡"
          label="Resultados mata-mata"
          value={kpis.loading ? '—' : `${kpis.koResults}/32`}
          tone={kpis.koResults === 0 ? 'neutral' : kpis.koResults < 32 ? 'warning' : 'success'}
        />
        <KpiCard
          icon="🏆"
          label="Líder do ranking"
          value={kpis.loading ? '—' : (kpis.leader ? kpis.leader.name : '—')}
          sub={kpis.leader ? `${kpis.leader.pts} pts` : ''}
          tone={kpis.leader ? 'gold' : 'neutral'}
        />
      </div>

      <div className="admin-dashboard__status-row">
        <StatusPill
          label="Cadastro"
          state={kpis.regOpen ? 'on' : 'off'}
          onLabel="Aberto"
          offLabel="Fechado"
        />
        <StatusPill
          label="Bloqueio global"
          state={kpis.globalLocked ? 'on' : 'off'}
          onLabel="Apostas trancadas"
          offLabel="Apostas liberadas"
          invertColor
        />
      </div>
    </section>
  )
}

interface KpiCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  tone: 'neutral' | 'success' | 'warning' | 'gold'
}
function KpiCard({ icon, label, value, sub, tone }: KpiCardProps) {
  return (
    <div className={`admin-kpi admin-kpi--${tone}`}>
      <span className="admin-kpi__icon" aria-hidden="true">{icon}</span>
      <div className="admin-kpi__body">
        <div className="admin-kpi__value">{value}</div>
        <div className="admin-kpi__label">{label}</div>
        {sub && <div className="admin-kpi__sub">{sub}</div>}
      </div>
    </div>
  )
}

interface StatusPillProps {
  label: string
  state: 'on' | 'off'
  onLabel: string
  offLabel: string
  /** When true, "on" = warning instead of success (useful for "is locked"). */
  invertColor?: boolean
}
function StatusPill({ label, state, onLabel, offLabel, invertColor }: StatusPillProps) {
  const isWarning = invertColor ? state === 'on' : state === 'off'
  const tone = isWarning ? 'warning' : 'success'
  return (
    <div className={`admin-status-pill admin-status-pill--${tone}`}>
      <span className="admin-status-pill__label">{label}:</span>
      <span className="admin-status-pill__dot" />
      <strong className="admin-status-pill__value">
        {state === 'on' ? onLabel : offLabel}
      </strong>
    </div>
  )
}
