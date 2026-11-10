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

  /* ---------------------------------------------------------- 拖拽：卡片先跟手，松手才吸附 */
  const dragRef = useRef(null)

  const onChipPointerDown = (e, task, mode = 'move') => {
    if (e.button !== 0) return
    e.stopPropagation()

    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selection)
      if (next.has(task.id)) next.delete(task.id)
      else next.add(task.id)
      setSelection(next)
      return
    }

    if (!selection.has(task.id)) setSelection(new Set([task.id]))
    if (task.pinned) return

    const el = e.currentTarget.closest('.chip')
    const rect = el.getBoundingClientRect()
    const d = {
      id: task.id,
      groupId: task.groupId,
      mode,
      el,
      startX: e.clientX,
      startY: e.clientY,
      s: parse(task.start),
      e2: parse(task.end),
      lane: task.lane,
      w0: rect.width,
      moved: false,
      guide: null,
    }
    dragRef.current = d

    d.move = (ev) => {
      const dx = ev.clientX - d.startX
      const dy = ev.clientY - d.startY
      if (!d.moved) {
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return
        d.moved = true
        d.el.classList.add('dragging')
        setDrag({ id: d.id, start: d.s, end: d.e2, lane: d.lane, mode })
      }
      ev.preventDefault()

      if (mode === 'move') {
        d.el.style.transform = `translate(${dx}px, ${dy}px)`
        const s = snapTime(d.s + dx / pxPerMs, level)
        const e2 = s + (d.e2 - d.s)
        const lane = Math.max(0, Math.min(40, Math.round((d.lane * LANE_H + dy) / LANE_H)))
        if (!d.guide || d.guide.s !== s || d.guide.lane !== lane) {
          d.guide = { s, e: e2, lane }
          setDrag({ id: d.id, start: s, end: e2, lane, mode })
        }
      } else {
        const w = Math.max(14, d.w0 + dx)
        d.el.style.width = `${w}px`
        let e2 = snapTime(d.e2 + dx / pxPerMs, level)
        if (e2 - d.s < 60000) e2 = d.s + 60000
        if (!d.guide || d.guide.e !== e2) {
          d.guide = { s: d.s, e: e2, lane: d.lane }
          setDrag({ id: d.id, start: d.s, end: e2, lane: d.lane, mode })
        }
      }
    }

    d.up = () => {
      window.removeEventListener('pointermove', d.move)
      window.removeEventListener('pointerup', d.up)
      dragRef.current = null
      setDrag(null)
      d.el.classList.remove('dragging')
      d.el.style.transform = ''
      d.el.style.width = `${d.w0}px`

      if (!d.moved || !d.guide) return
      const g = d.guide
      const changed = g.s !== d.s || g.e !== d.e2 || (mode === 'move' && g.lane !== d.lane)
      if (!changed) return

      commit((b) => {
        const from = mode === 'resize' ? d.lane : g.lane
        const lane = freeLane(b.tasks, d.groupId, g.s, g.e, d.id, from)
        return updateTask(b, d.id, {
          start: toISOLocal(g.s),
          end: toISOLocal(g.e),
          lane,
        })
      })
    }

    window.addEventListener('pointermove', d.move)
    window.addEventListener('pointerup', d.up)
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
                            <div className="chip-resize" onPointerDown={(ev) => { ev.stopPropagation(); onChipPointerDown(ev, t, 'resize') }} />
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
