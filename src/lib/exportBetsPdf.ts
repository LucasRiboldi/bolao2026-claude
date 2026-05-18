/**
 * Build a polished PDF of the user's bets.
 *
 * Layout:
 *   ▸ Cover page — title, user name, date, total score, breakdown
 *   ▸ Group stage — 12 groups, each on its own card with the 6 games
 *   ▸ Knockout    — R32 → R16 → QF → SF → Champion → 3rd place picks
 *   ▸ Footer      — generated date + page number on every page
 *
 * Uses jsPDF only (no autotable) so we keep deps minimal.
 */
import { jsPDF } from 'jspdf'
import type { GroupBets, KnockoutBets } from '@/types'
import { GROUP_IDS, generateGroupGames } from '@/data/groups'
import { TEAMS } from '@/data/teams'

interface PdfOptions {
  userName: string
  groupBets: GroupBets
  koBets: KnockoutBets
  totalPts?: number
  breakdown?: { exact: number; result: number; ko: number; bonus: number }
}

// Brand palette — kept inside the module so PDF is self-contained.
const COLORS = {
  primary:   [29, 78, 216]    as [number, number, number], // blue
  accent:    [212, 170, 44]   as [number, number, number], // gold
  success:   [46, 160, 67]    as [number, number, number], // green
  danger:    [218, 54, 51]    as [number, number, number], // red
  textDark:  [13, 17, 23]     as [number, number, number],
  textMuted: [110, 118, 129]  as [number, number, number],
  border:    [200, 200, 200]  as [number, number, number],
  rowAlt:    [248, 248, 250]  as [number, number, number],
}

const GROUP_ACCENTS: Record<string, [number, number, number]> = {
  A: [231, 76, 60],   B: [230, 126, 34], C: [243, 156, 18], D: [46, 204, 113],
  E: [26, 188, 156],  F: [52, 152, 219], G: [155, 89, 182], H: [233, 30, 99],
  I: [0, 188, 212],   J: [139, 195, 74], K: [255, 87, 34],  L: [96, 125, 139],
}

