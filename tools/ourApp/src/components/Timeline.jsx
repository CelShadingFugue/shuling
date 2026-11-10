import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  RAIL, LANE_H, LEVELS, CHART_START, CHART_END,
  parse, snapTime, minVisible, weekOrdinalOf, WEEKDAY,
  ticksBetween, minorTicks, guideLabel, fmtDateTime,
} from '../model/time'
import { MEMBERS, updateTask, addTask, freeLane, patchGroup, reorderGroup, extract, pasteInto, toISOLocal } from '../model/board'
import { tint } from '../model/tint'

const HEADER_H = 46
const p2 = (n) => String(n).padStart(2, '0')

function majorLabel(t, level) {
  const d = new Date(t)
  if (level === 0) return d.getMonth() === 0 && d.getDate() === 1 ? `${d.getFullYear()}` : `${d.getMonth() + 1}月`
  if (level <= 2) return `${d.getMonth() + 1}月`
  if (level <= 4) return `第${weekOrdinalOf(t)}周`
  if (level === 5) return `${WEEKDAY[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`
  return `${p2(d.getHours())}:00`
}

function minorLabel(t, level) {
  const d = new Date(t)
  if (level === 0) return `${d.getMonth() + 1}`
  if (level === 1) return `${d.getDate()}`
  if (level === 2) return d.getDay() === 1 ? `第${weekOrdinalOf(t)}周` : ''
  if (level === 3 || level === 4) return `${d.getDate()}`
  return `${p2(d.getHours())}`
}

