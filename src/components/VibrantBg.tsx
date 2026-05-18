/**
 * VibrantBg — full-screen vibrant wallpaper used by AuthScreen and AppShell.
 *
 * Renders a stack of animated mesh blobs in the "We Are 26" host-nation
 * palette, a smoky noise overlay, and a soft vignette. Pure decoration —
 * pointer-events: none. CSS lives in src/styles/vibrant-bg.css.
 *
 * Usage:
 *   <VibrantBg />                       // absolute, fills parent
 *   <VibrantBg fixed />                 // fixed to viewport, behind content
 *   <VibrantBg confetti />              // adds falling confetti dots
 */
interface VibrantBgProps {
  fixed?: boolean
  confetti?: boolean
}

export function VibrantBg({ fixed = false, confetti = false }: VibrantBgProps) {
  return (
    <div
      className={['vibrant-bg', fixed ? 'vibrant-bg--fixed' : ''].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <div className="vibrant-bg__mesh">
        <div className="vibrant-bg__blob vibrant-bg__blob--red" />
        <div className="vibrant-bg__blob vibrant-bg__blob--blue" />
        <div className="vibrant-bg__blob vibrant-bg__blob--green" />
        <div className="vibrant-bg__blob vibrant-bg__blob--yellow" />
        <div className="vibrant-bg__blob vibrant-bg__blob--purple" />
        <div className="vibrant-bg__blob vibrant-bg__blob--orange" />
        <div className="vibrant-bg__blob vibrant-bg__blob--pink" />
      </div>
      {confetti && (
        <div className="vibrant-bg__confetti">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className={`vibrant-bg__dot vibrant-bg__dot--${i % 6}`} />
          ))}
        </div>
      )}
    </div>
  )
}