function formatDate(d = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function exportBetsPdf({
  userName, groupBets, koBets, totalPts, breakdown,
}: PdfOptions): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 12  // page margin

  let pageNum = 1
  const generatedAt = formatDate()

  // ── Helpers ────────────────────────────────────────────────────────────
  function setFill(rgb: [number, number, number]) { pdf.setFillColor(rgb[0], rgb[1], rgb[2]) }
  function setStroke(rgb: [number, number, number]) { pdf.setDrawColor(rgb[0], rgb[1], rgb[2]) }
  function setText(rgb: [number, number, number]) { pdf.setTextColor(rgb[0], rgb[1], rgb[2]) }

  function addFooter() {
    setText(COLORS.textMuted)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Bolão Copa 2026 · gerado em ${generatedAt}`, M, H - 6)
    pdf.text(`Página ${pageNum}`, W - M, H - 6, { align: 'right' })
  }

  function newPage() {
    addFooter()
    pdf.addPage()
    pageNum++
  }

  function ensureSpace(neededMm: number, currentY: number): number {
    if (currentY + neededMm > H - 18) {
      newPage()
      return M + 8
    }
    return currentY
  }

  function sectionHeader(text: string, y: number, accent: [number, number, number]): number {
    y = ensureSpace(16, y)
    setFill(accent)
    pdf.rect(M, y, 4, 10, 'F')        // colored left bar
    setText(COLORS.textDark)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(text, M + 8, y + 7.2)
    return y + 14
  }

  // ── Cover page ─────────────────────────────────────────────────────────
  // Top color bar (host nations)
  const stripeY = 0
  const stripeH = 6
  setFill([181, 38, 30]);  pdf.rect(0, stripeY, W * 0.4, stripeH, 'F')
  setFill([212, 170, 44]); pdf.rect(W * 0.4, stripeY, W * 0.2, stripeH, 'F')
  setFill([26, 95, 180]);  pdf.rect(W * 0.6, stripeY, W * 0.4, stripeH, 'F')

  // Title block
  setText(COLORS.textDark)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Bolão Copa 2026', W / 2, 40, { align: 'center' })

  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'normal')
  setText(COLORS.textMuted)
  pdf.text('Apostas oficiais do participante', W / 2, 50, { align: 'center' })

  // Big colored card for user name
  const cardY = 65
  const cardH = 38
  setFill(COLORS.primary)
  pdf.roundedRect(M, cardY, W - 2 * M, cardH, 3, 3, 'F')

  setText([255, 255, 255])
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PARTICIPANTE', M + 6, cardY + 8)

  pdf.setFontSize(22)
  pdf.text(userName, M + 6, cardY + 22)

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Documento gerado em ${generatedAt}`, M + 6, cardY + 32)

  // Score summary
  if (totalPts !== undefined) {
    const scoreY = cardY + cardH + 8
    setText(COLORS.textDark)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('PONTUAÇÃO ATUAL', M, scoreY)

    const ptsY = scoreY + 10
    setText(COLORS.accent)
    pdf.setFontSize(36)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${totalPts} pts`, M, ptsY)

    if (breakdown) {
      setText(COLORS.textMuted)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      const items = [
        `Placar exato: ${breakdown.exact}`,
        `Resultado correto: ${breakdown.result}`,
        `Mata-mata: ${breakdown.ko}`,
        `Bônus: ${breakdown.bonus}`,
      ]
      pdf.text(items.join('  ·  '), M, ptsY + 7)
    }
  }

  // Legend
  const legendY = H - 50
  setText(COLORS.textDark)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CONTEÚDO', M, legendY)

  setText(COLORS.textMuted)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const toc = [
    '1.  Fase de Grupos — 12 grupos, 72 jogos',
    '2.  Mata-Mata — Round de 32 → Final',
    '3.  Campeão e 3° lugar',
  ]
  toc.forEach((line, i) => pdf.text(line, M, legendY + 7 + i * 5))

  // ── Group stage ────────────────────────────────────────────────────────
  newPage()
  let y = M + 8
  y = sectionHeader('FASE DE GRUPOS', y, COLORS.primary)
  y += 2

  for (const gId of GROUP_IDS) {
    const games = generateGroupGames(gId)
    const cardHeight = 6 + games.length * 5.5 + 6
    y = ensureSpace(cardHeight + 6, y)

    // Group card
    const accent = GROUP_ACCENTS[gId] ?? COLORS.primary
    setFill(accent)
    pdf.rect(M, y, 3, cardHeight, 'F')
    setStroke(COLORS.border)
    pdf.setLineWidth(0.2)
    pdf.rect(M + 3, y, W - 2 * M - 3, cardHeight)

    // Group title
    setText(COLORS.textDark)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`GRUPO ${gId}`, M + 7, y + 5)

    // Games
    let rowY = y + 10
    games.forEach((game, idx) => {
      if (idx % 2 === 1) {
        setFill(COLORS.rowAlt)
        pdf.rect(M + 3, rowY - 3.6, W - 2 * M - 3, 5, 'F')
      }

      const bet = groupBets[game.id]
      const home = TEAMS[game.home]?.name ?? game.home
      const away = TEAMS[game.away]?.name ?? game.away
      const score = bet && bet.homeGoals !== '' && bet.awayGoals !== ''
        ? `${bet.homeGoals} × ${bet.awayGoals}`
        : '? × ?'

      // Home team (right-aligned around center)
      setText(COLORS.textDark)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(home, W / 2 - 12, rowY, { align: 'right' })

      // Score (centered, bold colored)
      if (bet && bet.homeGoals !== '') {
        setText(COLORS.accent)
        pdf.setFont('helvetica', 'bold')
      } else {
        setText(COLORS.textMuted)
        pdf.setFont('helvetica', 'normal')
      }
      pdf.setFontSize(10)
      pdf.text(score, W / 2, rowY, { align: 'center' })

      // Away team
      setText(COLORS.textDark)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text(away, W / 2 + 12, rowY)

      rowY += 5.5
    })

    y += cardHeight + 4
  }

  // ── Knockout stage ─────────────────────────────────────────────────────
  newPage()
  y = M + 8
  y = sectionHeader('MATA-MATA', y, COLORS.success)
  y += 2

  const koPhases: Array<{ key: string; label: string; teams?: string[]; single?: string }> = [
    { key: 'r32',      label: 'Round de 32 — 16 picks',  teams: koBets.r32 },
    { key: 'r16',      label: 'Oitavas — 8 picks',       teams: koBets.r16 },
    { key: 'qf',       label: 'Quartas — 4 picks',       teams: koBets.qf },
    { key: 'sf',       label: 'Semifinais — 2 picks',    teams: koBets.sf },
    { key: 'third',    label: '3° Lugar',                single: koBets.third },
    { key: 'champion', label: 'Campeão',                 single: koBets.champion },
  ]

  for (const phase of koPhases) {
    const list = phase.teams ?? (phase.single ? [phase.single] : [])
    const cardH = 10 + Math.max(1, Math.ceil(list.length / 2)) * 6 + 4
    y = ensureSpace(cardH + 4, y)

    setStroke(COLORS.border)
    pdf.setLineWidth(0.2)
    pdf.roundedRect(M, y, W - 2 * M, cardH, 2, 2)

    setText(COLORS.textDark)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(phase.label, M + 4, y + 6)

    if (list.length === 0) {
      setText(COLORS.textMuted)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.text('— sem palpite —', M + 4, y + 13)
    } else {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      // Special highlight for the champion
      const isChampion = phase.key === 'champion'
      if (isChampion) {
        setFill(COLORS.accent)
        pdf.roundedRect(M + 4, y + 9, 80, 7, 1, 1, 'F')
        setText([255, 255, 255])
        pdf.setFont('helvetica', 'bold')
        pdf.text(`👑 ${TEAMS[list[0]!]?.name ?? list[0]}`, M + 6, y + 14)
      } else {
        setText(COLORS.textDark)
        // 2 columns
        list.forEach((teamId, i) => {
          const colX = M + 6 + (i % 2) * ((W - 2 * M) / 2 - 4)
          const rowY = y + 13 + Math.floor(i / 2) * 6
          pdf.text(`•  ${TEAMS[teamId]?.name ?? teamId}`, colX, rowY)
        })
      }
    }

    y += cardH + 4
  }

  addFooter()

  // ── Save ───────────────────────────────────────────────────────────────
  const fileName = `bolao-2026-${userName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`
  pdf.save(fileName)
}
