// 数据与纯操作。所有修改都返回新的 board，不原地改。
// 下一轮（接 git 同步时）这里换成「仓储」，组件不用动。

import { parse, startOf, add } from './time.js'

const T = (id, groupId, name, start, end, extra = {}) => ({
  id, groupId, name, start, end,
  lane: 0, order: 0, pinned: false, color: 'auto', ...extra,
})

export const MEMBERS = [
  { id: '1', name: '李金峰', short: '峰', color: '#B5762A' },
  { id: '2', name: '冯百懋', short: '懋', color: '#2E6F6A' },
  { id: '3', name: '张子涵', short: '涵', color: '#6B5B95' },
  { id: '4', name: '李美蓉', short: '蓉', color: '#3C6E9F' },
]

export const GROUPS = [
  { id: 'A', name: '硬件与结构', color: '#B5762A', order: 0, pinned: false, collapsed: false },
  { id: 'B', name: '语音链路', color: '#2E6F6A', order: 1, pinned: false, collapsed: false },
  { id: 'C', name: '知识库', color: '#6B5B95', order: 2, pinned: false, collapsed: false },
  { id: 'D', name: '视觉与数据', color: '#3C6E9F', order: 3, pinned: false, collapsed: false },
  { id: 'E', name: '系统与交付', color: '#5E7C4A', order: 4, pinned: false, collapsed: false },
  { id: 'P', name: '项目管理', color: '#8A8578', order: 5, pinned: false, collapsed: false },
]

export const TASKS = [
  T('A1', 'A', '选型与采购清单', '2026-12-01T00:00', '2027-01-31T23:59'),
  T('A2', 'A', '供电与接线', '2027-03-01T00:00', '2027-03-31T23:59'),
  T('A3', 'A', '外壳与整机装配', '2027-03-15T00:00', '2027-04-30T23:59'),
  T('A4', 'A', '稳定性测试', '2027-05-01T00:00', '2027-05-31T23:59'),

  T('B1', 'B', '麦克风与 VAD', '2026-12-01T00:00', '2027-01-31T23:59'),
  T('B2', 'B', 'ASR 接入', '2026-12-01T00:00', '2026-12-31T23:59'),
  T('B3', 'B', 'TTS 接入', '2026-12-01T00:00', '2027-01-15T23:59'),
  T('B4', 'B', '打断与降级', '2027-05-01T00:00', '2027-05-31T23:59'),
  T('B5', 'B', '延迟打点与报告', '2026-12-01T00:00', '2027-02-28T23:59'),

  T('C1', 'C', '教材知识点整理', '2026-12-01T00:00', '2027-01-31T23:59'),
  T('C2', 'C', 'RAG 库搭建', '2026-12-01T00:00', '2027-01-31T23:59'),
  T('C3', 'C', '教学策略与提示词', '2027-03-01T00:00', '2027-03-31T23:59'),
  T('C4', 'C', '评测集与 badcase', '2026-12-01T00:00', '2027-11-30T23:59'),

  T('D1', 'D', '教材页数据集', '2027-03-01T00:00', '2027-04-30T23:59'),
  T('D2', 'D', '页面 / 区域检测', '2027-06-01T00:00', '2027-07-31T23:59'),
  T('D3', 'D', 'OCR 与指读定位', '2027-06-15T00:00', '2027-07-31T23:59'),

  T('E1', 'E', '仓库与 README', '2026-12-01T00:00', '2026-12-31T23:59'),
  T('E2', 'E', '一键部署', '2027-03-01T00:00', '2027-03-31T23:59'),
  T('E3', 'E', '开机自启 / 日志 / 演示机', '2027-03-15T00:00', '2027-04-30T23:59'),
  T('E4', 'E', '演示视频与答辩材料', '2027-09-01T00:00', '2027-11-30T23:59'),

  T('P0', 'P', '第一次组会', '2026-12-07T14:00', '2026-12-07T16:00'),
  T('P1', 'P', '进度与记录', '2026-12-01T00:00', '2027-11-30T23:59'),
  T('P2', 'P', '经费与报销', '2026-12-01T00:00', '2027-11-30T23:59'),
  T('P3', 'P', '对外对接', '2026-12-01T00:00', '2027-11-30T23:59'),
]

