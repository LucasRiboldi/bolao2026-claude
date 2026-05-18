/**
 * Single source of truth for knockout round accent colors.
 * Used by BetScreen, MyBetsScreen, StandingsScreen (bracket) and any future
 * KO-related view. Keeps colors consistent across screens.
 *
 * Values intentionally HEX (not design tokens) because they encode the
 * FIFA round identity (R32 red, R16 orange, etc.) — not a semantic role.
 * If we ever pivot the bracket palette, change here once.
 */
export type RoundKey = 'r32' | 'r16' | 'qf' | 'sf' | 'champion' | 'third'

// Indexed by string for ergonomic lookup in consumers that pass a generic
// `colorKey: string`. Unknown keys return undefined — callers fall back.
export const ROUND_COLORS: Record<string, string> = {
  r32:      '#e74c3c',
  r16:      '#e67e22',
  qf:       '#f39c12',
  sf:       '#2ecc71',
  champion: '#d4aa2c',
  third:    '#607d8b',
}
