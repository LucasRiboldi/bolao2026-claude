import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { StandingsScreen } from '@/screens/StandingsScreen'
import * as firestore from '@/lib/firestore'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, ADMIN_EMAIL: 'admin@test.com' }))
vi.mock('@/lib/firestore', () => ({
  loadResults: vi.fn().mockResolvedValue({ groupStage: {}, knockout: {} }),
}))

const groupStageWithData = {
  A_0: { homeGoals: '2', awayGoals: '1' }, // MEX 2-1 RSA
  A_1: { homeGoals: '1', awayGoals: '1' }, // KOR 1-1 CZE
  A_2: { homeGoals: '3', awayGoals: '0' }, // MEX 3-0 KOR
  A_3: { homeGoals: '2', awayGoals: '0' }, // RSA 2-0 CZE
  A_4: { homeGoals: '1', awayGoals: '0' }, // MEX 1-0 CZE
  A_5: { homeGoals: '0', awayGoals: '1' }, // RSA 0-1 KOR
}

describe('StandingsScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows loading spinner initially', () => {
    vi.mocked(firestore.loadResults).mockReturnValueOnce(new Promise(() => {}))
    render(<StandingsScreen />)
    expect(screen.getByLabelText('Carregando classificação…')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    await act(async () => { render(<StandingsScreen />) })
    expect(screen.getByText('Aguardando início da Copa…')).toBeInTheDocument()
  })

  it('shows error state on fetch failure', async () => {
    vi.mocked(firestore.loadResults).mockRejectedValueOnce(new Error('Network error'))
    await act(async () => { render(<StandingsScreen />) })
    expect(screen.getByText('Erro ao carregar')).toBeInTheDocument()
    expect(screen.getByText('Falha ao carregar classificação.')).toBeInTheDocument()
  })

  it('renders tabs for Grupos and Mata-Mata', async () => {
    await act(async () => { render(<StandingsScreen />) })
    expect(screen.getByRole('button', { name: 'Grupos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mata-Mata' })).toBeInTheDocument()
  })

  it('Grupos tab is active by default', async () => {
    await act(async () => { render(<StandingsScreen />) })
    expect(screen.getByRole('button', { name: 'Grupos' })).toHaveClass('standings-tab--active')
  })

  it('renders Atualizar button', async () => {
    await act(async () => { render(<StandingsScreen />) })
    expect(screen.getByRole('button', { name: /Atualizar/ })).toBeInTheDocument()
  })

  it('calls loadResults again on refresh click', async () => {
    await act(async () => { render(<StandingsScreen />) })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Atualizar/ }))
    })
    expect(vi.mocked(firestore.loadResults)).toHaveBeenCalledTimes(2)
  })

  it('renders 12 group tables when data is present', async () => {
    vi.mocked(firestore.loadResults).mockResolvedValue({
      groupStage: groupStageWithData,
      knockout: {},
    })
    await act(async () => { render(<StandingsScreen />) })
    for (const g of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
      expect(screen.getByText(`Grupo ${g}`)).toBeInTheDocument()
    }
  })

  it('shows correct points for group A leader', async () => {
    vi.mocked(firestore.loadResults).mockResolvedValue({
      groupStage: groupStageWithData,
      knockout: {},
    })
    await act(async () => { render(<StandingsScreen />) })
    // MEX: 3 wins = 9 pts
    const ninePts = screen.getAllByText('9')
    expect(ninePts.length).toBeGreaterThan(0)
  })

  it('shows column headers J V E D P', async () => {
    vi.mocked(firestore.loadResults).mockResolvedValue({
      groupStage: groupStageWithData,
      knockout: {},
    })
    await act(async () => { render(<StandingsScreen />) })
    expect(screen.getAllByText('J').length).toBeGreaterThan(0)
    expect(screen.getAllByText('V').length).toBeGreaterThan(0)
    expect(screen.getAllByText('P').length).toBeGreaterThan(0)
  })

  it('switches to Mata-Mata tab', async () => {
    vi.mocked(firestore.loadResults).mockResolvedValue({
      groupStage: groupStageWithData,
      knockout: {},
    })
    await act(async () => { render(<StandingsScreen />) })
    fireEvent.click(screen.getByRole('button', { name: 'Mata-Mata' }))
    expect(screen.getByText('Round de 32')).toBeInTheDocument()
  })

  it('shows Oitavas in Mata-Mata tab', async () => {
    vi.mocked(firestore.loadResults).mockResolvedValue({
      groupStage: groupStageWithData,
      knockout: {},
    })
    await act(async () => { render(<StandingsScreen />) })
    fireEvent.click(screen.getByRole('button', { name: 'Mata-Mata' }))
    expect(screen.getByText('Oitavas')).toBeInTheDocument()
  })

  it('highlights winner in Mata-Mata when result is present', async () => {
    vi.mocked(firestore.loadResults).mockResolvedValue({
      groupStage: groupStageWithData,
      knockout: { r32_13: 'canada' },
    })
    await act(async () => { render(<StandingsScreen />) })
    fireEvent.click(screen.getByRole('button', { name: 'Mata-Mata' }))
    const avancou = screen.getAllByText('✓ avançou')
    expect(avancou.length).toBeGreaterThan(0)
  })

  it('groups tab does not show mata-mata content', async () => {
    vi.mocked(firestore.loadResults).mockResolvedValue({
      groupStage: groupStageWithData,
      knockout: {},
    })
    await act(async () => { render(<StandingsScreen />) })
    expect(screen.queryByText('Round de 32')).not.toBeInTheDocument()
  })
})
