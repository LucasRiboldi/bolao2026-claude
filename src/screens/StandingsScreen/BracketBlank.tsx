import { KNOCKOUT_SLOTS, KNOCKOUT_ROUNDS } from '@/data/bracket'

function slotLabel(slot: string): string {
  // T3_ABCDF → "3° de {A,B,C,D,F}" (Art. 12.6 eligibility)
  if (slot.startsWith('T3_')) {
    const letters = slot.slice(3).split('').join(',')
    return `3° {${letters}}`
  }
  const pos   = slot[0] === '1' ? '1°' : '2°'
  const group = slot[1]
  return `${pos} Gr.${group}`
}

function refLabel(ref: string): string {
  if (ref.startsWith('W:r32_')) return `Venc. R32-M${ref.replace('W:r32_', '').padStart(2, '0')}`
  if (ref.startsWith('W:r16_')) return `Venc. Oit.-M${ref.replace('W:r16_', '')}`
  if (ref.startsWith('W:qf_'))  return `Venc. QF-M${ref.replace('W:qf_', '')}`
  if (ref.startsWith('W:sf_'))  return `Venc. SF-M${ref.replace('W:sf_', '')}`
  if (ref.startsWith('L:sf_'))  return `Perd. SF-M${ref.replace('L:sf_', '')}`
  return ref
}

export function BracketBlank() {
  return (
    <div className="bracket-blank">
      <div className="bracket-blank__header">
        <span className="bracket-blank__title">⚡ Chaveamento do Mata-Mata</span>
        <span className="bracket-blank__sub">Estrutura oficial Copa 2026</span>
      </div>

      {/* R32 */}
      <div className="bracket-blank__section">
        <div className="bracket-blank__round-label" style={{ borderLeftColor: '#e74c3c' }}>
          Round de 32
        </div>
        <div className="bracket-blank__matches">
          {KNOCKOUT_SLOTS.map((slot, i) => (
            <div key={slot.id} className="bracket-blank__match">
              <span className="bracket-blank__match-num">M{String(i + 1).padStart(2, '0')}</span>
              <span className="bracket-blank__slot">{slotLabel(slot.homeSlot)}</span>
              <span className="bracket-blank__vs">×</span>
              <span className="bracket-blank__slot">{slotLabel(slot.awaySlot)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* R16, QF, SF, Final, 3rd */}
      {KNOCKOUT_ROUNDS.map(round => {
        const color =
          round.name === 'Oitavas'        ? '#e67e22' :
          round.name === 'Quartas'        ? '#f39c12' :
          round.name === 'Semifinais'     ? '#2ecc71' :
          round.name === 'Final'          ? '#d4aa2c' :
          round.name === 'Terceiro Lugar' ? '#607d8b' : 'var(--border)'
        return (
          <div key={round.name} className="bracket-blank__section">
            <div className="bracket-blank__round-label" style={{ borderLeftColor: color }}>
              {round.name}
            </div>
            <div className="bracket-blank__matches">
              {round.matches.map((match, i) => (
                <div key={match.id} className="bracket-blank__match">
                  <span className="bracket-blank__match-num">M{String(i + 1).padStart(2, '0')}</span>
                  <span className="bracket-blank__slot bracket-blank__slot--ref">{refLabel(match.home)}</span>
                  <span className="bracket-blank__vs">×</span>
                  <span className="bracket-blank__slot bracket-blank__slot--ref">{refLabel(match.away)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="bracket-blank__note">
        Dados oficiais serão exibidos após o início da Copa
      </div>
    </div>
  )
}
