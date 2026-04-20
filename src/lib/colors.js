export const CHORE_COLORS = [
  { label: 'Purple', bg: 'rgba(180,77,255,0.2)', border: '#b44dff', text: '#b44dff' },
  { label: 'Blue',   bg: 'rgba(77,159,255,0.2)', border: '#4d9fff', text: '#4d9fff' },
  { label: 'Cyan',   bg: 'rgba(0,229,255,0.15)', border: '#00e5ff', text: '#00e5ff' },
  { label: 'Pink',   bg: 'rgba(255,77,170,0.2)', border: '#ff4daa', text: '#ff4daa' },
  { label: 'Green',  bg: 'rgba(0,255,159,0.15)', border: '#00ff9f', text: '#00ff9f' },
  { label: 'Orange', bg: 'rgba(255,159,0,0.2)',  border: '#ff9f00', text: '#ff9f00' },
]

export const AVATAR_COLORS = [
  '#b44dff', '#4d9fff', '#00e5ff', '#ff4daa', '#00ff9f', '#ff9f00',
  '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2',
]

export function getColorByIndex(i) {
  return CHORE_COLORS[i % CHORE_COLORS.length]
}

export function getAvatarColor(str = '') {
  let hash = 0
  for (let c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
