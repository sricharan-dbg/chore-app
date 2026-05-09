export const TASK_COLORS = [
  { label: 'Slate',   bg: 'rgba(100,116,139,0.12)', border: '#64748b', text: '#94a3b8' },
  { label: 'Blue',    bg: 'rgba(59,130,246,0.12)',   border: '#3b82f6', text: '#60a5fa' },
  { label: 'Violet',  bg: 'rgba(139,92,246,0.12)',   border: '#8b5cf6', text: '#a78bfa' },
  { label: 'Rose',    bg: 'rgba(244,63,94,0.12)',    border: '#f43f5e', text: '#fb7185' },
  { label: 'Amber',   bg: 'rgba(245,158,11,0.12)',   border: '#f59e0b', text: '#fbbf24' },
  { label: 'Emerald', bg: 'rgba(16,185,129,0.12)',   border: '#10b981', text: '#34d399' },
  { label: 'Sky',     bg: 'rgba(14,165,233,0.12)',   border: '#0ea5e9', text: '#38bdf8' },
  { label: 'Orange',  bg: 'rgba(249,115,22,0.12)',   border: '#f97316', text: '#fb923c' },
]

const AVATAR_PALETTE = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e',
  '#f59e0b', '#0ea5e9', '#f97316', '#06b6d4',
  '#84cc16', '#ec4899',
]

export function getAvatarColor(str = '') {
  let hash = 0
  for (const c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function getTaskColor(index = 0) {
  return TASK_COLORS[index % TASK_COLORS.length]
}
