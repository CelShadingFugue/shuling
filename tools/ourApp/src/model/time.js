// 时间与刻度：整个应用只在这一层把「时间」换成「像素」。
// 任何组件都不许自己算 px，必须走这里。

export const MS = { min: 60000, hour: 3600000, day: 86400000 }

export const RAIL = 128 // 左侧主任务轨道宽度
export const LANE_H = 30 // 每个子行高
export const CHIP_H = 24

// 整张图的固定范围：2026-12-01 ~ 2027-12-01
export const CHART_START = new Date(2026, 10, 1).getTime()
export const CHART_END = new Date(2027, 11, 1).getTime()

/* ---------------------------------------------------------------- 解析 / 格式化 */

export function parse(s) {
  const [d, t] = String(s).split('T')
  const [y, mo, da] = d.split('-').map(Number)
  const [h, mi] = (t || '00:00').split(':').map(Number)
  return new Date(y, mo - 1, da, h, mi || 0, 0, 0).getTime()
}

const p2 = (n) => String(n).padStart(2, '0')

export function toISO(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`
}

export function fmtDate(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function fmtDateTime(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${p2(d.getHours())}:${p2(d.getMinutes())}`
}

export const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/* ---------------------------------------------------------------- 日历运算（周一为一周起点） */

export function startOf(ts, unit) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  switch (unit) {
    case 'hour':
      d.setMinutes(0, 0, 0)
      break
    case 'day':
      break
    case 'week': {
      const wd = (d.getDay() + 6) % 7 // 周一 = 0
      d.setDate(d.getDate() - wd)
      break
    }
    case 'halfMonth':
      d.setDate(d.getDate() <= 15 ? 1 : 16)
      break
    case 'month':
      d.setDate(1)
      break
    case 'quarter':
      d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1)
      break
    case 'half':
      d.setMonth(Math.floor(d.getMonth() / 6) * 6, 1)
      break
    case 'year':
      d.setMonth(0, 1)
      break
  }
  return d.getTime()
}

export function add(ts, unit, n = 1) {
  const d = new Date(ts)
  switch (unit) {
    case 'min':
      d.setMinutes(d.getMinutes() + n)
      break
    case 'hour':
      d.setHours(d.getHours() + n)
      break
    case 'day':
      d.setDate(d.getDate() + n)
      break
    case 'week':
      d.setDate(d.getDate() + 7 * n)
      break
    case 'halfMonth': {
      // 半月是「1 号 / 16 号」，不是「加 15 天」——后者会一路漂
      let k = Math.abs(n)
      while (k-- > 0) {
        if (n > 0) {
          if (d.getDate() === 1) d.setDate(16)
          else d.setMonth(d.getMonth() + 1, 1)
        } else {
          if (d.getDate() === 16) d.setDate(1)
          else d.setMonth(d.getMonth() - 1, 16)
        }
      }
      break
    }
    case 'month':
      d.setMonth(d.getMonth() + n)
      break
    case 'quarter':
      d.setMonth(d.getMonth() + 3 * n)
      break
    case 'half':
      d.setMonth(d.getMonth() + 6 * n)
      break
    case 'year':
      d.setFullYear(d.getFullYear() + n)
      break
  }
  return d.getTime()
}

/** 这个月的第几个周一（本月第一个周一 = 第 1 周） */
export function weekOrdinalOf(ts) {
  const first = startOf(ts, 'month')
  const wd = (new Date(first).getDay() + 6) % 7 // 周一 = 0
  const firstMonday = add(first, 'day', (7 - wd) % 7)
  const monday = startOf(ts, 'week')
  return Math.floor((monday - firstMonday) / (7 * MS.day)) + 1
}

/* ---------------------------------------------------------------- 七级刻度 */

/**
 * pxPerMs 由「视口宽度 / span」动态算出，这里只定义每一级看多远、
 * 主刻度画什么、次刻度画什么、拖动吸附到哪。
 */
