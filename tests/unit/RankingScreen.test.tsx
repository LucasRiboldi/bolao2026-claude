import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { RankingScreen } from '@/screens/RankingScreen'
import * as firestore from '@/lib/firestore'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, ADMIN_EMAIL: 'admin@test.com' }))
vi.mock('@/lib/firestore', () => ({
  loadRanking: vi.fn().mockResolvedValue([]),
  loadScoringConfig: vi.fn().mockResolvedValue({}),
  loadAllUsersForRanking: vi.fn().mockResolvedValue([]),
  updateRankingDoc: vi.fn().mockResolvedValue(undefined),
}))

const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const sampleEntries = [
  { uid: 'u1', name: 'Lucas', pts: 87, breakdown: { exact: 34, result: 40, ko: 8, bonus: 5 } },
  { uid: 'u2', name: 'Ana Silva', pts: 72, breakdown: { exact: 17, result: 48, ko: 7, bonus: 0 } },
  { uid: 'u3', name: 'João Costa', pts: 43, breakdown: { exact: 0, result: 32, ko: 11, bonus: 0 } },
]

function renderScreen(uid = 'u1', isAdmin = false) {
  mockUseAuth.mockReturnValue({
    user: { uid },
    profile: { name: 'Lucas', email: 'lucas@test.com' },
    isAdmin,
    loading: false,
  })
}

describe('RankingScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading spinner initially', () => {
    vi.mocked(firestore.loadRanking).mockReturnValueOnce(new Promise(() => {}))
    renderScreen()
    render(<RankingScreen />)
    expect(screen.getByLabelText('Carregando ranking…')).toBeInTheDocument()
  })

  it('shows empty state when ranking is empty', async () => {
    renderScreen()
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('Ranking ainda não disponível')).toBeInTheDocument()
  })

  it('shows error state on failure', async () => {
    vi.mocked(firestore.loadRanking).mockRejectedValueOnce(new Error('fail'))
    renderScreen()
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('Erro ao carregar')).toBeInTheDocument()
  })

  it('renders all ranking entries', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen()
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('Lucas')).toBeInTheDocument()
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByText('João Costa')).toBeInTheDocument()
  })

  it('shows trophy icons for top 3', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen()
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('🥇')).toBeInTheDocument()
    expect(screen.getByText('🥈')).toBeInTheDocument()
    expect(screen.getByText('🥉')).toBeInTheDocument()
  })

  it('shows user position card when user is in ranking', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen('u1')
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('Você')).toBeInTheDocument()
    expect(screen.getByText('1º')).toBeInTheDocument()
  })

  it('shows correct pts in position card', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen('u1')
    await act(async () => { render(<RankingScreen />) })
    const strong = screen.getAllByText('87')
    expect(strong.length).toBeGreaterThan(0)
  })

  it('shows breakdown in position card', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen('u1')
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('Exato')).toBeInTheDocument()
    expect(screen.getByText('Resultado')).toBeInTheDocument()
    expect(screen.getByText('Mata-mata')).toBeInTheDocument()
  })

  it('highlights user own entry in list', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen('u2')
    await act(async () => { render(<RankingScreen />) })
    const anaEls = screen.getAllByText('Ana Silva')
    const meEntry = anaEls.find(el => el.closest('.ranking-entry--me'))
    expect(meEntry).toBeDefined()
  })

  it('shows initials avatar for each user', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen()
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('LU')).toBeInTheDocument() // Lucas → LU (first 2 initials of "Lucas")
    expect(screen.getByText('AS')).toBeInTheDocument() // Ana Silva → AS
    expect(screen.getByText('JC')).toBeInTheDocument() // João Costa → JC
  })

  it('renders Atualizar button', async () => {
    renderScreen()
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByRole('button', { name: /Atualizar/ })).toBeInTheDocument()
  })

  it('calls refresh on button click', async () => {
    renderScreen()
    await act(async () => { render(<RankingScreen />) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Atualizar/ }))
    })
    expect(vi.mocked(firestore.loadRanking)).toHaveBeenCalledTimes(2)
  })

  it('does not show position card when user not in ranking', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen('u999')
    await act(async () => { render(<RankingScreen />) })
    expect(screen.queryByText('Você')).not.toBeInTheDocument()
  })

  it('shows bonus breakdown item only when bonus > 0', async () => {
    vi.mocked(firestore.loadRanking).mockResolvedValue(sampleEntries)
    renderScreen('u1') // u1 has bonus: 5
    await act(async () => { render(<RankingScreen />) })
    expect(screen.getByText('Bônus')).toBeInTheDocument()
  })
})
