// 时间轴的全部坐标换算都放这里。改起止时间只需要改 data/index.js。

export const CHART_START_YEAR = 2026
export const CHART_START_MONTH = 12
export const MONTH_COUNT = 12

export const MONTHS = Array.from({ length: MONTH_COUNT }, (_, i) => {
  const d = new Date(CHART_START_YEAR, CHART_START_MONTH - 1 + i, 1)
  const m = d.getMonth() + 1
  return {
    index: i,
    key: `${d.getFullYear()}-${String(m).padStart(2, '0')}`,
    label: `${m}月`,
    year: d.getFullYear(),
    isYearStart: m === 1,
  }
})

export function toIndex(ym) {
  const [y, m] = ym.split('-').map(Number)
  return (y - CHART_START_YEAR) * 12 + (m - CHART_START_MONTH)
}

export function spanStyle(start, end) {
  const s = toIndex(start)
  const e = toIndex(end)
  return {
    left: `${(s / MONTH_COUNT) * 100}%`,
    width: `${((e - s + 1) / MONTH_COUNT) * 100}%`,
  }
}

// 验收节点画在这个月的月末，也就是两列之间的那条缝上
export function milestonePct(at) {
  return ((toIndex(at) + 1) / MONTH_COUNT) * 100
}

export function milestoneLeft(at) {
  return `${milestonePct(at)}%`
}

/** 贴着左右岸的标签要换个对齐方式，否则会被裁掉 */
export function labelStyle(at) {
  const p = milestonePct(at)
  const transform = p <= 8 ? 'translateX(0)' : p >= 92 ? 'translateX(-100%)' : 'translateX(-50%)'
  return { left: `${p}%`, transform }
}

export function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return `${y.slice(2)}/${String(Number(m)).padStart(2, '0')}`
}

/**
 * 同一条主线上时间重叠的卡片不能叠在一起，
 * 用贪心算法把它们塞进不同的子行。
 */
export function packRows(tasks) {
  const rows = []
  const placed = [...tasks]
    .sort((a, b) => toIndex(a.start) - toIndex(b.start))
    .map((t) => {
      const s = toIndex(t.start)
      const e = toIndex(t.end)
      let r = rows.findIndex((row) => row.every((x) => e < x.s || s > x.e))
      if (r === -1) {
        rows.push([{ s, e }])
        r = rows.length - 1
      } else {
        rows[r].push({ s, e })
      }
      return { ...t, row: r }
    })
  return { placed, rowCount: Math.max(1, rows.length) }
}
