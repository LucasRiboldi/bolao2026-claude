import { useState, useRef } from 'react'
import {
  loadAllUsersForRanking, loadResults, updateRankingDoc,
  deleteUserData, loadAdminUserList,
  saveGroupResults, saveKnockoutResults,
} from '@/lib/firestore'
import { calculateScore, sortRanking } from '@/utils/scoring'
import { loadScoringConfig } from '@/lib/firestore'

const SEED_URL = 'http://localhost:3001'

const ADMIN_TOOLS = [
  {
    category: 'Usuários',
    tools: [
      { name: 'Ver apostas de participante', status: '✅', desc: 'Modal de histórico na aba Usuários → 📋' },
      { name: 'Editar apostas de participante', status: '✅', desc: 'Modal de edição na aba Usuários → ✏️' },
      { name: 'Bloquear/desbloquear apostas', status: '✅', desc: 'Aba Usuários → 🔒 / 🔓' },
      { name: 'Excluir participante', status: '✅', desc: 'Aba Usuários → 🗑 (remove perfil + apostas)' },
      { name: 'Banir e-mail (impedir recadastro)', status: '🔲', desc: 'Não implementado — requer Firebase Admin SDK' },
    ],
  },
  {
    category: 'Resultados',
    tools: [
      { name: 'Lançar resultados da fase de grupos', status: '✅', desc: 'Aba Resultados → sub-aba ⚽ Grupos' },
      { name: 'Lançar resultados do mata-mata', status: '✅', desc: 'Aba Resultados → sub-aba ⚡ Mata-Mata' },
      { name: 'Recalcular ranking manualmente', status: '✅', desc: 'Aba Configurações → Recalcular Ranking' },
      { name: 'Importar resultados de API externa', status: '🔲', desc: 'Não implementado — futuro: API-Football' },
      { name: 'Recalcular ranking automático ao salvar resultado', status: '🔲', desc: 'Não implementado — futuro: Cloud Function' },
    ],
  },
  {
    category: 'Configuração',
    tools: [
      { name: 'Abrir/fechar cadastro de novos participantes', status: '✅', desc: 'Aba Configurações → Cadastro aberto' },
      { name: 'Bloqueio global de apostas', status: '✅', desc: 'Aba Configurações → Bloqueio global' },
      { name: 'Configurar pontuação por tipo de acerto', status: '✅', desc: 'Aba Configurações → Pontuação (8 campos)' },
      { name: 'Exportar CSV do ranking', status: '🔲', desc: 'Não implementado — futuro' },
      { name: 'Enviar push notification ao ranking atualizar', status: '🔲', desc: 'Não implementado — futuro: Firebase Messaging' },
    ],
  },
  {
    category: 'Testes & Dados',
    tools: [
      { name: 'Seed de usuários de teste (10 usuários)', status: '✅', desc: 'Aba Configurações → Dados de Teste → 🌱 Seed' },
      { name: 'Limpar dados de teste', status: '✅', desc: 'Aba Configurações → Dados de Teste → 🗑 Clear' },
      { name: 'Simular resultados completos (esta aba)', status: '✅', desc: 'Ferramentas → Simulação → Preencher resultados aleatórios' },
      { name: 'Reset completo (todos os dados)', status: '✅', desc: 'Ferramentas → Reset → apagar tudo do banco' },
      { name: 'Relatório de participação', status: '🔲', desc: 'Não implementado — % de apostas preenchidas por usuário' },
    ],
  },
]

