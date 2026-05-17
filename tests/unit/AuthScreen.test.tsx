import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AuthScreen } from '@/screens/AuthScreen'

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('@/lib/firebase', () => ({
  auth: {},
  ADMIN_EMAIL: 'admin@test.com',
}))

vi.mock('@/lib/firestore', () => ({
  loadRanking: vi.fn().mockResolvedValue([]),
  loadAdminConfig: vi.fn().mockResolvedValue({ registrationOpen: true }),
}))

async function renderAuthScreen() {
  let result!: ReturnType<typeof render>
  await act(async () => { result = render(<AuthScreen />) })
  return result
}

describe('AuthScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders hero title', async () => {
    await renderAuthScreen()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bolão 2026')
  })

  it('renders Google sign-in button', async () => {
    await renderAuthScreen()
    expect(screen.getByText('Entrar com Google')).toBeInTheDocument()
  })

  it('renders Login and Register tabs', async () => {
    await renderAuthScreen()
    expect(screen.getByRole('tab', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Criar conta' })).toBeInTheDocument()
  })

  it('login tab is active by default', async () => {
    await renderAuthScreen()
    expect(screen.getByRole('tab', { name: 'Entrar' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Criar conta' })).toHaveAttribute('aria-selected', 'false')
  })

  it('shows name and confirm fields after switching to register', async () => {
    await renderAuthScreen()
    fireEvent.click(screen.getByRole('tab', { name: 'Criar conta' }))
    expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirmar senha')).toBeInTheDocument()
  })

  it('shows password mismatch error on register', async () => {
    await renderAuthScreen()
    fireEvent.click(screen.getByRole('tab', { name: 'Criar conta' }))
    fireEvent.change(screen.getByPlaceholderText('Seu nome'),       { target: { value: 'Lucas' } })
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'),  { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Mínimo 6 caracteres'), { target: { value: '123456' } })
    fireEvent.change(screen.getByPlaceholderText('Confirmar senha'), { target: { value: '654321' } })
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('senhas não coincidem'))
  })

  it('hides name/confirm fields on login tab', async () => {
    await renderAuthScreen()
    expect(screen.queryByPlaceholderText('Seu nome')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Confirmar senha')).not.toBeInTheDocument()
  })

  it('renders match cards section', async () => {
    await renderAuthScreen()
    expect(screen.getByText(/Jogos de hoje/i)).toBeInTheDocument()
  })

  it('renders public ranking section', async () => {
    await renderAuthScreen()
    expect(screen.getByText(/Ranking ao vivo/i)).toBeInTheDocument()
  })

  it('shows empty ranking message when no entries', async () => {
    await renderAuthScreen()
    await waitFor(() =>
      expect(screen.getByText(/Nenhum palpite registrado ainda/i)).toBeInTheDocument()
    )
  })

  it('shows ranking entries when loaded', async () => {
    const { loadRanking } = await import('@/lib/firestore')
    vi.mocked(loadRanking).mockResolvedValue([
      { uid: '1', name: 'Ana', pts: 150 },
      { uid: '2', name: 'João', pts: 120 },
    ])
    await renderAuthScreen()
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument())
    expect(screen.getByText('150 pts')).toBeInTheDocument()
  })

  it('calls signInWithPopup when clicking Google button', async () => {
    const { signInWithPopup } = await import('firebase/auth')
    await renderAuthScreen()
    await act(async () => { fireEvent.click(screen.getByText('Entrar com Google')) })
    expect(signInWithPopup).toHaveBeenCalledOnce()
  })

  it('shows reg-closed banner when registration is disabled', async () => {
    const { loadAdminConfig } = await import('@/lib/firestore')
    vi.mocked(loadAdminConfig).mockResolvedValue({ registrationOpen: false })
    await renderAuthScreen()
    fireEvent.click(screen.getByRole('tab', { name: 'Criar conta' }))
    await waitFor(() =>
      expect(screen.getByText(/Cadastro temporariamente fechado/i)).toBeInTheDocument()
    )
  })

  it('renders CTA button in ranking section', async () => {
    await renderAuthScreen()
    expect(screen.getByText('🏆 Quero participar!')).toBeInTheDocument()
  })
})
