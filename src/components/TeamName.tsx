import type { TeamId } from '@/types'
import { TEAMS } from '@/data/teams'

interface TeamNameProps {
  teamId: TeamId
  /**
   * When true, hides on small viewports and shows on large.
   * Used inside tight rows (bet cards, KO chips) where the short code
   * works better on mobile but the full name fits comfortably on desktop.
   */
  responsive?: boolean
  /** Force a specific variant regardless of viewport. */
  variant?: 'full' | 'short'
  className?: string
}

/**
 * Renders both the full name and the 3-letter short code as separate spans;
 * CSS toggles which one is visible based on the viewport (see .team-name
 * styles in design-system.css).
 *
 * Why both in DOM? Accessibility (screen readers always read the full name),
 * no JS resize listener needed, no layout-shift flicker on resize.
 */
export function TeamName({ teamId, responsive = true, variant, className }: TeamNameProps) {
  const team = TEAMS[teamId]
  if (!team) return <span className={className}>{teamId}</span>

  if (variant === 'short') {
    return <span className={['team-name', className].filter(Boolean).join(' ')}>{team.short}</span>
  }
  if (variant === 'full') {
    return <span className={['team-name', className].filter(Boolean).join(' ')}>{team.name}</span>
  }

  // Responsive (default): both rendered, CSS hides one
  if (responsive) {
    return (
      <span className={['team-name team-name--responsive', className].filter(Boolean).join(' ')}>
        <span className="team-name__full"  aria-hidden="false">{team.name}</span>
        <span className="team-name__short" aria-hidden="true">{team.short}</span>
      </span>
    )
  }

  return <span className={['team-name', className].filter(Boolean).join(' ')}>{team.name}</span>
}
