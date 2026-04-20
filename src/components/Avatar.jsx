import { getAvatarColor, initials } from '../lib/colors'

export default function Avatar({ name = '', size = 28, className = '' }) {
  const bg = getAvatarColor(name)
  const sz = `${size}px`
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold select-none flex-shrink-0 ${className}`}
      style={{
        width: sz, height: sz, minWidth: sz,
        background: `${bg}22`,
        border: `1.5px solid ${bg}66`,
        color: bg,
        fontSize: size < 28 ? 10 : 12,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
