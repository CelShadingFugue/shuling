/** #RRGGBB → rgba(r,g,b,a)。用来给卡片上极浅的主线色底。 */
export function tint(hex, a = 0.1) {
  const h = String(hex || '#888888').replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
