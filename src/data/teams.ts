import type { Team, TeamId } from '@/types'

export const TEAMS: Record<TeamId, Team> = {
  // GROUP A
  mexico:      { name: 'México',          short: 'MEX', flag: '🇲🇽', iso: 'mx' },
  southafrica: { name: 'África do Sul',   short: 'RSA', flag: '🇿🇦', iso: 'za' },
  southkorea:  { name: 'Coreia do Sul',   short: 'KOR', flag: '🇰🇷', iso: 'kr' },
  czechia:     { name: 'Tchéquia',        short: 'CZE', flag: '🇨🇿', iso: 'cz' },
  // GROUP B
  canada:      { name: 'Canadá',          short: 'CAN', flag: '🇨🇦', iso: 'ca' },
  switzerland: { name: 'Suíça',           short: 'SUI', flag: '🇨🇭', iso: 'ch' },
  qatar:       { name: 'Catar',           short: 'QAT', flag: '🇶🇦', iso: 'qa' },
  bosnia:      { name: 'Bósnia e Herz.',  short: 'BIH', flag: '🇧🇦', iso: 'ba' },
  // GROUP C
  brazil:      { name: 'Brasil',          short: 'BRA', flag: '🇧🇷', iso: 'br' },
  morocco:     { name: 'Marrocos',        short: 'MAR', flag: '🇲🇦', iso: 'ma' },
  haiti:       { name: 'Haiti',           short: 'HAI', flag: '🇭🇹', iso: 'ht' },
  scotland:    { name: 'Escócia',         short: 'SCO', flag: '🏴',   iso: 'gb-sct' },
  // GROUP D
  usa:         { name: 'Estados Unidos',  short: 'USA', flag: '🇺🇸', iso: 'us' },
  paraguay:    { name: 'Paraguai',        short: 'PAR', flag: '🇵🇾', iso: 'py' },
  australia:   { name: 'Austrália',       short: 'AUS', flag: '🇦🇺', iso: 'au' },
  turkey:      { name: 'Turquia',         short: 'TUR', flag: '🇹🇷', iso: 'tr' },
  // GROUP E
  germany:     { name: 'Alemanha',        short: 'GER', flag: '🇩🇪', iso: 'de' },
  curacao:     { name: 'Curaçao',         short: 'CUW', flag: '🇨🇼', iso: 'cw' },
  ivorycoast:  { name: 'Costa do Marfim', short: 'CIV', flag: '🇨🇮', iso: 'ci' },
  ecuador:     { name: 'Equador',         short: 'ECU', flag: '🇪🇨', iso: 'ec' },
  // GROUP F
  netherlands: { name: 'Holanda',         short: 'NED', flag: '🇳🇱', iso: 'nl' },
  japan:       { name: 'Japão',           short: 'JPN', flag: '🇯🇵', iso: 'jp' },
  tunisia:     { name: 'Tunísia',         short: 'TUN', flag: '🇹🇳', iso: 'tn' },
  sweden:      { name: 'Suécia',          short: 'SWE', flag: '🇸🇪', iso: 'se' },
  // GROUP G
  belgium:     { name: 'Bélgica',         short: 'BEL', flag: '🇧🇪', iso: 'be' },
  egypt:       { name: 'Egito',           short: 'EGY', flag: '🇪🇬', iso: 'eg' },
  iran:        { name: 'Irã',             short: 'IRN', flag: '🇮🇷', iso: 'ir' },
  newzealand:  { name: 'Nova Zelândia',   short: 'NZL', flag: '🇳🇿', iso: 'nz' },
  // GROUP H
  spain:       { name: 'Espanha',         short: 'ESP', flag: '🇪🇸', iso: 'es' },
  capeverde:   { name: 'Cabo Verde',      short: 'CPV', flag: '🇨🇻', iso: 'cv' },
  saudiarabia: { name: 'Arábia Saudita',  short: 'KSA', flag: '🇸🇦', iso: 'sa' },
  uruguay:     { name: 'Uruguai',         short: 'URU', flag: '🇺🇾', iso: 'uy' },
  // GROUP I
  france:      { name: 'França',          short: 'FRA', flag: '🇫🇷', iso: 'fr' },
  senegal:     { name: 'Senegal',         short: 'SEN', flag: '🇸🇳', iso: 'sn' },
  norway:      { name: 'Noruega',         short: 'NOR', flag: '🇳🇴', iso: 'no' },
  iraq:        { name: 'Iraque',          short: 'IRQ', flag: '🇮🇶', iso: 'iq' },
  // GROUP J
  argentina:   { name: 'Argentina',       short: 'ARG', flag: '🇦🇷', iso: 'ar' },
  algeria:     { name: 'Argélia',         short: 'ALG', flag: '🇩🇿', iso: 'dz' },
  austria:     { name: 'Áustria',         short: 'AUT', flag: '🇦🇹', iso: 'at' },
  jordan:      { name: 'Jordânia',        short: 'JOR', flag: '🇯🇴', iso: 'jo' },
  // GROUP K
  portugal:    { name: 'Portugal',        short: 'POR', flag: '🇵🇹', iso: 'pt' },
  uzbekistan:  { name: 'Uzbequistão',     short: 'UZB', flag: '🇺🇿', iso: 'uz' },
  colombia:    { name: 'Colômbia',        short: 'COL', flag: '🇨🇴', iso: 'co' },
  drcongo:     { name: 'RD Congo',        short: 'COD', flag: '🇨🇩', iso: 'cd' },
  // GROUP L
  england:     { name: 'Inglaterra',      short: 'ENG', flag: '🏴',   iso: 'gb-eng' },
  croatia:     { name: 'Croácia',         short: 'CRO', flag: '🇭🇷', iso: 'hr' },
  ghana:       { name: 'Gana',            short: 'GHA', flag: '🇬🇭', iso: 'gh' },
  panama:      { name: 'Panamá',          short: 'PAN', flag: '🇵🇦', iso: 'pa' },
}

export function teamDisplayName(teamId: TeamId): string {
  const t = TEAMS[teamId]
  if (!t) return teamId
  return t.name.length > 10 ? t.short : t.name
}

export function teamLabel(id: TeamId | null | undefined, useFull = true): string {
  if (!id) return '?'
  const t = TEAMS[id]
  if (!t) return id
  return `${t.flag} ${useFull ? t.name : t.short}`
}

export function nameInitials(name: string): string {
  const parts = (name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}
