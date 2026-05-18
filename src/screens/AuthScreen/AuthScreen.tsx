import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { loadRanking, loadAdminConfig, isEmailBlocked } from '@/lib/firestore'
import { nameInitials } from '@/data/teams'
import { TEAMS } from '@/data/teams'
import { ALL_GROUP_GAMES } from '@/data/groups'
import { getRelevantMatchDay, getGamesForDay, formatDateShort, formatTimeShort } from '@/data/fixtures'
import type { RankingEntry } from '@/types'
import { MatchCard } from './MatchCard'
import './AuthScreen.css'

type AuthTab = 'login' | 'register'

/**
 * Today's match cards. Picks games for the current Brasília day; if no games
 * scheduled today, returns games for the next upcoming day with fixtures.
 */
function useDayCards() {
  const day = getRelevantMatchDay()
  if (!day) return { day: null as string | null, cards: [] }
  const dateStr = formatDateShort(day)
  const cards = getGamesForDay(day).map(f => {
    const game = ALL_GROUP_GAMES[f.gameId]!
    const home = TEAMS[game.home]!
    const away = TEAMS[game.away]!
    return {
      id: f.gameId,
      homeIso: home.iso, homeName: home.name, homeShort: home.short,
      awayIso: away.iso, awayName: away.name, awayShort: away.short,
      status: 'soon' as const,
      dateStr,
      timeStr: formatTimeShort(f.time),
      city: f.city,
    }
  })
  return { day, dateStr, cards }
}

function avatarStyle(pos: number) {
  if (pos === 1) return { background: 'rgba(212,170,44,.15)', color: 'var(--gold)' }
  if (pos === 2) return { background: 'rgba(180,190,210,.08)', color: '#c0c8d8' }
  if (pos === 3) return { background: 'rgba(180,100,50,.1)', color: '#cd7f32' }
  return { background: 'var(--surface2)', color: 'var(--text-muted)' }
}

