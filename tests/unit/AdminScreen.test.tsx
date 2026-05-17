import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { AdminScreen } from '@/screens/AdminScreen'
import * as firestore from '@/lib/firestore'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, ADMIN_EMAIL: 'admin@test.com' }))

vi.mock('@/lib/firestore', () => ({
  loadAdminUserList:    vi.fn().mockResolvedValue([
    { uid: 'u1', name: 'Lucas', email: 'lucas@test.com', betsLocked: true },
    { uid: 'u2', name: 'Ana Silva', email: 'ana@test.com', betsLocked: false },
    { uid: 'u3', name: 'João Costa', email: 'joao@test.com', betsLocked: false },
  ]),
  loadUserBetsForHistory: vi.fn().mockResolvedValue({ groupBets: {}, knockoutBets: {} }),
  lockBets:             vi.fn().mockResolvedValue(undefined),
  unlockUserBets:       vi.fn().mockResolvedValue(undefined),
  deleteUserData:       vi.fn().mockResolvedValue(undefined),
  loadResults:          vi.fn().mockResolvedValue({ groupStage: {}, knockout: {} }),
  saveGroupResults:     vi.fn().mockResolvedValue(undefined),
  saveKnockoutResults:  vi.fn().mockResolvedValue(undefined),
  loadAdminConfig:      vi.fn().mockResolvedValue({ registrationOpen: true, globalLocked: false }),
  saveAdminConfig:      vi.fn().mockResolvedValue(undefined),
  loadScoringConfig:    vi.fn().mockResolvedValue({}),
  saveScoringConfig:    vi.fn().mockResolvedValue(undefined),
  loadAllUsersForRanking: vi.fn().mockResolvedValue([]),
  updateRankingDoc:     vi.fn().mockResolvedValue(undefined),
  loadRanking:          vi.fn().mockResolvedValue([]),
}))

const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => mockUseAuth() }))

const MOCK_USERS = [
  { uid: 'u1', name: 'Lucas', email: 'lucas@test.com', betsLocked: true },
  { uid: 'u2', name: 'Ana Silva', email: 'ana@test.com', betsLocked: false },
  { uid: 'u3', name: 'João Costa', email: 'joao@test.com', betsLocked: false },
]

function resetMocks() {
  vi.mocked(firestore.loadAdminUserList).mockResolvedValue(MOCK_USERS)
  vi.mocked(firestore.loadUserBetsForHistory).mockResolvedValue({ groupBets: {}, knockoutBets: {} })
  vi.mocked(firestore.loadResults).mockResolvedValue({ groupStage: {}, knockout: {} })
  vi.mocked(firestore.loadAdminConfig).mockResolvedValue({ registrationOpen: true, globalLocked: false })
  vi.mocked(firestore.loadScoringConfig).mockResolvedValue({})
  vi.mocked(firestore.loadAllUsersForRanking).mockResolvedValue([])
}

function renderAdmin(isAdmin = true) {
  mockUseAuth.mockReturnValue({
    user: { uid: 'admin1' }, profile: { name: 'Admin', email: 'admin@test.com' },
    isAdmin, loading: false,
  })
  return render(<AdminScreen />)
}

