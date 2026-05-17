import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BetScreen } from '@/screens/BetScreen'
import * as firestore from '@/lib/firestore'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, ADMIN_EMAIL: 'admin@test.com' }))
vi.mock('@/lib/firestore', () => ({
  loadGroupBets: vi.fn().mockResolvedValue({}),
  saveGroupBets: vi.fn().mockResolvedValue(undefined),
  lockBets: vi.fn().mockResolvedValue(undefined),
  loadKnockoutBets: vi.fn().mockResolvedValue({}),
  saveKnockoutBets: vi.fn().mockResolvedValue(undefined),
}))

const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderScreen(locked = false) {
  mockUseAuth.mockReturnValue({
    user: { uid: 'u1' },
    profile: { name: 'Lucas', email: 'lucas@test.com', betsLocked: locked },
    isAdmin: false,
    loading: false,
  })
  return render(<BetScreen />)
}

describe('BetScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading spinner while fetching bets', () => {
    vi.mocked(firestore.loadGroupBets).mockReturnValueOnce(new Promise(() => {}))
    renderScreen()
    expect(screen.getByLabelText('Carregando apostas…')).toBeInTheDocument()
  })

  it('renders progress bar after loading', async () => {
    await act(async () => { renderScreen() })
    expect(screen.getByText('Apostas preenchidas')).toBeInTheDocument()
    expect(screen.getByText('0 / 72')).toBeInTheDocument()
  })

  it('renders 12 group cards', async () => {
    await act(async () => { renderScreen() })
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    for (const g of groups) {
      expect(screen.getByText(`Grupo ${g}`)).toBeInTheDocument()
    }
  })

  it('first group is open by default', async () => {
    await act(async () => { renderScreen() })
    // Group A is expanded: we can see the MEX flag or team
    expect(screen.getAllByText('MEX').length).toBeGreaterThan(0)
  })

  it('toggles group card open/close', async () => {
    await act(async () => { renderScreen() })
    const grupoB = screen.getByText('Grupo B')
    // Open B
    fireEvent.click(grupoB)
    expect(screen.getAllByText('CAN').length).toBeGreaterThan(0)
    // Close B
    fireEvent.click(grupoB)
    expect(screen.queryByText('CAN')).not.toBeInTheDocument()
  })

  it('renders Save button when not locked', async () => {
    await act(async () => { renderScreen(false) })
    expect(screen.getByRole('button', { name: 'Salvar Apostas' })).toBeInTheDocument()
  })

  it('renders locked message when bets are locked', async () => {
    await act(async () => { renderScreen(true) })
    expect(screen.getByText(/Apostas bloqueadas/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar Apostas' })).not.toBeInTheDocument()
  })

  it('save button calls save and persist', async () => {
    await act(async () => { renderScreen(false) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar Apostas' }))
    })
    expect(vi.mocked(firestore.saveGroupBets)).toHaveBeenCalledWith('u1', {})
    expect(vi.mocked(firestore.lockBets)).toHaveBeenCalledWith('u1')
    expect(vi.mocked(firestore.saveKnockoutBets)).toHaveBeenCalledWith('u1', {})
  })

  it('stepper increments score — both sides needed to count as filled', async () => {
    await act(async () => { renderScreen(false) })
    const incBtns = screen.getAllByLabelText('Aumentar')
    // Click home + and away + for the first match (indices 0 and 1)
    await act(async () => { fireEvent.click(incBtns[0]!) })
    await act(async () => { fireEvent.click(incBtns[1]!) })
    // Progress label now shows 1 / 72
    const label = screen.getByText('Apostas preenchidas').closest('.progress-label')!
    expect(label.querySelector('strong')?.textContent?.trim()).toMatch(/^1/)
  })

  it('locked steppers are disabled', async () => {
    await act(async () => { renderScreen(true) })
    const incBtns = screen.getAllByLabelText('Aumentar')
    expect(incBtns[0]).toBeDisabled()
  })

  it('renders Round de 32 section', async () => {
    await act(async () => { renderScreen() })
    expect(screen.getByText('Round de 32')).toBeInTheDocument()
  })

  it('renders Oitavas section', async () => {
    await act(async () => { renderScreen() })
    expect(screen.getByText('Oitavas')).toBeInTheDocument()
  })

  it('renders Final section', async () => {
    await act(async () => { renderScreen() })
    expect(screen.getByText('Final')).toBeInTheDocument()
  })

  it('group card has aria-expanded attribute', async () => {
    await act(async () => { renderScreen() })
    const headerA = screen.getByText('Grupo A').closest('[role="button"]')
    expect(headerA).toHaveAttribute('aria-expanded', 'true')
  })
})
