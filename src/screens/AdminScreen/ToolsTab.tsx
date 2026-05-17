import { useState, useRef, useEffect } from 'react'
import {
  loadAllUsersForRanking, loadResults, updateRankingDoc,
  deleteUserData, loadAdminUserList,
  saveGroupResults, saveKnockoutResults,
  loadScoringConfig, loadAdminConfig, loadRanking,
  loadBlockedEmails, addBlockedEmail, removeBlockedEmail,
} from '@/lib/firestore'
import { seedTestData, undoSeedTestData, SEED_PREFIX } from '@/lib/seedTest'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { DEFAULT_SCORING } from '@/data/bracket'
import { TEAMS } from '@/data/teams'
import { GROUP_IDS, generateGroupGames } from '@/data/groups'
import type { UserWithBets } from '@/types'

const TOTAL_GROUP_GAMES = 72

// ── File download helper ─────────────────────────────────────────────────────
function downloadFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ts(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

// ── Tool card primitive ──────────────────────────────────────────────────────
interface ToolCardProps {
  icon: string
  title: string
  description: string
  tip?: string
  danger?: boolean
  children: React.ReactNode
}
function ToolCard({ icon, title, description, tip, danger, children }: ToolCardProps) {
  return (
    <div className={`tool-card${danger ? ' tool-card--danger' : ''}`}>
      <div className="tool-card__head">
        <span className="tool-card__icon">{icon}</span>
        <div className="tool-card__title-wrap">
          <h3 className="tool-card__title">{title}</h3>
          <p className="tool-card__desc">{description}</p>
        </div>
      </div>
      {tip && <p className="tool-card__tip">💡 {tip}</p>}
      <div className="tool-card__body">{children}</div>
    </div>
  )
}

// ── Category divider ─────────────────────────────────────────────────────────
function Category({ label }: { label: string }) {
  return <div className="tools-category-label">{label}</div>
}

// ── Main component ───────────────────────────────────────────────────────────
export function ToolsTab() {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [log, setLog] = useState<{ key: string; lines: string[] } | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  // Banlist state
  const [blockedEmails, setBlockedEmails] = useState<string[]>([])
  const [newBlockEmail, setNewBlockEmail] = useState('')

  // Seed result summary (count of users created/removed)
  const [seedSummary, setSeedSummary] = useState<string | null>(null)

  // Participation report state
  const [participation, setParticipation] = useState<null | {
    total: number
    filledFull: number
    filledPartial: number
    empty: number
    avgFilled: number
    bottom: Array<{ name: string; filled: number }>
  }>(null)

  // Diagnostics state
  const [diagnostics, setDiagnostics] = useState<null | string[]>(null)

  // Popular picks state
  const [popular, setPopular] = useState<null | {
    champion: Array<{ team: string; count: number; pct: number }>
    finalists: Array<{ team: string; count: number; pct: number }>
  }>(null)

  useEffect(() => {
    loadBlockedEmails().then(setBlockedEmails).catch(() => null)
  }, [])

  function startLog(key: string, line: string) {
    setLog({ key, lines: [line] })
    setBusyKey(key)
  }
  function appendLog(line: string) {
    setLog(prev => prev ? { ...prev, lines: [...prev.lines, line] } : prev)
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, 0)
  }
  function finishLog() { setBusyKey(null) }

  // ── EXPORT: Ranking CSV ────────────────────────────────────────────────────
  async function exportRankingCSV() {
    startLog('rank-csv', 'Carregando ranking…')
    try {
      const ranking = await loadRanking(true)
      const rows = [
        ['posicao', 'nome', 'pontos', 'placar_exato', 'resultado_correto', 'mata_mata', 'bonus'],
        ...ranking.map((r, i) => [
          i + 1,
          `"${(r.name ?? '').replace(/"/g, '""')}"`,
          r.pts,
          r.breakdown?.exact ?? 0,
          r.breakdown?.result ?? 0,
          r.breakdown?.ko ?? 0,
          r.breakdown?.bonus ?? 0,
        ]),
      ]
      const csv = rows.map(r => r.join(',')).join('\n')
      downloadFile(`bolao2026-ranking-${ts()}.csv`, csv, 'text/csv;charset=utf-8')
      appendLog(`✓ Exportado: ${ranking.length} entradas`)
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── EXPORT: Bets CSV ───────────────────────────────────────────────────────
  async function exportBetsCSV() {
    startLog('bets-csv', 'Carregando apostas de todos os participantes…')
    try {
      const users = await loadAllUsersForRanking()
      appendLog(`✓ ${users.length} participantes carregados`)
      const header = ['uid', 'nome', 'email', 'jogo_id', 'home', 'away', 'palpite_home', 'palpite_away']
      const rows: (string | number)[][] = [header]
      for (const u of users) {
        for (const gId of GROUP_IDS) {
          for (const game of generateGroupGames(gId)) {
            const bet = u.groupBets[game.id]
            if (!bet || bet.homeGoals === '' || bet.awayGoals === '') continue
            rows.push([
              u.uid,
              `"${(u.profile.name ?? '').replace(/"/g, '""')}"`,
              u.profile.email ?? '',
              game.id,
              game.home, game.away,
              bet.homeGoals, bet.awayGoals,
            ])
          }
        }
      }
      const csv = rows.map(r => r.join(',')).join('\n')
      downloadFile(`bolao2026-apostas-${ts()}.csv`, csv, 'text/csv;charset=utf-8')
      appendLog(`✓ Exportado: ${rows.length - 1} apostas individuais`)
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── EXPORT: Full snapshot JSON ─────────────────────────────────────────────
  async function exportSnapshot() {
    startLog('snapshot', 'Construindo snapshot completo…')
    try {
      const [users, results, ranking, scoring, config, blocked] = await Promise.all([
        loadAllUsersForRanking(),
        loadResults(true),
        loadRanking(true),
        loadScoringConfig(),
        loadAdminConfig(),
        loadBlockedEmails(),
      ])
      appendLog(`✓ ${users.length} users · ${ranking.length} no ranking · ${blocked.length} e-mails bloqueados`)
      const snapshot = {
        exportedAt: new Date().toISOString(),
        version: 1,
        users, results, ranking, scoring, config,
        blockedEmails: blocked,
      }
      downloadFile(
        `bolao2026-snapshot-${ts()}.json`,
        JSON.stringify(snapshot, null, 2),
        'application/json;charset=utf-8',
      )
      appendLog('✓ Download iniciado')
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── ANALYSIS: Participation report ─────────────────────────────────────────
  async function runParticipation() {
    startLog('participation', 'Calculando participação…')
    try {
      const users = await loadAllUsersForRanking()
      const stats = users.map(u => {
        const filled = Object.values(u.groupBets).filter(b => b.homeGoals !== '' && b.awayGoals !== '').length
        return { name: u.profile.name ?? 'Sem nome', filled }
      })
      const total = stats.length
      const filledFull = stats.filter(s => s.filled === TOTAL_GROUP_GAMES).length
      const filledPartial = stats.filter(s => s.filled > 0 && s.filled < TOTAL_GROUP_GAMES).length
      const empty = stats.filter(s => s.filled === 0).length
      const avgFilled = total ? Math.round(stats.reduce((a, s) => a + s.filled, 0) / total) : 0
      const bottom = stats.filter(s => s.filled < TOTAL_GROUP_GAMES)
        .sort((a, b) => a.filled - b.filled).slice(0, 5)
      setParticipation({ total, filledFull, filledPartial, empty, avgFilled, bottom })
      appendLog(`✓ ${total} participantes analisados`)
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── ANALYSIS: Database diagnostics ─────────────────────────────────────────
  async function runDiagnostics() {
    startLog('diag', 'Rodando diagnóstico…')
    try {
      const findings: string[] = []
      const [users, results, ranking] = await Promise.all([
        loadAllUsersForRanking(), loadResults(true), loadRanking(true),
      ])

      const usersNoName = users.filter(u => !u.profile.name?.trim())
      if (usersNoName.length) findings.push(`⚠ ${usersNoName.length} usuário(s) sem nome no perfil`)
      else findings.push('✓ Todos os usuários têm nome')

      const usersNoEmail = users.filter(u => !u.profile.email?.trim())
      if (usersNoEmail.length) findings.push(`⚠ ${usersNoEmail.length} usuário(s) sem e-mail no perfil`)
      else findings.push('✓ Todos os usuários têm e-mail')

      const resultsCount = Object.keys(results.groupStage).length
      findings.push(`ℹ ${resultsCount}/72 resultados de grupo lançados`)
      const koResultsCount = Object.keys(results.knockout).length
      findings.push(`ℹ ${koResultsCount}/32 resultados de mata-mata lançados`)

      const usersInRanking = new Set(ranking.map(r => r.uid))
      const usersNotInRanking = users.filter(u => !usersInRanking.has(u.uid))
      if (usersNotInRanking.length) findings.push(`⚠ ${usersNotInRanking.length} usuário(s) não estão no ranking — rode "Recalcular ranking"`)
      else findings.push('✓ Ranking inclui todos os participantes')

      const rankingButNotUser = ranking.filter(r => !users.find(u => u.uid === r.uid))
      if (rankingButNotUser.length) findings.push(`⚠ ${rankingButNotUser.length} entrada(s) órfã(s) no ranking (user deletado mas ainda na lista)`)
      else findings.push('✓ Sem entradas órfãs no ranking')

      setDiagnostics(findings)
      appendLog('✓ Diagnóstico concluído')
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── ANALYSIS: Popular picks ────────────────────────────────────────────────
  async function runPopular() {
    startLog('popular', 'Agregando palpites…')
    try {
      const users = await loadAllUsersForRanking()
      const total = users.length || 1

      const champCount = new Map<string, number>()
      const sfCount = new Map<string, number>()
      for (const u of users) {
        if (u.knockoutBets.champion) {
          champCount.set(u.knockoutBets.champion, (champCount.get(u.knockoutBets.champion) ?? 0) + 1)
        }
        for (const t of u.knockoutBets.sf ?? []) {
          sfCount.set(t, (sfCount.get(t) ?? 0) + 1)
        }
      }

      const toRanking = (m: Map<string, number>) =>
        [...m.entries()]
          .map(([team, count]) => ({ team: TEAMS[team]?.name ?? team, count, pct: Math.round((count / total) * 100) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

      setPopular({ champion: toRanking(champCount), finalists: toRanking(sfCount) })
      appendLog(`✓ ${users.length} apostas agregadas`)
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── BANLIST ────────────────────────────────────────────────────────────────
  async function handleAddBlocked() {
    if (!newBlockEmail.trim()) return
    setBusyKey('ban')
    try {
      await addBlockedEmail(newBlockEmail)
      const list = await loadBlockedEmails()
      setBlockedEmails(list)
      setNewBlockEmail('')
    } finally {
      setBusyKey(null)
    }
  }
  async function handleRemoveBlocked(email: string) {
    setBusyKey('ban')
    try {
      await removeBlockedEmail(email)
      const list = await loadBlockedEmails()
      setBlockedEmails(list)
    } finally {
      setBusyKey(null)
    }
  }

  // ── DEV: Seed test data (in-browser, no external server) ──────────────────
  async function handleSeedTest() {
    if (!confirm(
      'Criar 20 usuários de teste + apostas aleatórias + resultados oficiais aleatórios + recalcular ranking?\n\n' +
      'Existirá um botão para desfazer toda a operação.'
    )) return
    setSeedSummary(null)
    startLog('seedtest', '▶ Iniciando seed completo…')
    try {
      const created = await seedTestData({
        count: 20,
        withResults: true,
        log: line => appendLog(line),
      })
      setSeedSummary(`✓ ${created} usuários teste · resultados oficiais aleatórios · ranking recalculado`)
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  async function handleUndoSeed() {
    if (!confirm(
      'Desfazer TODO o seed?\n\n' +
      `Apaga apenas usuários com prefixo "${SEED_PREFIX}", limpa resultados oficiais e recalcula o ranking dos usuários reais restantes.\n\n` +
      'Usuários REAIS (que se cadastraram normalmente) NÃO são afetados.'
    )) return
    setSeedSummary(null)
    startLog('seedtest', '▶ Iniciando undo do seed…')
    try {
      const removed = await undoSeedTestData(line => appendLog(line))
      setSeedSummary(`✓ ${removed} usuário(s) teste removidos · resultados zerados · ranking recalculado`)
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── DEV: Simulate results ──────────────────────────────────────────────────
  async function handleSimulate() {
    startLog('sim', 'Gerando resultados aleatórios para 72 jogos…')
    try {
      const groupResults: Record<string, { homeGoals: string; awayGoals: string }> = {}
      for (const g of GROUP_IDS) {
        for (let i = 0; i < 6; i++) {
          groupResults[`${g}_${i}`] = {
            homeGoals: String(Math.floor(Math.random() * 5)),
            awayGoals: String(Math.floor(Math.random() * 5)),
          }
        }
      }
      await saveGroupResults(groupResults)
      appendLog(`✓ ${Object.keys(groupResults).length} resultados salvos`)
      appendLog('Recalculando ranking…')
      const [users, results, scoring] = await Promise.all([
        loadAllUsersForRanking(), loadResults(true), loadScoringConfig(),
      ])
      const merged = { ...DEFAULT_SCORING, ...scoring }
      const entries = users.map((u: UserWithBets) => {
        const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, results, merged)
        return { uid: u.uid, name: u.profile.name ?? 'Sem nome', pts, breakdown }
      })
      await updateRankingDoc(sortRanking(entries))
      appendLog(`✓ Ranking atualizado — ${entries.length} participantes`)
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  // ── DANGER: Reset all ──────────────────────────────────────────────────────
  async function handleResetAll() {
    if (!confirm('⚠️ ATENÇÃO: apaga TODOS os participantes, apostas, resultados e ranking. Esta ação NÃO pode ser desfeita. Continuar?')) return
    if (!confirm('Tem ABSOLUTA certeza? Esta é a última chance de cancelar.')) return
    startLog('reset', 'Iniciando reset completo…')
    try {
      const users = await loadAdminUserList()
      appendLog(`Apagando ${users.length} usuários…`)
      for (const u of users) {
        await deleteUserData(u.uid)
        appendLog(`  ✓ ${u.name ?? u.uid}`)
      }
      await saveGroupResults({})
      await saveKnockoutResults({})
      await updateRankingDoc([])
      appendLog('✅ Reset concluído!')
    } catch (e) {
      appendLog(`✗ Erro: ${String(e)}`)
    } finally { finishLog() }
  }

  const isBusy = busyKey !== null

  return (
    <div className="tools-wrap">

      {/* ═══ Análise & Relatórios ════════════════════════════════════════════ */}
      <Category label="📊 Análise & Relatórios" />

      <ToolCard
        icon="📈"
        title="Relatório de participação"
        description="Quantos participantes preencheram apostas, quem ainda não apostou, e a média de palpites por usuário."
        tip="Use antes do primeiro jogo pra avisar quem esqueceu de apostar."
      >
        <button className="btn btn-ghost btn-sm" disabled={isBusy} onClick={runParticipation}>
          {busyKey === 'participation' ? 'Calculando…' : '📊 Gerar relatório'}
        </button>
        {participation && (
          <div className="tool-result">
            <div className="tool-stat-grid">
              <div className="tool-stat"><strong>{participation.total}</strong><span>total</span></div>
              <div className="tool-stat"><strong>{participation.filledFull}</strong><span>completos</span></div>
              <div className="tool-stat"><strong>{participation.filledPartial}</strong><span>parciais</span></div>
              <div className="tool-stat"><strong>{participation.empty}</strong><span>sem apostar</span></div>
              <div className="tool-stat"><strong>{participation.avgFilled}/72</strong><span>média</span></div>
            </div>
            {participation.bottom.length > 0 && (
              <>
                <div className="tool-result__subtitle">Quem precisa de lembrete (menos apostas)</div>
                <ul className="tool-list">
                  {participation.bottom.map(u => (
                    <li key={u.name}><span>{u.name}</span><span className="muted">{u.filled}/72</span></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </ToolCard>

      <ToolCard
        icon="🔍"
        title="Diagnóstico de integridade"
        description="Verifica usuários sem perfil/e-mail, entradas órfãs no ranking, e quantidade de resultados lançados."
        tip="Rode após qualquer reset, importação ou exclusão em massa pra confirmar que o banco está consistente."
      >
        <button className="btn btn-ghost btn-sm" disabled={isBusy} onClick={runDiagnostics}>
          {busyKey === 'diag' ? 'Verificando…' : '🩺 Rodar diagnóstico'}
        </button>
        {diagnostics && (
          <ul className="tool-list tool-list--bare">
            {diagnostics.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}
      </ToolCard>

      <ToolCard
        icon="🏆"
        title="Palpites populares"
        description="Top 5 times mais escolhidos para Campeão e para Finalistas (semifinais)."
        tip="Útil pra publicar nas redes: 'X% do bolão acredita no Brasil campeão'."
      >
        <button className="btn btn-ghost btn-sm" disabled={isBusy} onClick={runPopular}>
          {busyKey === 'popular' ? 'Agregando…' : '🎯 Calcular'}
        </button>
        {popular && (
          <div className="tool-result">
            <div className="tool-result__subtitle">🏆 Campeão</div>
            <ul className="tool-list">
              {popular.champion.length === 0 && <li className="muted">Nenhum palpite ainda</li>}
              {popular.champion.map(p => (
                <li key={p.team}><span>{p.team}</span><span className="muted">{p.count} ({p.pct}%)</span></li>
              ))}
            </ul>
            <div className="tool-result__subtitle">🥈 Finalistas</div>
            <ul className="tool-list">
              {popular.finalists.length === 0 && <li className="muted">Nenhum palpite ainda</li>}
              {popular.finalists.map(p => (
                <li key={p.team}><span>{p.team}</span><span className="muted">{p.count} ({p.pct}%)</span></li>
              ))}
            </ul>
          </div>
        )}
      </ToolCard>

      {/* ═══ Exportar ════════════════════════════════════════════════════════ */}
      <Category label="📤 Exportar" />

      <ToolCard
        icon="📥"
        title="Snapshot completo do banco (JSON)"
        description="Backup integral: participantes, apostas, resultados, ranking, config e banlist em um único arquivo."
        tip="Faça um snapshot ANTES de cada lançamento de resultado importante. Se algo der errado, você consegue voltar ao estado anterior."
      >
        <button className="btn btn-gold btn-sm" disabled={isBusy} onClick={exportSnapshot}>
          {busyKey === 'snapshot' ? 'Construindo…' : '⬇ Baixar snapshot'}
        </button>
      </ToolCard>

      <ToolCard
        icon="📊"
        title="Ranking em CSV"
        description="Planilha com posição, nome, pontos e breakdown (placar exato, resultado, mata-mata, bônus)."
        tip="Abra no Excel ou Google Sheets pra compartilhar com o grupo."
      >
        <button className="btn btn-ghost btn-sm" disabled={isBusy} onClick={exportRankingCSV}>
          {busyKey === 'rank-csv' ? 'Exportando…' : '⬇ Baixar ranking.csv'}
        </button>
      </ToolCard>

      <ToolCard
        icon="🎫"
        title="Apostas em CSV"
        description="Todas as apostas de fase de grupos de todos os participantes (1 linha por palpite)."
        tip="Útil para auditoria, análise estatística ou se um participante reclamar de pontuação."
      >
        <button className="btn btn-ghost btn-sm" disabled={isBusy} onClick={exportBetsCSV}>
          {busyKey === 'bets-csv' ? 'Exportando…' : '⬇ Baixar apostas.csv'}
        </button>
      </ToolCard>

      {/* ═══ Moderação ═══════════════════════════════════════════════════════ */}
      <Category label="🚫 Moderação" />

      <ToolCard
        icon="📛"
        title="E-mails bloqueados"
        description="Lista de e-mails impedidos de se cadastrar. Bloquear aqui é independente de deletar a conta — útil pra impedir recadastro."
        tip="Fluxo típico: exclua a conta na aba Usuários → bloqueie o e-mail aqui pra evitar que a pessoa volte."
      >
        <div className="ban-input-row">
          <input
            type="email"
            className="input"
            placeholder="exemplo@dominio.com"
            value={newBlockEmail}
            onChange={e => setNewBlockEmail(e.target.value)}
            disabled={busyKey === 'ban'}
          />
          <button className="btn btn-danger btn-sm" disabled={!newBlockEmail.trim() || busyKey === 'ban'} onClick={handleAddBlocked}>
            Bloquear
          </button>
        </div>
        {blockedEmails.length > 0 && (
          <ul className="tool-list">
            {blockedEmails.map(email => (
              <li key={email}>
                <span>{email}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={busyKey === 'ban'}
                  onClick={() => handleRemoveBlocked(email)}
                  aria-label={`Desbloquear ${email}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {blockedEmails.length === 0 && (
          <p className="tool-empty-hint">Nenhum e-mail bloqueado.</p>
        )}
      </ToolCard>

      {/* ═══ Testes (DEV) ════════════════════════════════════════════════════ */}
      <Category label="🧪 Testes (desenvolvimento)" />

      <ToolCard
        icon="🌱"
        title="Seed completo (20 usuários + resultados + ranking)"
        description="Cria 20 participantes de teste com apostas aleatórias, gera resultados oficiais aleatórios para a Copa inteira (grupos + mata-mata) e recalcula o ranking de todos. Roda 100% no navegador — não precisa de servidor externo."
        tip="Útil pra testar a experiência completa: depois de rodar, abra Ranking / Copa / Apostas em outras abas e veja tudo populado. O botão de desfazer abaixo remove SÓ os usuários teste — usuários reais não são afetados."
      >
        <div className="sg-row">
          <button className="btn btn-gold btn-sm" disabled={isBusy} onClick={handleSeedTest}>
            {busyKey === 'seedtest' && log?.lines[0]?.includes('seed') ? 'Seedando…' : '🌱 Criar dados de teste'}
          </button>
          <button className="btn btn-danger btn-sm" disabled={isBusy} onClick={handleUndoSeed}>
            {busyKey === 'seedtest' && log?.lines[0]?.includes('undo') ? 'Desfazendo…' : '↩ Desfazer seed'}
          </button>
        </div>
        {seedSummary && (
          <p className="tool-card__tip" style={{ background: 'var(--color-success-soft)', borderLeftColor: 'var(--color-success)', color: 'var(--color-success-text)' }}>
            {seedSummary}
          </p>
        )}
      </ToolCard>

      <ToolCard
        icon="🎲"
        title="Simular resultados aleatórios"
        description="Gera placares aleatórios (0–4 gols) para todos os 72 jogos de grupos e recalcula o ranking."
        tip="Use pra testar o sistema de pontuação ao vivo: depois de simular, abra o Ranking em outra aba e veja a movimentação."
      >
        <button className="btn btn-gold btn-sm" disabled={isBusy} onClick={handleSimulate}>
          {busyKey === 'sim' ? 'Simulando…' : '🎲 Simular + recalcular'}
        </button>
      </ToolCard>

      {/* ═══ Zona de perigo ══════════════════════════════════════════════════ */}
      <Category label="⚠️ Zona de perigo" />

      <ToolCard
        icon="☢️"
        title="Reset completo do banco"
        description="Apaga TODOS os participantes, apostas, resultados oficiais, ranking e config. Mantém apenas a estrutura."
        tip="Antes de usar: BAIXE UM SNAPSHOT (acima em Exportar). Sem ele, não há como reverter."
        danger
      >
        <button className="btn btn-danger btn-sm" disabled={isBusy} onClick={handleResetAll}>
          {busyKey === 'reset' ? 'Apagando…' : '☢️ Reset completo (confirmação dupla)'}
        </button>
      </ToolCard>

      {/* ═══ Live log (apenas pra ações que loggam) ══════════════════════════ */}
      {log && (
        <div className="tools-log-wrap">
          <div className="tools-log-wrap__title">📋 Último log</div>
          <div ref={logRef} className="admin-seed-log" aria-label="Log da operação">
            {log.lines.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
