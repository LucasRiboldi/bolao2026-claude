import { useState, useEffect, useRef } from 'react'
import {
  loadAdminConfig, saveAdminConfig,
  loadScoringConfig, saveScoringConfig,
  loadAllUsersForRanking, loadResults, updateRankingDoc,
} from '@/lib/firestore'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { DEFAULT_SCORING } from '@/data/bracket'
import type { AdminConfig, ScoringConfig } from '@/types'

const SEED_URL = 'http://localhost:3001'

const SCORING_FIELDS: Array<{ key: keyof ScoringConfig; label: string }> = [
  { key: 'exactScore',     label: 'Placar exato' },
  { key: 'correctResult',  label: 'Resultado certo' },
  { key: 'r32Winner',      label: 'R32 vencedor' },
  { key: 'r16Winner',      label: 'R16 vencedor' },
  { key: 'qfWinner',       label: 'Quartas vencedor' },
  { key: 'sfWinner',       label: 'Semis vencedor' },
  { key: 'championScore',  label: 'Campeão' },
  { key: 'finalistBonus',  label: 'Finalista bônus' },
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
  const [seedLog, setSeedLog] = useState<string[]>([])
  const [seedBusy, setSeedBusy] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([loadAdminConfig(), loadScoringConfig()]).then(([cfg, sc]) => {
      setConfig(cfg)
      setScoring({ ...DEFAULT_SCORING, ...sc })
    }).finally(() => setConfigLoading(false))
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [seedLog])

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

  function addLog(msg: string) {
    setSeedLog(prev => [...prev, msg])
  }

  async function runSeed(action: 'seed' | 'clear') {
    setSeedBusy(true)
    setSeedLog([`→ ${action}…`])
    try {
      const es = new EventSource(`${SEED_URL}/api/${action}`)
      es.onmessage = e => addLog(e.data as string)
      es.onerror = () => { addLog('✗ Conexão encerrada'); es.close(); setSeedBusy(false) }
      es.addEventListener('done', () => { addLog('✓ Concluído'); es.close(); setSeedBusy(false) })
    } catch {
      addLog('✗ Seed server indisponível (rode: node tools/seed/seed-server.js)')
      setSeedBusy(false)
    }
  }

  if (configLoading) return <div className="spinner-wrap" style={{ paddingTop: 32 }}><div className="spinner" /></div>

  return (
    <div className="admin-config-wrap">
      {/* ── Registration & lock ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Controles</div>

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
          <div className="admin-config-row__label">Bloqueio global</div>
          <div className="admin-config-row__sub">Impede edição de apostas</div>
        </div>
        <Toggle
          id="toggle-lock"
          checked={config.globalLocked ?? false}
          onChange={v => setConfig(c => ({ ...c, globalLocked: v }))}
        />
      </div>

      <button className="btn btn-primary btn-full" onClick={handleSaveConfig} disabled={savingConfig}>
        {savingConfig ? 'Salvando…' : '💾 Salvar Controles'}
      </button>

      {/* ── Scoring ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Pontuação</div>
      <div className="admin-scoring-grid">
        {SCORING_FIELDS.map(({ key, label }) => (
          <div key={key} className="admin-scoring-field">
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
        {savingScoring ? 'Salvando…' : '💾 Salvar Pontuação'}
      </button>

      {/* ── Ranking ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Ranking</div>
      <button className="btn btn-gold btn-full" onClick={handleRecalc} disabled={recalcBusy} aria-label="Recalcular ranking">
        {recalcBusy ? 'Calculando…' : '🔄 Recalcular Ranking'}
      </button>
      {recalcMsg && <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 6 }}>{recalcMsg}</div>}

      {/* ── Seed ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Dados de Teste</div>
      <div className="admin-seed-wrap">
        <div className="admin-seed-wrap__title">Seed server em localhost:3001</div>
        <div className="admin-seed-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => runSeed('seed')} disabled={seedBusy} aria-label="Seed usuários teste">
            🌱 Seed
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => runSeed('clear')} disabled={seedBusy} aria-label="Limpar dados teste">
            🗑 Clear
          </button>
        </div>
        {seedLog.length > 0 && (
          <div ref={logRef} className="admin-seed-log" aria-label="Log do seed">
            {seedLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}
