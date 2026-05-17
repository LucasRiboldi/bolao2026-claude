interface FlagProps {
  iso: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { w: 32, h: 24, w2x: 64,  h2x: 48  },
  md: { w: 48, h: 36, w2x: 96,  h2x: 72  },
  lg: { w: 64, h: 48, w2x: 128, h2x: 96  },
}

export function Flag({ iso, name, size = 'md', className }: FlagProps) {
  const { w, h, w2x, h2x } = SIZE_MAP[size]
  return (
    <img
      className={`team-flag${className ? ` ${className}` : ''}`}
      src={`https://flagcdn.com/${w}x${h}/${iso}.png`}
      srcSet={`https://flagcdn.com/${w2x}x${h2x}/${iso}.png 2x`}
      width={w}
      height={h}
      alt={name}
      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
    />
  )
}