export const DUTY = {
  A1: ['4'],
  B1: ['3'],
  B2: ['2'],
  B5: ['1'],
  E1: ['4'],
}

/* ---------------------------------------------------------------- 排布 */

export const span = (t) => [parse(t.start), parse(t.end)]
const overlap = (a, b) => {
  const [as, ae] = span(a)
  const [bs, be] = span(b)
  return as <= be && bs <= ae
}

/** 行号压缩：空行消失，相对上下不变。压缩优先于 pin（pin 只锁时间，见 05 的 I3） */
export function normalizeLanes(tasks, groupId) {
  const mine = tasks.filter((t) => t.groupId === groupId)
  const others = tasks.filter((t) => t.groupId !== groupId)
  const sorted = [...mine].sort((a, b) => a.lane - b.lane || a.order - b.order)
  const lanes = [...new Set(sorted.map((t) => t.lane))].sort((a, b) => a - b)
  const map = new Map(lanes.map((l, i) => [l, i]))
  return [...others, ...sorted.map((t) => ({ ...t, lane: map.get(t.lane) }))]
}

/** 从 from 这一行开始，找一个能放下 [start,end] 的空行（往下让，不往上传） */
export function freeLane(tasks, groupId, start, end, ignoreId, from = 0) {
  const mine = tasks.filter((t) => t.groupId === groupId && t.id !== ignoreId)
  const probe = { start, end }
  for (let lane = Math.max(0, from); lane < 60; lane++) {
    const busy = mine.some((t) => t.lane === lane && overlap(t, probe))
    if (!busy) return lane
  }
  return Math.max(0, from)
}

/**
 * 读盘时修一次：同一行里时间重叠的任务，往下让。
 * 防止某次异常的写入把看板永久弄脏。
 */
export function repairLanes(board) {
  const byGroup = {}
  board.tasks.forEach((t) => {
    byGroup[t.groupId] = byGroup[t.groupId] || []
    byGroup[t.groupId].push(t)
  })
  let out = []
  Object.keys(byGroup).forEach((gid) => {
    const placed = []
    byGroup[gid]
      .slice()
      .sort((a, b) => parse(a.start) - parse(b.start))
      .forEach((t) => {
        const s = parse(t.start)
        const e = parse(t.end)
        let lane = Math.max(0, t.lane || 0)
        const busy = (l) => placed.some((p) => p.lane === l && !(e < p.s || s > p.e))
        while (busy(lane) && lane < 60) lane++
        placed.push({ lane, s, e })
        out.push({ ...t, lane })
      })
  })
  let next = { ...board, tasks: out }
  Object.keys(byGroup).forEach((gid) => {
    next = { ...next, tasks: normalizeLanes(next.tasks, gid) }
  })
  return next
}
export function groupRowCount(tasks, groupId) {
  const mine = tasks.filter((t) => t.groupId === groupId)
  return mine.length ? Math.max(...mine.map((t) => t.lane)) + 1 : 1
}

/* ---------------------------------------------------------------- 操作 */

export function withTasks(board, tasks, groupId) {
  return { ...board, tasks: groupId ? normalizeLanes(tasks, groupId) : tasks }
}

export function updateTask(board, id, patch) {
  const t = board.tasks.find((x) => x.id === id)
  if (!t) return board
  const next = { ...t, ...patch }
  let tasks = board.tasks.map((x) => (x.id === id ? next : x))
  // 换了组要两边都压
  if (patch.groupId && patch.groupId !== t.groupId) {
    tasks = normalizeLanes(tasks, t.groupId)
    return withTasks(board, tasks, patch.groupId)
  }
  return withTasks(board, tasks, next.groupId)
}