export const LEVELS = [
  { key: 'year', name: '年', span: 365 * MS.day, major: ['quarter', 1], minor: ['month', 1], snap: ['month', 1] },
  { key: 'half', name: '半年', span: 182 * MS.day, major: ['month', 1], minor: ['halfMonth', 1], snap: ['halfMonth', 1] },
  { key: 'quarter', name: '季', span: 91 * MS.day, major: ['month', 1], minor: ['week', 1], snap: ['week', 1] },
  { key: 'month', name: '月', span: 30 * MS.day, major: ['week', 1], minor: ['day', 1], snap: ['day', 1] },
  { key: 'halfMonth', name: '半月', span: 15 * MS.day, major: ['week', 1], minor: ['day', 1], snap: ['day', 1] },
  { key: 'week', name: '周', span: 7 * MS.day, major: ['day', 1], minor: ['hour', 6], snap: ['hour', 6] },
  { key: 'day', name: '日', span: MS.day, major: ['hour', 6], minor: ['hour', 1], snap: ['hour', 1] },
]

export const snapStep = (level) => LEVELS[level].snap[0] === 'month'
  ? null
  : { unit: LEVELS[level].snap[0], n: LEVELS[level].snap[1] }

export function snapTime(ts, level) {
  const [unit, n] = LEVELS[level].snap
  if (unit === 'month' || unit === 'quarter' || unit === 'half' || unit === 'year') {
    return startOf(ts, unit)
  }
  const base = startOf(ts, unit === 'hour' ? 'hour' : 'day')
  const size = n * (MS[unit] || MS.day)
  return base + Math.round((ts - base) / size) * size
}

/** 小于「视口跨度 / 12」的任务不画 */
export function minVisible(level) {
  return LEVELS[level].span / 12
}

/* ---------------------------------------------------------------- 刻度生成 */

/**
 * 只生成可视范围内的刻度，但 px 一律是「画布绝对坐标」（从 origin 算起）。
 * 之前按可视区起点算，一滚动整排刻度就跟着漂，看起来比卡片快一倍。
 */
export function ticksBetween(t0, t1, level, pxPerMs, origin) {
  const [mu, mn] = LEVELS[level].major
  const out = []
  let t = startOf(t0, mu)
  t = add(t, mu, -mn)
  let guard = 0
  while (t <= t1 && guard++ < 800) {
    out.push({ t, kind: 'major', px: (t - origin) * pxPerMs })
    t = add(t, mu, mn)
  }
  return out
}

export function minorTicks(t0, t1, level, pxPerMs, origin) {
  const [nu, nn] = LEVELS[level].minor
  if (nn * (MS[nu] || MS.day) * pxPerMs < 6) return []
  const out = []
  let t = startOf(t0, nu)
  let guard = 0
  while (t <= t1 && guard++ < 4000) {
    out.push({ t, px: (t - origin) * pxPerMs })
    t = add(t, nu, nn)
  }
  return out
}

export function majorLabel(t, level) {
  const d = new Date(t)
  switch (level) {
    case 0:
      return `${d.getFullYear()}`
    case 1:
      return `${d.getMonth() + 1}月`
    case 2:
      return `${d.getFullYear()}.${p2(d.getMonth() + 1)}`
    case 3:
    case 4:
      return `${d.getMonth() + 1}月`
    case 5:
      return `${d.getMonth() + 1}月`
    default:
      return `${p2(d.getHours())}:00`
  }
}

/** 次要刻度上的小字：月视图挂「周序数」，周视图挂「星期 + 月日」 */
export function minorLabel(t, level) {
  const d = new Date(t)
  const wd = WEEKDAY[d.getDay()]
  if (level === 2 || level === 3) {
    if (d.getDay() === 1) return `第${weekOrdinalOf(t)}周`
    return ''
  }
  if (level === 4) {
    return d.getDay() === 1 ? `第${weekOrdinalOf(t)}周` : ''
  }
  if (level === 5) return `${wd}`
  if (level === 6) return `${p2(d.getHours())}`
  return ''
}

/** 拖动时挂在参考线两端的时间标签 */
export function guideLabel(ts, level) {
  const d = new Date(ts)
  if (level <= 1) return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`
  if (level <= 4) return `${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
  return fmtDateTime(ts)
}
