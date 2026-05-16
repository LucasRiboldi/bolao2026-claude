import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AppShell } from '@/components/layout/AppShell'
import type { Section } from '@/components/layout/AppShell'

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }))
vi.mock('@/lib/firebase', () => ({ auth: {}, ADMIN_EMAIL: 'admin@test.com' }))

const mockUseAuth = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderShell(isAdmin = false, score?: number) {
  mockUseAuth.mockReturnValue({
    user: { uid: '1', email: 'user@test.com' },
    profile: { name: 'Lucas Riboldi', email: 'user@test.com' },
    isAdmin,
    loading: false,
  })
  const sections: Section[] = []
  render(
    <AppShell userScore={score}>
      {(section) => { sections.push(section); return <div data-testid="content">{section}</div> }}
    </AppShell>
  )
  return sections
}

describe('AppShell', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders brand name in header', () => {
    renderShell()
    expect(screen.getByText('Bolão 2026')).toBeInTheDocument()
  })

  it('shows first name of user', () => {
    renderShell()
    expect(screen.getByText('Lucas')).toBeInTheDocument()
  })

  it('shows score pill when score is provided', () => {
    renderShell(false, 87)
    expect(screen.getByText('87 pts')).toBeInTheDocument()
  })

  it('hides score pill when score is undefined', () => {
    renderShell()
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderShell()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('calls signOut on logout click', async () => {
    const { signOut } = await import('firebase/auth')
    renderShell()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sair' })) })
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('renders 5 nav items for normal user (no admin)', () => {
    renderShell(false)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)
  })

  it('renders 5 nav items for admin (no convidar)', () => {
    renderShell(true)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)
  })

  it('shows CONFIG for admin, not CONVIDAR', () => {
    renderShell(true)
    expect(screen.getByText('CONFIG')).toBeInTheDocument()
    expect(screen.queryByText('CONVIDAR')).not.toBeInTheDocument()
  })

  it('shows CONVIDAR for normal user, not CONFIG', () => {
    renderShell(false)
    expect(screen.getByText('CONVIDAR')).toBeInTheDocument()
    expect(screen.queryByText('CONFIG')).not.toBeInTheDocument()
  })

  it('defaults to groups section', () => {
    renderShell()
    expect(screen.getByTestId('content')).toHaveTextContent('groups')
  })

  it('switches section on tab click', () => {
    renderShell()
    fireEvent.click(screen.getByRole('tab', { name: /RANKING/i }))
    expect(screen.getByTestId('content')).toHaveTextContent('ranking')
  })

  it('marks active tab with aria-selected', () => {
    renderShell()
    const apostarTab = screen.getByRole('tab', { name: /APOSTAR/i })
    expect(apostarTab).toHaveAttribute('aria-selected', 'true')
  })

  it('updates aria-selected when switching tabs', () => {
    renderShell()
    const rankingTab = screen.getByRole('tab', { name: /RANKING/i })
    fireEvent.click(rankingTab)
    expect(rankingTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /APOSTAR/i })).toHaveAttribute('aria-selected', 'false')
  })

  it('COPA tab has elevated button structure', () => {
    renderShell()
    expect(screen.getByRole('tab', { name: /COPA/i })).toHaveClass('bnav-item--copa')
  })

  it('renders bottom nav with accessible label', () => {
    renderShell()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  })
})