export function AuthScreen() {
  const [tab, setTab] = useState<AuthTab>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [regOpen, setRegOpen] = useState(true)

  const { dateStr: dayLabel, cards } = useDayCards()

  useEffect(() => {
    loadRanking().then(r => setRanking(r.slice(0, 5))).catch(() => null)
    loadAdminConfig().then(c => {
      if (c.registrationOpen === false) setRegOpen(false)
    }).catch(() => null)
  }, [])

  async function handleGoogle() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user') {
        setError('Erro ao entrar com Google.')
      }
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')
    if (tab === 'register') {
      if (!regOpen) { setError('Cadastro temporariamente fechado.'); return }
      if (!name.trim()) { setError('Informe seu nome.'); return }
      if (password !== confirm) { setError('As senhas não coincidem.'); return }
      // Banlist check: prevent re-registration of previously-banned emails
      try {
        if (await isEmailBlocked(email)) {
          setError('Este e-mail não pode ser cadastrado. Contate o administrador.')
          return
        }
      } catch { /* if banlist unreachable, fail open — don't block legit users */ }
    }
    setLoading(true)
    try {
      if (tab === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message ?? 'Erro desconhecido.'
      setError(friendlyError(msg))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot() {
    if (!email) { setError('Digite seu e-mail primeiro.'); return }
    try {
      await sendPasswordResetEmail(auth, email)
      setError('')
      alert('E-mail de redefinição enviado!')
    } catch {
      setError('Não foi possível enviar o e-mail.')
    }
  }

  return (
    <div className="auth-screen">

      {/* ── Vibrant background — covers the WHOLE screen, fixed wallpaper ── */}
      {/* Stays in place while user scrolls. Sections below sit on top with
         semi-transparent surfaces to remain legible. */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-mesh">
          <div className="auth-mesh__blob auth-mesh__blob--red" />
          <div className="auth-mesh__blob auth-mesh__blob--blue" />
          <div className="auth-mesh__blob auth-mesh__blob--green" />
          <div className="auth-mesh__blob auth-mesh__blob--yellow" />
          <div className="auth-mesh__blob auth-mesh__blob--purple" />
        </div>
        <div className="auth-confetti">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className={`auth-confetti__dot auth-confetti__dot--${i % 6}`} />
          ))}
        </div>
      </div>

      {/* Top chevron stripe — "We Are 26" host-nation primaries */}
      <div className="auth-chevron" aria-hidden="true">
        <span style={{ background: 'var(--color-wa26-red)' }} />
        <span style={{ background: 'var(--color-wa26-orange)' }} />
        <span style={{ background: 'var(--color-wa26-yellow)' }} />
        <span style={{ background: 'var(--color-wa26-green)' }} />
        <span style={{ background: 'var(--color-wa26-blue)' }} />
        <span style={{ background: 'var(--color-wa26-purple)' }} />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="auth-hero">

        {/* Floating decorations — trophy + stars only */}
        <div className="auth-float auth-float--trophy" aria-hidden="true">🏆</div>
        <div className="auth-float auth-float--star1" aria-hidden="true">✨</div>
        <div className="auth-float auth-float--star2" aria-hidden="true">⭐</div>

        {/* Content */}
        <div className="auth-badge auth-badge--vibrant" aria-hidden="true">
          <span className="auth-badge__pulse" />
          <span>WE ARE 26 · 11 JUN 2026</span>
        </div>

        <img
          className="auth-logo"
          src="/img/copa-2026-logo.svg"
          alt="FIFA World Cup 2026"
          width={140} height={170}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />

        <h1 className="auth-title">
          <span className="auth-title__kicker">Bolão da</span>
          <span className="auth-title__main">COPA DO MUNDO</span>
          <span className="auth-title__year">
            <span className="auth-title__year-num">2026</span>
            <span className="auth-title__year-star" aria-hidden="true">★</span>
          </span>
        </h1>
        <p className="auth-sub">
          48 seleções · 104 jogos · 3 países · <strong>1 campeão do bolão</strong>
        </p>

        {/* Inline CTA */}
        <button
          className="auth-hero-cta"
          onClick={() => document.querySelector<HTMLElement>('.auth-card')?.scrollIntoView({ behavior: 'smooth' })}
        >
          🔥 Tô dentro
          <span className="auth-hero-cta__arrow" aria-hidden="true">→</span>
        </button>

        <div className="auth-colorbar" aria-hidden="true">
          <span style={{ background: 'var(--color-host-mexico)', flex: 2 }} />
          <span style={{ background: 'var(--gold)', flex: 1 }} />
          <span style={{ background: 'var(--color-host-usa)', flex: 2 }} />
          <span style={{ background: 'var(--gold)', flex: 1 }} />
          <span style={{ background: 'var(--color-host-canada)', flex: 2 }} />
        </div>
      </div>

      {/* ── Day's matches (full-width stack) ─────────────────────────── */}
      {cards.length > 0 && (
        <>
          <p className="section-label">⚽ Rola hoje {dayLabel ? `· ${dayLabel}` : ''}</p>
          <div className="match-stack" role="list">
            {cards.map(c => <MatchCard key={c.id} {...c} />)}
          </div>
        </>
      )}

      {/* ── Login form ───────────────────────────────────────────────── */}
      <p className="section-label">🚀 Bora começar</p>
      <div className="auth-card">

        <button className="btn-google" type="button" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </button>

        <div className="auth-divider">
          <div className="auth-divider__line" />
          <span className="auth-divider__txt">ou use seu e-mail</span>
          <div className="auth-divider__line" />
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            className={`auth-tab${tab === 'login' ? ' auth-tab--active' : ''}`}
            role="tab" aria-selected={tab === 'login'}
            onClick={() => { setTab('login'); setError('') }}
          >
            Entrar
          </button>
          <button
            className={`auth-tab${tab === 'register' ? ' auth-tab--active' : ''}`}
            role="tab" aria-selected={tab === 'register'}
            onClick={() => { setTab('register'); setError('') }}
          >
            Criar conta
          </button>
        </div>

        {tab === 'register' && !regOpen && (
          <div className="reg-closed-banner">
            🔐 Cadastro temporariamente fechado. Contate o administrador.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {tab === 'register' && (
            <div className="auth-field">
              <input
                className="input"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}
          <div className="auth-field">
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <input
              className="input"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>
          {tab === 'register' && (
            <div className="auth-field">
              <input
                className="input"
                type="password"
                placeholder="Confirmar senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Aguarde…' : tab === 'login' ? 'Entrar no Bolão ⚽' : 'Criar minha conta'}
          </button>
        </form>

        <button className="auth-forgot" type="button" onClick={handleForgot}>
          Esqueci minha senha
        </button>
      </div>

      {/* ── Public ranking ───────────────────────────────────────────── */}
      <p className="section-label">👑 Quem manda no bolão</p>
      <div className="pub-ranking">
        {ranking.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '.82rem', textAlign: 'center', padding: '8px 0' }}>
            Seja o primeiro a apostar e dominar o ranking! 🚀
          </p>
        )}
        {ranking.map((entry, i) => {
          const pos = i + 1
          const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}`
          return (
            <div className="pub-ranking__row" key={entry.uid}>
              <span className="pub-ranking__pos">{medal}</span>
              <div className="pub-ranking__avatar" style={avatarStyle(pos)}>
                {nameInitials(entry.name)}
              </div>
              <span className="pub-ranking__name">{entry.name}</span>
              <span className={`pub-ranking__pts${pos === 1 ? ' pub-ranking__pts--gold' : ''}`}>
                {entry.pts} pts
              </span>
            </div>
          )
        })}

        <div className="pub-ranking-cta">
          <p className="pub-ranking-cta__txt">
            Junta a galera. Aposta. Sobe no ranking.<br />
            <strong>Quem cravar mais leva a fama.</strong>
          </p>
          <button
            className="btn btn-gold"
            onClick={() => document.querySelector<HTMLElement>('.auth-card')?.scrollIntoView({ behavior: 'smooth' })}
          >
            🔥 Tô dentro
          </button>
        </div>
      </div>

      <div className="auth-bottom-space" />
    </div>
  )
}

function friendlyError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return 'E-mail ou senha incorretos.'
  if (msg.includes('email-already-in-use'))
    return 'Este e-mail já está cadastrado.'
  if (msg.includes('weak-password'))
    return 'A senha deve ter pelo menos 6 caracteres.'
  if (msg.includes('invalid-email'))
    return 'E-mail inválido.'
  if (msg.includes('too-many-requests'))
    return 'Muitas tentativas. Tente novamente mais tarde.'
  return msg
}
