#!/usr/bin/env node
/**
 * ourApp CLI —— 直接改 data/board.json，跟网页共用同一份数据结构。
 *
 *   node cli.mjs list                     看所有任务
 *   node cli.mjs groups                   看主线
 *   node cli.mjs show A1                  看一个任务
 *   node cli.mjs task add --group A --name "接线" --start 2027-03-01 --end 2027-03-20
 *   node cli.mjs task set A1 --start 2027-03-05 --pin
 *   node cli.mjs task rm A1
 *   node cli.mjs group set A --name "硬件" --color "#B5762A" --collapse
 *   node cli.mjs group move A up
 *   node cli.mjs duty A1 +2 -3            给 A1 加 2 号、去掉 3 号
 *   node cli.mjs who 2                    2 号成员参与了什么
 *   node cli.mjs check                    检查数据有没有坏
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.join(ROOT, 'data', 'board.json')

const MEMBERS = {
  1: '李金峰', 2: '冯百懋', 3: '张子涵', 4: '李美蓉',
}
const MEMBER_BY_NAME = { 李金峰: '1', 峰: '1', 冯百懋: '2', 懋: '2', 张子涵: '3', 涵: '3', 李美蓉: '4', 蓉: '4' }

/* ---------------------------------------------------------------- 读写 */

function load() {
  if (!fs.existsSync(DATA)) fail(`找不到 ${DATA}，先跑一次 node cli.mjs init`)
  return JSON.parse(fs.readFileSync(DATA, 'utf8'))
}

let dirty = false
let db = null

function save() {
  if (!dirty) return
  db.rev = (db.rev || 0) + 1
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2) + '\n', 'utf8')
  console.log(dim(`已保存 · rev ${db.rev}`))
}

function fail(msg) {
  console.error('✗ ' + msg)
  process.exit(1)
}
const dim = (s) => `\x1b[2m${s}\x1b[0m`
const bold = (s) => `\x1b[1m${s}\x1b[0m`
const c = (s) => `\x1b[36m${s}\x1b[0m`

/* ---------------------------------------------------------------- 工具 */

const pad = (s, n) => String(s).padEnd(n, ' ')
const fmt = (t) => (t || '').replace('T', ' ')

function parseDay(s) {
  if (!s) return null
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/)
  if (!m) fail(`时间格式不对：${s}（要 2027-03-01 或 2027-03-01T14:00）`)
  return `${m[1]}-${m[2]}-${m[3]}T${m[4] || '00'}:${m[5] || '00'}`
}
const ts = (s) => new Date(s.replace('T', ' ')).getTime()

function overlap(a, b) {
  const as = ts(a.start), ae = ts(a.end), bs = ts(b.start), be = ts(b.end)
  return as <= be && bs <= ae
}

function freeLane(groupId, start, end, ignoreId) {
  const mine = db.tasks.filter((t) => t.groupId === groupId && t.id !== ignoreId)
  for (let lane = 0; lane < 60; lane++) {
    if (!mine.some((t) => t.lane === lane && overlap(t, { start, end }))) return lane
  }
  return 0
}

function compact(groupId) {
  const mine = db.tasks.filter((t) => t.groupId === groupId).sort((a, b) => a.lane - b.lane || a.order - b.order)
  const lanes = [...new Set(mine.map((t) => t.lane))].sort((a, b) => a - b)
  const map = new Map(lanes.map((l, i) => [l, i]))
  mine.forEach((t) => { t.lane = map.get(t.lane) })
  db.tasks = db.tasks.map((t) => mine.find((x) => x.id === t.id) || t)
}

const findTask = (id) => db.tasks.find((t) => t.id === id)
const findGroup = (id) => db.groups.find((g) => g.id === id)

function needTask(id) {
  const t = findTask(id)
  if (!t) fail(`没有这个任务：${id}`)
  return t
}
function needGroup(id) {
  const g = findGroup(id)
  if (!g) fail(`没有这条主线：${id}`)
  return g
}

/* ---------------------------------------------------------------- 命令 */

const argv = process.argv.slice(2)
const cmd = argv[0]

