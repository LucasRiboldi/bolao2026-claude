import { useState, useEffect } from 'react'
import {
  loadAdminConfig, saveAdminConfig,
  loadScoringConfig, saveScoringConfig,
  loadAllUsersForRanking, loadResults, updateRankingDoc,
} from '@/lib/firestore'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { DEFAULT_SCORING } from '@/data/bracket'
import type { AdminConfig, ScoringConfig } from '@/types'
import { AdminPageHeader } from './AdminPageHeader'

const SCORING_FIELDS: Array<{ key: keyof ScoringConfig; label: string; hint: string }> = [
  { key: 'exactScore',     label: 'Placar exato',     hint: 'Acertou exatamente o placar (ex: 2-1)' },
  { key: 'correctResult',  label: 'Resultado certo',  hint: 'Acertou só quem venceu / empatou' },
  { key: 'r32Winner',      label: 'R32 vencedor',     hint: 'Time avançou para as oitavas' },
  { key: 'r16Winner',      label: 'R16 vencedor',     hint: 'Time avançou para as quartas' },
  { key: 'qfWinner',       label: 'Quartas vencedor', hint: 'Time avançou para as semis' },
  { key: 'sfWinner',       label: 'Semis vencedor',   hint: 'Time avançou para a final' },
  { key: 'championScore',  label: 'Campeão',          hint: 'Acertou o campeão da Copa' },
  { key: 'finalistBonus',  label: 'Finalista bônus',  hint: 'Bônus por acertar os 2 finalistas' },
]

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <label className="admin-toggle" htmlFor={id}>
      <input id={id} aria-label={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="admin-toggle__track" />
    </label>
  )
}

export function ConfigTab() {
  const [config, setConfig] = useState<AdminConfig>({})
  const [scoring, setScoring] = useState<ScoringConfig>({ ...DEFAULT_SCORING })
  const [configLoading, setConfigLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingScoring, setSavingScoring] = useState(false)
  const [recalcBusy, setRecalcBusy] = useState(false)
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([loadAdminConfig(), loadScoringConfig()]).then(([cfg, sc]) => {
      setConfig(cfg)
      setScoring({ ...DEFAULT_SCORING, ...sc })
    }).finally(() => setConfigLoading(false))
  }, [])

  async function handleSaveConfig() {
    setSavingConfig(true)
    await saveAdminConfig(config)
    setSavingConfig(false)
  }

  async function handleSaveScoring() {
    setSavingScoring(true)
    await saveScoringConfig(scoring)
    setSavingScoring(false)
  }

  async function handleRecalc() {
    setRecalcBusy(true)
    setRecalcMsg(null)
    try {
      const [users, results] = await Promise.all([loadAllUsersForRanking(), loadResults(true)])
      const entries = users.map(u => {
        const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, results, scoring)
        return { uid: u.uid, name: u.profile.name ?? 'Sem nome', pts, breakdown }
      })
      await updateRankingDoc(sortRanking(entries))
      setRecalcMsg(`✓ Ranking atualizado — ${entries.length} participantes`)
    } catch {
      setRecalcMsg('✗ Erro ao recalcular ranking')
    } finally {
      setRecalcBusy(false)
    }
  }

  if (configLoading) {
    return <div className="spinner-wrap" style={{ paddingTop: 32 }}><div className="spinner" /></div>
  }

  return (
    <>
      <AdminPageHeader
        icon="⚙️"
        title="Configurações do bolão"
        description="Controle de cadastro, bloqueio global, pontuação e recálculo manual."
      />

      {/* ── Section: Acesso & controle ─────────────────────────────────────── */}
      <div className="admin-section-card">
        <div className="admin-section-card__header">
          <span className="admin-section-card__icon">🔐</span>
          <div>
            <h3 className="admin-section-card__title">Acesso &amp; controle</h3>
            <p className="admin-section-card__desc">
              Liga/desliga cadastro de novos participantes e bloqueia edições durante a Copa.
            </p>
          </div>
        </div>

        <div className="admin-config-row">
          <div>
            <div className="admin-config-row__label">Cadastro aberto</div>
            <div className="admin-config-row__sub">Permite novos participantes</div>
          </div>
          <Toggle
            id="toggle-reg"
            checked={config.registrationOpen ?? true}
            onChange={v => setConfig(c => ({ ...c, registrationOpen: v }))}
          />
        </div>

        <div className="admin-config-row">
          <div>
            <div className="admin-config-row__label">Bloqueio global de apostas</div>
            <div className="admin-config-row__sub">Impede que qualquer participante edite palpites</div>
          </div>
          <Toggle
            id="toggle-lock"
            checked={config.globalLocked ?? false}
            onChange={v => setConfig(c => ({ ...c, globalLocked: v }))}
          />
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSaveConfig} disabled={savingConfig}>
          {savingConfig ? 'Salvando…' : '💾 Salvar controles'}
        </button>
      </div>

      {/* ── Section: Pontuação ──────────────────────────────────────────────── */}
      <div className="admin-section-card">
        <div className="admin-section-card__header">
          <span className="admin-section-card__icon">🎯</span>
          <div>
            <h3 className="admin-section-card__title">Pontuação por acerto</h3>
            <p className="admin-section-card__desc">
              Quantos pontos cada tipo de acerto vale. Mudanças só afetam o ranking após recalcular.
            </p>
          </div>
        </div>

        <div className="admin-scoring-grid">
          {SCORING_FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="admin-scoring-field" title={hint}>
              <label htmlFor={`scoring-${key}`}>{label}</label>
              <input
                id={`scoring-${key}`}
                type="number"
                min="0"
                value={scoring[key]}
                onChange={e => setScoring(s => ({ ...s, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-ghost btn-full" onClick={handleSaveScoring} disabled={savingScoring}>
          {savingScoring ? 'Salvando…' : '💾 Salvar pontuação'}
        </button>
      </div>

      {/* ── Section: Ranking ──────────────────────────────────────────────── */}
      <div className="admin-section-card">
        <div className="admin-section-card__header">
          <span className="admin-section-card__icon">🔄</span>
          <div>
            <h3 className="admin-section-card__title">Ranking</h3>
            <p className="admin-section-card__desc">
              Recálculo manual é raramente necessário — o ranking se atualiza automaticamente após cada
              lançamento de resultado. Use isto somente se a pontuação parecer dessincronizada.
            </p>
          </div>
        </div>

        <button className="btn btn-gold btn-full" onClick={handleRecalc} disabled={recalcBusy}>
          {recalcBusy ? 'Calculando…' : '🔄 Recalcular ranking agora'}
        </button>
        {recalcMsg && (
          <p className={`admin-section-card__msg${recalcMsg.startsWith('✓') ? ' admin-section-card__msg--ok' : ' admin-section-card__msg--err'}`}>
            {recalcMsg}
          </p>
        )}
      </div>
    </>
  )
}
