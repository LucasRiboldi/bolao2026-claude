import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MyBetsScreen } from '@/screens/MyBetsScreen'
import * as firestore from '@/lib/firestore'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, ADMIN_EMAIL: 'admin@test.com' }))
vi.mock('@/lib/firestore', () => ({
  loadGroupBets: vi.fn().mockResolvedValue({}),
  loadKnockoutBets: vi.fn().mockResolvedValue({}),
  saveGroupBets: vi.fn().mockResolvedValue(undefined),
  lockBets: vi.fn().mockResolvedValue(undefined),
  saveKnockoutBets: vi.fn().mockResolvedValue(undefined),
}))

const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderScreen(overrides: {
  locked?: boolean
  betsSavedAt?: string
  groupBets?: Record<string, { homeGoals: string; awayGoals: string }>
  koBets?: Record<string, string>
} = {}) {
  const { locked = false, betsSavedAt, groupBets = {}, koBets = {} } = overrides
  mockUseAuth.mockReturnValue({
    user: { uid: 'u1' },
    profile: { name: 'Lucas', email: 'lucas@test.com', betsLocked: locked, betsSavedAt },
    isAdmin: false,
    loading: false,
  })
  vi.mocked(firestore.loadGroupBets).mockResolvedValue(groupBets)
  vi.mocked(firestore.loadKnockoutBets).mockResolvedValue(koBets)
}

describe('MyBetsScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading spinner while fetching', () => {
    vi.mocked(firestore.loadGroupBets).mockReturnValueOnce(new Promise(() => {}))
    renderScreen()
    render(<MyBetsScreen />)
    expect(screen.getByLabelText('Carregando apostas…')).toBeInTheDocument()
  })

  it('renders status card with locked state', async () => {
    renderScreen({ locked: true })
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText('Apostas salvas')).toBeInTheDocument()
  })

  it('renders status card with unlocked state', async () => {
    renderScreen({ locked: false })
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText('Apostas abertas para edição')).toBeInTheDocument()
  })

  it('shows 0/72 groups filled when no bets', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText('0 / 72 grupos · 0 mata-mata')).toBeInTheDocument()
  })

  it('shows correct count when bets are partially filled', async () => {
    renderScreen({
      groupBets: { A_0: { homeGoals: '2', awayGoals: '1' } },
      koBets: { r32_01: 'brazil' },
    })
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText('1 / 72 grupos · 1 mata-mata')).toBeInTheDocument()
  })

  it('shows save date when betsSavedAt is provided', async () => {
    renderScreen({ locked: true, betsSavedAt: '2026-05-12T14:30:00Z' })
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText(/Salvo em:/)).toBeInTheDocument()
  })

  it('renders 12 group cards', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    for (const g of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
      expect(screen.getByText(`Grupo ${g}`)).toBeInTheDocument()
    }
  })

  it('first group card is open by default', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getAllByText('MEX').length).toBeGreaterThan(0)
  })

  it('toggles group card on click', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    fireEvent.click(screen.getByText('Grupo B'))
    expect(screen.getAllByText('CAN').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('Grupo B'))
    expect(screen.queryByText('CAN')).not.toBeInTheDocument()
  })

  it('shows filled score when bet exists', async () => {
    renderScreen({ groupBets: { A_0: { homeGoals: '3', awayGoals: '0' } } })
    await act(async () => { render(<MyBetsScreen />) })
    const vals = screen.getAllByText('3')
    expect(vals.length).toBeGreaterThan(0)
  })

  it('shows ? when bet not filled', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getAllByText('?').length).toBeGreaterThan(0)
  })

  it('renders Mata-Mata section label', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText('Mata-Mata')).toBeInTheDocument()
  })

  it('renders Round de 32 in ko section', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText('Round de 32')).toBeInTheDocument()
  })

  it('shows winner highlighted in knockout', async () => {
    // r32_13 homeSlot=1B → Canada is 1st of group B with no bets
    renderScreen({ koBets: { r32_13: 'canada' } })
    await act(async () => { render(<MyBetsScreen />) })
    const canadaEl = screen.getAllByText('Canadá')
    const winner = canadaEl.find(el => el.closest('.mybets-ko-slot--winner'))
    expect(winner).toBeDefined()
  })

  it('renders WhatsApp export button', async () => {
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByRole('button', { name: /Exportar via WhatsApp/ })).toBeInTheDocument()
  })

  it('WhatsApp button opens correct URL', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderScreen()
    await act(async () => { render(<MyBetsScreen />) })
    fireEvent.click(screen.getByRole('button', { name: /Exportar via WhatsApp/ }))
    expect(openSpy).toHaveBeenCalledOnce()
    const url = openSpy.mock.calls[0]![0] as string
    expect(url).toContain('wa.me')
    expect(url).toContain('Bol%C3%A3o')
    openSpy.mockRestore()
  })

  it('group card shows filled count in header', async () => {
    renderScreen({
      groupBets: {
        A_0: { homeGoals: '1', awayGoals: '0' },
        A_1: { homeGoals: '2', awayGoals: '2' },
      }
    })
    await act(async () => { render(<MyBetsScreen />) })
    expect(screen.getByText('2/6')).toBeInTheDocument()
  })
})