export function ToolsTab() {
  const [simLog, setSimLog] = useState<string[]>([])
  const [simBusy, setSimBusy] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [seedLog, setSeedLog] = useState<string[]>([])
  const [seedBusy, setSeedBusy] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  function addSimLog(msg: string) {
    setSimLog(prev => [...prev, msg])
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, 0)
  }

  async function runSeed(action: 'seed' | 'clear') {
    setSeedBusy(true)
    setSeedLog([`→ ${action}…`])
    const es = new EventSource(`${SEED_URL}/api/${action}`)
    es.onmessage = e => setSeedLog(prev => [...prev, e.data as string])
    es.onerror = () => { setSeedLog(prev => [...prev, '✗ Conexão encerrada']); es.close(); setSeedBusy(false) }
    es.addEventListener('done', () => { setSeedLog(prev => [...prev, '✓ Concluído']); es.close(); setSeedBusy(false) })
  }

  async function handleSimulate() {
    setSimBusy(true)
    setSimLog(['Iniciando simulação de resultados…'])
    try {
      addSimLog('Gerando resultados aleatórios para 72 jogos…')
      const groupResults: Record<string, { homeGoals: string; awayGoals: string }> = {}
      const groups = ['A','B','C','D','E','F','G','H','I','J','K','L']
      for (const g of groups) {
        for (let i = 0; i < 6; i++) {
          groupResults[`${g}_${i}`] = {
            homeGoals: String(Math.floor(Math.random() * 5)),
            awayGoals: String(Math.floor(Math.random() * 5)),
          }
        }
      }
      await saveGroupResults(groupResults)
      addSimLog(`✓ ${Object.keys(groupResults).length} resultados de grupos salvos`)

      addSimLog('Recalculando ranking…')
      const scoring = await loadScoringConfig()
      const [users, results] = await Promise.all([loadAllUsersForRanking(), loadResults(true)])
      const entries = users.map(u => {
        const { pts, breakdown } = calculateScore(u.groupBets, u.knockoutBets, results, { ...scoring } as never)
        return { uid: u.uid, name: u.profile.name ?? 'Sem nome', pts, breakdown }
      })
      await updateRankingDoc(sortRanking(entries))
      addSimLog(`✓ Ranking atualizado — ${entries.length} participantes`)
      addSimLog('✅ Simulação concluída!')
    } catch (e) {
      addSimLog(`✗ Erro: ${String(e)}`)
    } finally {
      setSimBusy(false)
    }
  }

  async function handleResetAll() {
    if (!confirm('⚠️ ATENÇÃO: Isso apagará TODOS os participantes e suas apostas do banco. Esta ação NÃO pode ser desfeita. Continuar?')) return
    if (!confirm('Tem ABSOLUTA certeza? Digite OK para confirmar.')) return
    setResetBusy(true)
    setSimLog(['Iniciando reset completo…'])
    try {
      const users = await loadAdminUserList()
      addSimLog(`Apagando ${users.length} usuários…`)
      for (const u of users) {
        await deleteUserData(u.uid)
        addSimLog(`  ✓ ${u.name ?? u.uid}`)
      }
      await saveGroupResults({})
      await saveKnockoutResults({})
      await updateRankingDoc([])
      addSimLog('✓ Resultados e ranking limpos')
      addSimLog('✅ Reset concluído!')
    } catch (e) {
      addSimLog(`✗ Erro: ${String(e)}`)
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <div className="admin-config-wrap">

      {/* ── Feature list ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Ferramentas do Sistema</div>
      {ADMIN_TOOLS.map(({ category, tools }) => (
        <div key={category} className="tools-category">
          <div className="tools-category__title">{category}</div>
          {tools.map(t => (
            <div key={t.name} className="tools-item">
              <span className="tools-item__status">{t.status}</span>
              <div className="tools-item__body">
                <div className="tools-item__name">{t.name}</div>
                <div className="tools-item__desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* ── Seed server ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Seed de Dados de Teste</div>
      <div className="admin-seed-wrap">
        <div className="admin-seed-wrap__title">Requer seed server em localhost:3001</div>
        <div className="admin-seed-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => runSeed('seed')} disabled={seedBusy} aria-label="Seed usuários teste">🌱 Seed</button>
          <button className="btn btn-ghost btn-sm" onClick={() => runSeed('clear')} disabled={seedBusy} aria-label="Limpar dados teste">🗑 Clear</button>
        </div>
        {seedLog.length > 0 && (
          <div className="admin-seed-log">{seedLog.map((l, i) => <div key={i}>{l}</div>)}</div>
        )}
      </div>

      {/* ── Simulate ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Simulação de Resultados</div>
      <p className="tools-hint">Gera resultados aleatórios para todos os 72 jogos de grupos e recalcula o ranking. Útil para testar o sistema completo.</p>
      <button className="btn btn-gold btn-full" onClick={handleSimulate} disabled={simBusy || resetBusy} aria-label="Simular resultados">
        {simBusy ? 'Simulando…' : '🎲 Simular Resultados + Ranking'}
      </button>

      {/* ── Reset ── */}
      <div className="admin-section-label" style={{ padding: '14px 0 6px' }}>Reset Completo</div>
      <p className="tools-hint" style={{ color: '#cf6679' }}>⚠️ Apaga TODOS os participantes, apostas, resultados e ranking. Ação irreversível.</p>
      <button className="btn btn-ghost btn-full" style={{ borderColor: '#cf6679', color: '#cf6679' }} onClick={handleResetAll} disabled={simBusy || resetBusy} aria-label="Reset completo">
        {resetBusy ? 'Apagando…' : '☢️ Reset Completo do Banco'}
      </button>

      {(simLog.length > 0 || resetBusy) && (
        <div ref={logRef} className="admin-seed-log" style={{ maxHeight: 160 }} aria-label="Log da simulação">
          {simLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  )
}