const flags = {}
const rest = []
for (let i = 1; i < argv.length; i++) {
  const a = argv[i]
  if (a.startsWith('--')) {
    const k = a.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) { flags[k] = next; i++ }
    else flags[k] = true
  } else rest.push(a)
}

if (!cmd || cmd === 'help' || flags.help) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 18).join('\n').replace(/^ \* ?/gm, ''))
  process.exit(0)
}

db = load()
if (!db.rev) db.rev = 0

switch (cmd) {
  case 'init': {
    if (fs.existsSync(DATA)) fail('data/board.json 已经存在，不覆盖')
    fail('请用 node make-data.mjs 生成初始数据')
    break
  }

  case 'list': {
    const gs = [...db.groups].sort((a, b) => a.order - b.order)
    for (const g of gs) {
      if (flags.group && flags.group !== g.id) continue
      const mine = db.tasks.filter((t) => t.groupId === g.id)
      console.log(`\n${bold(g.id + ' ' + g.name)}  ${dim(`${mine.length} 项`)}`)
      mine.sort((a, b) => ts(a.start) - ts(b.start)).forEach((t) => {
        const who = (db.duty[t.id] || []).map((m) => MEMBERS[m] || m).join('、')
        const pin = t.pinned ? ' 🔒' : '   '
        console.log(`  ${pin} ${pad(t.id, 4)} ${pad(t.name, 22)} ${pad(fmt(t.start).slice(0, 10), 12)}→${pad(fmt(t.end).slice(0, 10), 12)} ${dim(who || '')}`)
      })
    }
    break
  }

  case 'groups': {
    const gs = [...db.groups].sort((a, b) => a.order - b.order)
    gs.forEach((g) => {
      const n = db.tasks.filter((t) => t.groupId === g.id).length
      console.log(`${pad(g.id, 3)} ${pad(g.name, 12)} ${pad(g.color, 9)} ${g.pinned ? '🔒' : '  '} ${g.collapsed ? '折叠' : '    '} ${dim(n + ' 项')}`)
    })
    break
  }

  case 'show': {
    const id = rest[0] || fail('用法：show <任务id>')
    const t = needTask(id)
    const g = findGroup(t.groupId)
    console.log(bold(`${t.id}  ${t.name}`))
    console.log(`  主线    ${g.id} ${g.name}`)
    console.log(`  时间    ${fmt(t.start)} → ${fmt(t.end)}`)
    console.log(`  行/序   lane ${t.lane} / order ${t.order}`)
    console.log(`  锁定    ${t.pinned ? '是' : '否'}`)
    console.log(`  颜色    ${t.color}`)
    console.log(`  参与    ${(db.duty[t.id] || []).map((m) => `${m} ${MEMBERS[m]}`).join('、') || '无'}`)
    break
  }

  case 'task': {
    const sub = rest[0]
    if (sub === 'add') {
      const gid = flags.group || fail('要 --group')
      needGroup(gid)
      const start = parseDay(flags.start || '2026-12-01')
      const end = parseDay(flags.end || start)
      const id = nextId(gid)
      const t = {
        id, groupId: gid, name: flags.name || '新任务',
        start, end,
        lane: freeLane(gid, start, end),
        order: Math.max(0, ...db.tasks.filter((x) => x.groupId === gid).map((x) => x.order)) + 1,
        pinned: !!flags.pin, color: flags.color || 'auto',
      }
      db.tasks.push(t)
      compact(gid)
      dirty = true
      console.log(`✓ 已建 ${bold(id)} ${t.name}`)
    } else if (sub === 'set') {
      const t = needTask(rest[1] || fail('用法：task set <id> ...'))
      if (flags.name) t.name = flags.name
      if (flags.start) t.start = parseDay(flags.start)
      if (flags.end) t.end = parseDay(flags.end)
      if (flags.color) t.color = flags.color
      if (flags.pin) t.pinned = true
      if (flags.unpin) t.pinned = false
      if (ts(t.end) < ts(t.start)) fail('结束时间早于开始时间')
      t.lane = freeLane(t.groupId, t.start, t.end, t.id)
      compact(t.groupId)
      dirty = true
      console.log(`✓ 已改 ${bold(t.id)}`)
    } else if (sub === 'rm') {
      const t = needTask(rest[1] || fail('用法：task rm <id>'))
      db.tasks = db.tasks.filter((x) => x.id !== t.id)
      delete db.duty[t.id]
      compact(t.groupId)
      dirty = true
      console.log(`✓ 已删 ${bold(t.id)} ${t.name}`)
    } else fail('task add | set | rm')
    break
  }

  case 'group': {
    const sub = rest[0]
    if (sub === 'set') {
      const g = needGroup(rest[1] || fail('用法：group set <id> ...'))
      if (flags.name) g.name = flags.name
      if (flags.color) g.color = flags.color
      if (flags.pin) g.pinned = true
      if (flags.unpin) g.pinned = false
      if (flags.collapse) g.collapsed = true
      if (flags.expand) g.collapsed = false
      dirty = true
      console.log(`✓ 已改主线 ${bold(g.id)}`)
    } else if (sub === 'move') {
      const g = needGroup(rest[1] || fail('用法：group move <id> up|down|<序号>'))
      const gs = [...db.groups].sort((a, b) => a.order - b.order)
      const i = gs.findIndex((x) => x.id === g.id)
      const to = rest[2] === 'up' ? i - 1 : rest[2] === 'down' ? i + 1 : Number(rest[2]) - 1
      if (isNaN(to) || to < 0 || to >= gs.length) fail('位置不合法')
      gs.splice(i, 1)
      gs.splice(to, 0, g)
      gs.forEach((x, k) => { x.order = k })
      dirty = true
      console.log(`✓ ${bold(g.id)} 移到第 ${to + 1} 位`)
    } else fail('group set | move')
    break
  }

  case 'duty': {
    const id = rest[0] || fail('用法：duty <任务id> +2 -3')
    needTask(id)
    const cur = new Set(db.duty[id] || [])
    rest.slice(1).forEach((tok) => {
      const m = tok[0] === '+' ? tok.slice(1) : tok[0] === '-' ? tok.slice(1) : tok
      const code = MEMBER_BY_NAME[m] || m
      if (!MEMBERS[code]) fail(`没有这个成员：${m}`)
      if (tok[0] === '-') cur.delete(code)
      else cur.add(code)
    })
    if (cur.size) db.duty[id] = [...cur].sort()
    else delete db.duty[id]
    dirty = true
    console.log(`✓ ${bold(id)} 参与：${(db.duty[id] || []).map((m) => MEMBERS[m]).join('、') || '无'}`)
    break
  }

  case 'who': {
    const code = MEMBER_BY_NAME[rest[0]] || rest[0]
    if (!MEMBERS[code]) fail('没有这个成员')
    const mine = db.tasks.filter((t) => (db.duty[t.id] || []).includes(code))
    console.log(`${bold(MEMBERS[code])} 参与了 ${mine.length} 项`)
    mine.forEach((t) => console.log(`  ${pad(t.id, 4)} ${pad(t.name, 22)} ${dim(findGroup(t.groupId).name)}`))
    break
  }

  case 'check': {
    let bad = 0
    db.tasks.forEach((t) => {
      if (!findGroup(t.groupId)) { console.log(`✗ ${t.id} 的组 ${t.groupId} 不存在`); bad++ }
      if (ts(t.end) < ts(t.start)) { console.log(`✗ ${t.id} 结束早于开始`); bad++ }
    })
    db.groups.forEach((g) => {
      const mine = db.tasks.filter((t) => t.groupId === g.id)
      for (let i = 0; i < mine.length; i++) {
        for (let j = i + 1; j < mine.length; j++) {
          if (mine[i].lane === mine[j].lane && overlap(mine[i], mine[j])) {
            console.log(`✗ ${mine[i].id} 与 ${mine[j].id} 同行且时间重叠`)
            bad++
          }
        }
      }
    })
    console.log(bad ? `\n${bad} 处问题` : '✓ 数据没问题')
    process.exitCode = bad ? 1 : 0
    break
  }

  default:
    fail(`不认识的命令：${cmd}`)
}

save()

function nextId(gid) {
  const used = new Set(db.tasks.map((t) => t.id))
  for (let i = 1; i < 100; i++) {
    const id = gid + i
    if (!used.has(id)) return id
  }
  return gid + Date.now().toString(36)
}
