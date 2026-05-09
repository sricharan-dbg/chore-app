import { getAvatarColor, initials } from '../lib/colors'

export default function Avatar({ name = '', size = 28, color, className = '' }) {
  const bg = color || getAvatarColor(name)
  const fontSize = Math.max(9, Math.round(size * 0.36))

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: `${bg}22`,
        border: `1.5px solid ${bg}55`,
        color: bg,
        fontSize,
        letterSpacing: '-0.01em',
      }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
