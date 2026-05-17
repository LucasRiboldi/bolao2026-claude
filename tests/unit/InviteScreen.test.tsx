import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { InviteScreen } from '@/screens/InviteScreen'

describe('InviteScreen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders hero title', () => {
    render(<InviteScreen />)
    expect(screen.getByText('Convide seus amigos!')).toBeInTheDocument()
  })

  it('renders link input with URL', () => {
    render(<InviteScreen />)
    const input = screen.getByLabelText('Link do bolão')
    expect(input).toBeInTheDocument()
    expect((input as HTMLInputElement).readOnly).toBe(true)
  })

  it('renders WhatsApp share button', () => {
    render(<InviteScreen />)
    expect(screen.getByText(/Compartilhar no WhatsApp/)).toBeInTheDocument()
  })

  it('renders copy button', () => {
    render(<InviteScreen />)
    expect(screen.getByLabelText('Copiar link')).toBeInTheDocument()
  })

  it('copies link to clipboard on button click', async () => {
    const writeMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText: writeMock } })
    render(<InviteScreen />)
    await act(async () => { fireEvent.click(screen.getByLabelText('Copiar link')) })
    expect(writeMock).toHaveBeenCalledOnce()
  })

  it('shows "Link copiado!" feedback after copy', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    render(<InviteScreen />)
    await act(async () => { fireEvent.click(screen.getByLabelText('Copiar link')) })
    expect(screen.getByText('Link copiado!')).toBeInTheDocument()
  })

  it('opens WhatsApp URL on button click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<InviteScreen />)
    fireEvent.click(screen.getByText(/Compartilhar no WhatsApp/))
    expect(openSpy).toHaveBeenCalledOnce()
    expect(String(openSpy.mock.calls[0]![0])).toContain('wa.me')
    openSpy.mockRestore()
  })

  it('renders 4 how-to steps', () => {
    render(<InviteScreen />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders section role tabpanel', () => {
    render(<InviteScreen />)
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })
})
