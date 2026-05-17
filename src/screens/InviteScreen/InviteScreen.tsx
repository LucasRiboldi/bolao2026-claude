import { useState } from 'react'
import './InviteScreen.css'

const INVITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://bolao2026-a76c7.web.app'

const WA_TEXT = `🏆 Bora jogar o Bolão Copa 2026!

Faça seus palpites dos jogos da Copa do Mundo e dispute o ranking com os amigos.

👉 Acesse: ${INVITE_URL}`

export function InviteScreen() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(INVITE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select input text
    }
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(WA_TEXT)}`, '_blank', 'noopener')
  }

  async function handleNativeShare() {
    if (!navigator.share) return
    await navigator.share({ title: 'Bolão Copa 2026', text: WA_TEXT, url: INVITE_URL })
  }

  return (
    <div id="section-convidar" role="tabpanel">
      <div className="invite-hero">
        <div className="invite-hero__icon">⚽</div>
        <div className="invite-hero__title">Convide seus amigos!</div>
        <div className="invite-hero__sub">
          Quanto mais participantes, mais emocionante o bolão. Compartilhe o link abaixo.
        </div>
      </div>

      <div className="invite-link-wrap">
        <input
          className="invite-link-input"
          readOnly
          value={INVITE_URL}
          aria-label="Link do bolão"
          onClick={handleCopy}
        />
        <button className="btn btn-ghost btn-sm" onClick={handleCopy} aria-label="Copiar link">
          {copied ? '✓' : '📋'}
        </button>
      </div>
      <div className="invite-copied">{copied ? 'Link copiado!' : ''}</div>

      <div className="invite-actions">
        <button className="btn btn-primary btn-full" onClick={handleWhatsApp}>
          📲 Compartilhar no WhatsApp
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button className="btn btn-ghost btn-full" onClick={handleNativeShare}>
            🔗 Outras opções
          </button>
        )}
      </div>

      <div className="invite-steps">
        <div className="invite-steps__title">Como funciona</div>
        <div className="invite-step">
          <div className="invite-step__num">1</div>
          <div className="invite-step__text">Compartilhe o link e seu amigo cria uma conta com Google ou e-mail.</div>
        </div>
        <div className="invite-step">
          <div className="invite-step__num">2</div>
          <div className="invite-step__text">Ele preenche os palpites para todos os 72 jogos da fase de grupos.</div>
        </div>
        <div className="invite-step">
          <div className="invite-step__num">3</div>
          <div className="invite-step__text">Ele aposta no bracket do mata-mata até o campeão.</div>
        </div>
        <div className="invite-step">
          <div className="invite-step__num">4</div>
          <div className="invite-step__text">O ranking é atualizado a cada jogo. Quem acertar mais ganha!</div>
        </div>
      </div>
    </div>
  )
}