// ─────────────────────────────────────────────────────────────────────────────
describe('AdminScreen — access control', () => {
  beforeEach(() => { vi.clearAllMocks(); resetMocks() })

  it('shows restricted message for non-admin', () => {
    renderAdmin(false)
    expect(screen.getByText(/Acesso restrito/)).toBeInTheDocument()
  })

  it('renders 3 tabs for admin', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getByRole('button', { name: 'Usuários' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resultados' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Config' })).toBeInTheDocument()
  })

  it('Usuários is active by default', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getByRole('button', { name: 'Usuários' })).toHaveClass('admin-tab--active')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('AdminScreen — Usuários tab', () => {
  beforeEach(() => { vi.clearAllMocks(); resetMocks() })

  it('loads and displays all users', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getByText('Lucas')).toBeInTheDocument()
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('João Costa')).toBeInTheDocument()
  })

  it('shows participant count', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getByText('3 participantes')).toBeInTheDocument()
  })

  it('shows locked badge for locked user', async () => {
    await act(async () => { renderAdmin() })
    const rows = screen.getAllByText('🔒')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('shows open badge for unlocked user', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getAllByText('🟢').length).toBeGreaterThan(0)
  })

  it('shows View bets button for each user', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getAllByLabelText('Ver apostas').length).toBe(3)
  })

  it('calls lockBets when Bloquear is clicked', async () => {
    await act(async () => { renderAdmin() })
    const lockBtns = screen.getAllByLabelText('Bloquear')
    await act(async () => { fireEvent.click(lockBtns[0]!) })
    expect(vi.mocked(firestore.lockBets)).toHaveBeenCalledOnce()
  })

  it('calls unlockUserBets when Desbloquear is clicked', async () => {
    await act(async () => { renderAdmin() })
    const unlockBtns = screen.getAllByLabelText('Desbloquear')
    await act(async () => { fireEvent.click(unlockBtns[0]!) })
    expect(vi.mocked(firestore.unlockUserBets)).toHaveBeenCalledOnce()
  })

  it('calls deleteUserData after confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await act(async () => { renderAdmin() })
    const deleteBtns = screen.getAllByLabelText('Excluir usuário')
    await act(async () => { fireEvent.click(deleteBtns[0]!) })
    expect(vi.mocked(firestore.deleteUserData)).toHaveBeenCalledOnce()
    vi.spyOn(window, 'confirm').mockRestore()
  })

  it('does not delete when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    await act(async () => { renderAdmin() })
    const deleteBtns = screen.getAllByLabelText('Excluir usuário')
    await act(async () => { fireEvent.click(deleteBtns[0]!) })
    expect(vi.mocked(firestore.deleteUserData)).not.toHaveBeenCalled()
    vi.spyOn(window, 'confirm').mockRestore()
  })

  it('removes user from list after delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await act(async () => { renderAdmin() })
    const deleteBtns = screen.getAllByLabelText('Excluir usuário')
    await act(async () => { fireEvent.click(deleteBtns[0]!) })
    expect(screen.queryByText('Lucas')).not.toBeInTheDocument()
    vi.spyOn(window, 'confirm').mockRestore()
  })

  it('opens bet history modal on view click', async () => {
    await act(async () => { renderAdmin() })
    const viewBtns = screen.getAllByLabelText('Ver apostas')
    await act(async () => { fireEvent.click(viewBtns[0]!) })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes bet history modal on Fechar click', async () => {
    await act(async () => { renderAdmin() })
    await act(async () => { fireEvent.click(screen.getAllByLabelText('Ver apostas')[0]!) })
    await act(async () => { fireEvent.click(screen.getByText('Fechar')) })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('modal shows user name in header', async () => {
    await act(async () => { renderAdmin() })
    await act(async () => { fireEvent.click(screen.getAllByLabelText('Ver apostas')[0]!) })
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText(/Lucas/)).toBeInTheDocument()
  })

  it('shows user email', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getByText('lucas@test.com')).toBeInTheDocument()
  })

  it('shows avatar initials', async () => {
    await act(async () => { renderAdmin() })
    expect(screen.getByText('AS')).toBeInTheDocument()  // Ana Silva
    expect(screen.getByText('JC')).toBeInTheDocument()  // João Costa
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('AdminScreen — Resultados tab', () => {
  beforeEach(() => { vi.clearAllMocks(); resetMocks() })

  async function openResultsTab() {
    await act(async () => { renderAdmin() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Resultados' })) })
  }

  it('renders Grupos and Mata-Mata sub-tabs', async () => {
    await openResultsTab()
    expect(screen.getByText(/⚽ Grupos/)).toBeInTheDocument()
    expect(screen.getByText(/⚡ Mata-Mata/)).toBeInTheDocument()
  })

  it('renders 12 group cards in Grupos sub-tab', async () => {
    await openResultsTab()
    for (const g of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
      expect(screen.getByText(`Grupo ${g}`)).toBeInTheDocument()
    }
  })

  it('group card expands on click', async () => {
    await openResultsTab()
    fireEvent.click(screen.getByText('Grupo A'))
    expect(screen.getAllByLabelText('Aumentar').length).toBeGreaterThan(0)
  })

  it('stepper increments result in group card', async () => {
    await openResultsTab()
    fireEvent.click(screen.getByText('Grupo A'))
    const incBtns = screen.getAllByLabelText('Aumentar')
    await act(async () => { fireEvent.click(incBtns[0]!) })
    await act(async () => { fireEvent.click(incBtns[1]!) })
    // At least one filled score is now shown
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
  })

  it('Salvar Resultados calls saveGroupResults', async () => {
    await openResultsTab()
    await act(async () => {
      fireEvent.click(screen.getByText('💾 Salvar Resultados'))
    })
    expect(vi.mocked(firestore.saveGroupResults)).toHaveBeenCalledOnce()
  })

  it('switches to Mata-Mata sub-tab', async () => {
    await openResultsTab()
    await act(async () => { fireEvent.click(screen.getByText(/⚡ Mata-Mata/)) })
    expect(screen.getByText('Round de 32')).toBeInTheDocument()
  })

  it('Salvar Resultados in Mata-Mata calls saveKnockoutResults', async () => {
    await openResultsTab()
    await act(async () => { fireEvent.click(screen.getByText(/⚡ Mata-Mata/)) })
    await act(async () => {
      fireEvent.click(screen.getByText('💾 Salvar Resultados'))
    })
    expect(vi.mocked(firestore.saveKnockoutResults)).toHaveBeenCalledOnce()
  })

  it('shows Oitavas in Mata-Mata', async () => {
    await openResultsTab()
    await act(async () => { fireEvent.click(screen.getByText(/⚡ Mata-Mata/)) })
    expect(screen.getByText('Oitavas')).toBeInTheDocument()
  })

  it('shows Final in Mata-Mata', async () => {
    await openResultsTab()
    await act(async () => { fireEvent.click(screen.getByText(/⚡ Mata-Mata/)) })
    expect(screen.getByText('Final')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('AdminScreen — Config tab', () => {
  beforeEach(() => { vi.clearAllMocks(); resetMocks() })

  async function openConfigTab() {
    await act(async () => { renderAdmin() })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Config' })) })
  }

  it('renders registration toggle', async () => {
    await openConfigTab()
    expect(screen.getByLabelText('toggle-reg')).toBeInTheDocument()
  })

  it('renders global lock toggle', async () => {
    await openConfigTab()
    expect(screen.getByLabelText('toggle-lock')).toBeInTheDocument()
  })

  it('registration toggle reflects loaded config', async () => {
    await openConfigTab()
    const toggle = screen.getByLabelText('toggle-reg') as HTMLInputElement
    expect(toggle.checked).toBe(true)
  })

  it('global lock toggle reflects loaded config', async () => {
    await openConfigTab()
    const toggle = screen.getByLabelText('toggle-lock') as HTMLInputElement
    expect(toggle.checked).toBe(false)
  })

  it('toggling registration calls saveAdminConfig', async () => {
    await openConfigTab()
    fireEvent.click(screen.getByLabelText('toggle-reg'))
    await act(async () => { fireEvent.click(screen.getByText('💾 Salvar Controles')) })
    expect(vi.mocked(firestore.saveAdminConfig)).toHaveBeenCalledWith(expect.objectContaining({ registrationOpen: false }))
  })

  it('toggling global lock calls saveAdminConfig with globalLocked', async () => {
    await openConfigTab()
    fireEvent.click(screen.getByLabelText('toggle-lock'))
    await act(async () => { fireEvent.click(screen.getByText('💾 Salvar Controles')) })
    expect(vi.mocked(firestore.saveAdminConfig)).toHaveBeenCalledWith(expect.objectContaining({ globalLocked: true }))
  })

  it('renders all 8 scoring fields', async () => {
    await openConfigTab()
    // getByLabelText matches by label text content
    expect(screen.getByLabelText('Placar exato')).toBeInTheDocument()
    expect(screen.getByLabelText('Resultado certo')).toBeInTheDocument()
    expect(screen.getByLabelText('R32 vencedor')).toBeInTheDocument()
    expect(screen.getByLabelText('R16 vencedor')).toBeInTheDocument()
    expect(screen.getByLabelText('Quartas vencedor')).toBeInTheDocument()
    expect(screen.getByLabelText('Semis vencedor')).toBeInTheDocument()
    expect(screen.getByLabelText('Campeão')).toBeInTheDocument()
    expect(screen.getByLabelText('Finalista bônus')).toBeInTheDocument()
  })

  it('scoring fields have default values from DEFAULT_SCORING', async () => {
    await openConfigTab()
    const exactInput = screen.getByLabelText('Placar exato') as HTMLInputElement
    expect(exactInput.value).toBe('17')
  })

  it('changing scoring field updates value', async () => {
    await openConfigTab()
    const exactInput = screen.getByLabelText('Placar exato')
    fireEvent.change(exactInput, { target: { value: '20' } })
    expect((exactInput as HTMLInputElement).value).toBe('20')
  })

  it('Salvar Pontuação calls saveScoringConfig', async () => {
    await openConfigTab()
    await act(async () => { fireEvent.click(screen.getByText('💾 Salvar Pontuação')) })
    expect(vi.mocked(firestore.saveScoringConfig)).toHaveBeenCalledOnce()
  })

  it('renders Recalcular Ranking button', async () => {
    await openConfigTab()
    expect(screen.getByLabelText('Recalcular ranking')).toBeInTheDocument()
  })

  it('Recalcular Ranking calls updateRankingDoc', async () => {
    await openConfigTab()
    await act(async () => { fireEvent.click(screen.getByLabelText('Recalcular ranking')) })
    expect(vi.mocked(firestore.updateRankingDoc)).toHaveBeenCalledOnce()
  })

  it('shows success message after recalc', async () => {
    await openConfigTab()
    await act(async () => { fireEvent.click(screen.getByLabelText('Recalcular ranking')) })
    expect(screen.getByText(/Ranking atualizado/)).toBeInTheDocument()
  })

  it('renders Seed button', async () => {
    await openConfigTab()
    expect(screen.getByLabelText('Seed usuários teste')).toBeInTheDocument()
  })

  it('renders Clear button', async () => {
    await openConfigTab()
    expect(screen.getByLabelText('Limpar dados teste')).toBeInTheDocument()
  })

  it('Seed button shows log area after click', async () => {
    const mockES = {
      onmessage: null as ((e: MessageEvent) => void) | null,
      onerror: null as ((e: Event) => void) | null,
      addEventListener: vi.fn(),
      close: vi.fn(),
    }
    vi.stubGlobal('EventSource', vi.fn().mockReturnValue(mockES))
    await openConfigTab()
    await act(async () => { fireEvent.click(screen.getByLabelText('Seed usuários teste')) })
    expect(screen.getByLabelText('Log do seed')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('Clear button shows log area after click', async () => {
    const mockES = {
      onmessage: null,
      onerror: null,
      addEventListener: vi.fn(),
      close: vi.fn(),
    }
    vi.stubGlobal('EventSource', vi.fn().mockReturnValue(mockES))
    await openConfigTab()
    await act(async () => { fireEvent.click(screen.getByLabelText('Limpar dados teste')) })
    expect(screen.getByLabelText('Log do seed')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