export default function Timeline({
  board, commit, selection, setSelection,
  onOpenTask, onCloseTask, nowLine, dim,
}) {
  const scrollRef = useRef(null)
  const [viewW, setViewW] = useState(1000)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [level, setLevel] = useState(1)
  const [drag, setDrag] = useState(null)
  const [marquee, setMarquee] = useState(null)

  const pending = useRef(null)
  const dragLive = useRef(null)
  const pressTimer = useRef(null)
  const hoverGroupRef = useRef(null)
  const pasteAnchor = useRef(Date.now())

  const pxPerMs = viewW / LEVELS[level].span
  const spanPx = (CHART_END - CHART_START) * pxPerMs
  const xOf = useCallback((ts) => (ts - CHART_START) * pxPerMs, [pxPerMs])
  const tOf = useCallback((px) => CHART_START + px / pxPerMs, [pxPerMs])

  /* ---------------------------------------------------------- 测量 */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewW(Math.max(200, el.clientWidth - RAIL)))
    ro.observe(el)
    setViewW(Math.max(200, el.clientWidth - RAIL))
    return () => ro.disconnect()
  }, [])

  /* ---------------------------------------------------------- 缩放 / 滚动（必须非 passive） */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const rect = el.getBoundingClientRect()
        const anchorPx = e.clientX - rect.left
        pending.current = { t: tOf(el.scrollLeft + anchorPx - RAIL), anchorPx }
        const next = Math.max(0, Math.min(LEVELS.length - 1, level + (e.deltaY < 0 ? -1 : 1)))
        if (next !== level) setLevel(next)
        else pending.current = null
      } else if (e.shiftKey) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [level, tOf])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !pending.current) return
    const { t, anchorPx } = pending.current
    pending.current = null
    el.scrollLeft = (t - CHART_START) * pxPerMs + RAIL - anchorPx
    setScrollLeft(el.scrollLeft)
  }, [level, pxPerMs])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrollLeft(el.scrollLeft))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  /* ---------------------------------------------------------- 拖拽 */
  const beginDrag = useCallback(
    (e, task, mode) => {
      const o = {
        id: task.id, mode, groupId: task.groupId,
        clientX: e.clientX, clientY: e.clientY,
        start: parse(task.start), end: parse(task.end), lane: task.lane,
      }
      dragLive.current = o
      setDrag({ ...o })

      const minSpan = LEVELS[level].span / 60

      const move = (ev) => {
        const d = dragLive.current
        if (!d) return
        const dt = (ev.clientX - d.clientX) / pxPerMs
        if (d.mode === 'resize') {
          let end = snapTime(d.end + dt, level)
          if (end - d.start < minSpan) end = d.start + minSpan
          d.end = end
        } else {
          const dur = d.end - d.start
          const s = snapTime(d.start + dt, level)
          d.start = s
          d.end = s + dur
          d.lane = Math.max(0, Math.min(30, d.lane + Math.round((ev.clientY - d.clientY) / LANE_H)))
        }
        setDrag({ ...d })
      }

      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        const d = dragLive.current
        dragLive.current = null
        setDrag(null)
        if (!d) return
        if (d.start === parse(task.start) && d.end === parse(task.end) && d.lane === task.lane) return
        commit((b) => {
          const lane = freeLane(b.tasks, d.groupId, d.start, d.end, d.id)
          return updateTask(b, d.id, {
            start: toISOLocal(d.start),
            end: toISOLocal(d.end),
            lane: d.mode === 'resize' ? lane : Math.max(d.lane, lane),
          })
        })
      }

      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [commit, level, pxPerMs]
  )

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const onChipPointerDown = (e, task) => {
    if (e.button !== 0) return
    e.stopPropagation()
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selection)
      if (next.has(task.id)) next.delete(task.id)
      else next.add(task.id)
      setSelection(next)
      return
    }
    setSelection(new Set([task.id]))
    if (task.pinned) return
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null
      beginDrag(e, task, 'move')
    }, 240)
    const cancel = () => {
      clearPress()
      window.removeEventListener('pointerup', cancel)
    }
    window.addEventListener('pointerup', cancel)
  }

  const onTrackPointerDown = (e) => {
    if (!e.ctrlKey || e.button !== 0) return
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x0 = e.clientX - rect.left
    const y0 = e.clientY - rect.top
    const move = (ev) => {
      const x1 = ev.clientX - rect.left
      const y1 = ev.clientY - rect.top
      setMarquee({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) })
    }
    const up = (ev) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const x1 = ev.clientX - rect.left
      const y1 = ev.clientY - rect.top
      const box = { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) }
      setMarquee(null)
      if (box.w < 4 && box.h < 4) return
      const ids = board.tasks
        .filter((t) => t.groupId === (el.dataset.group || ''))
        .filter((t) => {
          const tx = (parse(t.start) - CHART_START) * pxPerMs
          const tw = (parse(t.end) - parse(t.start)) * pxPerMs
          const ty = t.lane * LANE_H
          return tx < box.x + box.w && tx + tw > box.x && ty < box.y + box.h && ty + 24 > box.y
        })
        .map((t) => t.id)
      setSelection(new Set(ids))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /* ---------------------------------------------------------- 复制粘贴 */
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key.toLowerCase() === 'c' && selection.size) {
        const clip = extract(board, [...selection])
        if (clip) window.__ourAppClip = clip
      }
      if (meta && e.key.toLowerCase() === 'v' && window.__ourAppClip && hoverGroupRef.current) {
        e.preventDefault()
        const gid = hoverGroupRef.current
        const at = pasteAnchor.current
        commit((b) => {
          const next = pasteInto(b, window.__ourAppClip, gid, at)
          delete next.__created
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [board, selection, commit])

  /* ---------------------------------------------------------- 刻度 */
  const tA = tOf(scrollLeft - RAIL)
  const tB = tOf(scrollLeft + viewW + RAIL)
  const majors = useMemo(() => ticksBetween(tA, tB, level, pxPerMs), [tA, tB, level, pxPerMs])
  const minors = useMemo(() => minorTicks(tA, tB, level, pxPerMs), [tA, tB, level, pxPerMs])

  const groups = [...board.groups].sort((a, b) => a.order - b.order)
  const hideShort = minVisible(level)
  const now = Date.now()

  const onCreate = (groupId) => {
    const s = snapTime(pasteAnchor.current, level)
    const e = s + Math.max(LEVELS[level].span / 40, 3600000)
    const next = commit((b) => addTask(b, groupId, s, e, '新任务').board)
    const mine = next.tasks.filter((t) => t.groupId === groupId)
    if (mine.length) setSelection(new Set([mine[mine.length - 1].id]))
  }

  return (
    <div className={'tl' + (drag ? ' is-dragging' : '') + (dim ? '' : ' no-dim')}>
      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-canvas" style={{ width: RAIL + spanPx }}>
          <div className="tl-head" style={{ height: HEADER_H }}>
            <div className="tl-corner" style={{ width: RAIL }}>
              <span>{LEVELS[level].name}视图</span>
              <em>Ctrl + 滚轮缩放</em>
            </div>
            <div className="tl-head-tracks">
              {majors.map((m) => (
                <div key={m.t} className="tick-major" style={{ left: m.px }}>
                  {majorLabel(m.t, level)}
                </div>
              ))}
              {minors.map((m) => (
                <div key={m.t} className="tick-minor" style={{ left: m.px }}>
                  {minorLabel(m.t, level)}
                </div>
              ))}
            </div>
          </div>

          <div className="tl-grid" style={{ left: RAIL, width: spanPx, top: HEADER_H }}>
            {minors.map((m) => <i key={m.t} className="g-minor" style={{ left: m.px }} />)}
            {majors.map((m) => <i key={m.t} className="g-major" style={{ left: m.px }} />)}
          </div>

          {nowLine && now >= CHART_START && now <= CHART_END && (
            <div className="tl-now" style={{ left: RAIL + xOf(now), top: HEADER_H }}><span>现在</span></div>
          )}

          <div className="tl-rows">
            {groups.map((g) => {
              const mine = board.tasks.filter((t) => t.groupId === g.id)
              const laneCount = mine.length ? Math.max(...mine.map((t) => t.lane)) + 1 : 1
              return (
                <div
                  key={g.id}
                  className={'tl-row' + (g.collapsed ? ' collapsed' : '')}
                  style={{ height: g.collapsed ? 14 : laneCount * LANE_H + 12 }}
                  onMouseEnter={() => { hoverGroupRef.current = g.id }}
                  onMouseLeave={() => { if (hoverGroupRef.current === g.id) hoverGroupRef.current = null }}
                >
                  <div className="tl-rail" style={{ width: RAIL }}>
                    <i className="rail-color" style={{ background: g.color }} />
                    <span className="rail-name" title={g.name}>{g.name}</span>
                    <div className="rail-btns">
                      <button title={g.collapsed ? '展开' : '折叠'} onClick={() => commit((b) => patchGroup(b, g.id, { collapsed: !g.collapsed }))}>{g.collapsed ? '›' : '‹'}</button>
                      <button title="锁定排序" className={g.pinned ? 'on' : ''} onClick={() => commit((b) => patchGroup(b, g.id, { pinned: !g.pinned }))}>📌</button>
                      {!g.pinned && (
                        <>
                          <button title="上移" onClick={() => commit((b) => reorderGroup(b, g.id, -1))}>▲</button>
                          <button title="下移" onClick={() => commit((b) => reorderGroup(b, g.id, 1))}>▼</button>
                        </>
                      )}
                      <button className="add" title="新建子任务" onClick={() => onCreate(g.id)}>＋</button>
                    </div>
                  </div>

                  <div
                    className="tl-track"
                    data-group={g.id}
                    style={{ width: spanPx }}
                    onPointerDown={onTrackPointerDown}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      pasteAnchor.current = snapTime(tOf(e.clientX - rect.left), level)
                    }}
                  >
                    {!g.collapsed && mine.map((t) => {
                      const s = parse(t.start)
                      const e2 = parse(t.end)
                      const dur = e2 - s
                      const hidden = dur < hideShort && !selection.has(t.id) && drag?.id !== t.id
                      const x = xOf(s)
                      const w = Math.max(4, dur * pxPerMs)
                      const dragging = drag?.id === t.id
                      return (
                        <div
                          key={t.id}
                          className={
                            'chip' + (t.pinned ? ' pinned' : '') + (selection.has(t.id) ? ' selected' : '') +
                            (dragging ? ' dragging' : '') + (hidden ? ' hidden' : '') +
                            (t.color && t.color !== 'auto' ? ' c-' + t.color : '')
                          }
                          style={{
                            left: x, width: w, top: t.lane * LANE_H + 6,
                            borderLeft: `3px solid ${g.color}`,
                            ...(t.color && t.color !== 'auto'
                              ? {}
                              : { background: tint(g.color, 0.1), borderColor: tint(g.color, 0.34) }),
                          }}
                          onPointerDown={(ev) => onChipPointerDown(ev, t)}
                          onMouseEnter={(ev) => { if (!drag) onOpenTask(t.id, ev.currentTarget) }}
                          onMouseLeave={() => { if (!drag) onCloseTask() }}
                        >
                          <span className="chip-id">{t.id}</span>
                          <span className="chip-name">{t.name}</span>
                          <span className="chip-dots">
                            {(board.duty[t.id] || []).map((mid) => (
                              <i key={mid} style={{ background: (MEMBERS.find((m) => m.id === mid) || {}).color }} />
                            ))}
                          </span>
                          {t.pinned && <span className="pin">📌</span>}
                          {!t.pinned && (
                            <div className="chip-resize" onPointerDown={(ev) => { ev.stopPropagation(); beginDrag(ev, t, 'resize') }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {drag && (
            <>
              <div className="guide" style={{ left: RAIL + xOf(drag.start), top: HEADER_H }}><b>{guideLabel(drag.start, level)}</b></div>
              <div className="guide end" style={{ left: RAIL + xOf(drag.end), top: HEADER_H }}><b>{guideLabel(drag.end, level)}</b></div>
              <div className="drag-hint" style={{ left: RAIL + Math.max(8, xOf(drag.start)) }}>
                {fmtDateTime(drag.start)} → {fmtDateTime(drag.end)}
                <em>{drag.end > drag.start ? Math.round((drag.end - drag.start) / 3600000) : 0} 小时</em>
              </div>
            </>
          )}

          {marquee && (
            <div className="marquee" style={{ left: RAIL + marquee.x, top: HEADER_H + marquee.y, width: marquee.w, height: marquee.h }} />
          )}
        </div>
      </div>
    </div>
  )
}