export function addTask(board, groupId, start, end, name = '新任务') {
  const s = Math.min(start, end)
  const e = Math.max(start, end)
  const lane = freeLane(board.tasks, groupId, s, e)
  const maxOrder = Math.max(0, ...board.tasks.filter((t) => t.groupId === groupId).map((t) => t.order))
  const id = `${groupId}${Date.now().toString(36).slice(-4)}`
  const task = {
    id, groupId, name,
    start: toISOLocal(s), end: toISOLocal(e),
    lane, order: maxOrder + 1, pinned: false, color: 'auto',
  }
  return { board: withTasks(board, [...board.tasks, task], groupId), id }
}

export function deleteTask(board, id) {
  const t = board.tasks.find((x) => x.id === id)
  if (!t) return board
  const duty = { ...board.duty }
  delete duty[id]
  return { ...board, duty, tasks: normalizeLanes(board.tasks.filter((x) => x.id !== id), t.groupId) }
}

export function toggleDuty(board, taskId, memberId) {
  const cur = board.duty[taskId] || []
  const next = cur.includes(memberId) ? cur.filter((x) => x !== memberId) : [...cur, memberId]
  const duty = { ...board.duty }
  if (next.length) duty[taskId] = next
  else delete duty[taskId]
  return { ...board, duty }
}

export function reorderGroup(board, groupId, dir) {
  const list = [...board.groups].sort((a, b) => a.order - b.order)
  const i = list.findIndex((g) => g.id === groupId)
  const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return board
  const a = list[i]
  const b = list[j]
  if (a.pinned || b.pinned) return board // pin = 秩序，不许插队
  const groups = board.groups.map((g) =>
    g.id === a.id ? { ...g, order: b.order } : g.id === b.id ? { ...g, order: a.order } : g
  )
  return { ...board, groups }
}

export function patchGroup(board, groupId, patch) {
  return { ...board, groups: board.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)) }
}

/* ---------------------------------------------------------------- 复制粘贴 */

export function extract(board, ids) {
  const picked = board.tasks.filter((t) => ids.includes(t.id))
  if (!picked.length) return null
  const base = Math.min(...picked.map((t) => parse(t.start)))
  const baseLane = Math.min(...picked.map((t) => t.lane))
  return {
    items: picked.map((t) => ({
      dt: parse(t.start) - base,
      dur: parse(t.end) - parse(t.start),
      lane: t.lane - baseLane,
      name: t.name,
      color: t.color,
    })),
  }
}

export function pasteInto(board, clip, groupId, anchor) {
  if (!clip) return board
  let tasks = [...board.tasks]
  const maxOrder = Math.max(0, ...tasks.filter((t) => t.groupId === groupId).map((t) => t.order))
  const created = []
  ;[...clip.items]
    .sort((a, b) => a.lane - b.lane || a.dt - b.dt)
    .forEach((it, i) => {
      const s = anchor + it.dt
      const e = s + it.dur
      const lane = freeLane(tasks, groupId, s, e)
      const id = `${groupId}${Date.now().toString(36).slice(-3)}${i}`
      tasks.push({
        id, groupId, name: it.name, start: toISOLocal(s), end: toISOLocal(e),
        lane, order: maxOrder + 1 + i, pinned: false, color: it.color,
      })
      created.push(id)
    })
  return { ...withTasks(board, tasks, groupId), __created: created }
}

export function toISOLocal(ts) {
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export const INITIAL = {
  groups: GROUPS,
  tasks: packAll(TASKS),
  duty: DUTY,
}

/** 初始数据按时间先后自动分层，避免同一条线上的卡片互相盖住 */
function packAll(tasks) {
  const byGroup = {}
  tasks.forEach((t) => {
    byGroup[t.groupId] = byGroup[t.groupId] || []
    byGroup[t.groupId].push(t)
  })
  const out = []
  Object.keys(byGroup).forEach((gid) => {
    const rows = []
    byGroup[gid]
      .slice()
      .sort((a, b) => parse(a.start) - parse(b.start))
      .forEach((t) => {
        const s = parse(t.start)
        const e = parse(t.end)
        let lane = 0
        while (rows[lane] && rows[lane].some((x) => !(e < x.s || s > x.e))) lane++
        rows[lane] = rows[lane] || []
        rows[lane].push({ s, e })
        out.push({ ...t, lane })
      })
  })
  return out
}
