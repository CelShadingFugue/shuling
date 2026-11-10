import { useCallback, useEffect, useRef, useState } from 'react'
import { MEMBERS, deleteTask, toggleDuty, updateTask, updateMilestone, removeMilestones } from './model/board'
import { useBoard } from './state/useBoard'
import Timeline from './components/Timeline'
import DutyZone from './components/DutyZone'
import TaskDetail from './components/TaskDetail'
import BatchBar from './components/BatchBar'
import Toolbar from './components/Toolbar'
import MarkEditor from './components/MarkEditor'

function place(rect, width, est = 340) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.min(Math.max(10, rect.left - 8), vw - width - 10)
  let top = rect.bottom + 10
  if (top + est > vh - 10) top = Math.max(10, rect.top - est - 10)
  return { left, top, width }
}

export default function App() {
  const { board, commit, undo, reset, replace, canUndo } = useBoard()
  const [selection, setSelection] = useState(() => new Set())
  const [hover, setHover] = useState(null)
  const [markSel, setMarkSel] = useState(() => new Set())
  const [markEdit, setMarkEdit] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('ourApp.theme') || 'light')
  const [settings, setSettings] = useState(() => {
    try {
      return { nowLine: true, dim: true, ...JSON.parse(localStorage.getItem('ourApp.settings') || '{}') }
    } catch {
      return { nowLine: true, dim: true }
    }
  })
  const hideTimer = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('ourApp.theme', theme) } catch { /* ignore */ }
  }, [theme])

  useEffect(() => {
    try { localStorage.setItem('ourApp.settings', JSON.stringify(settings)) } catch { /* ignore */ }
  }, [settings])

  const selRef = useRef(selection)
  selRef.current = selection
  const markSelRef = useRef(markSel)
  markSelRef.current = markSel

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = [...selRef.current]
        const mids = [...markSelRef.current]
        if (!ids.length && !mids.length) return
        e.preventDefault()
        commit((b) => {
          let next = mids.length ? removeMilestones(b, mids) : b
          return ids.reduce((acc, id) => deleteTask(acc, id), next)
        })
        setSelection(new Set())
        setMarkSel(new Set())
        setHover(null)
        return
      }
      if (e.key === 'Escape') { setSelection(new Set()); setMarkSel(new Set()); setHover(null); setMarkEdit(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [commit, undo])

  // 时间点详情：不点外面就不消失
  useEffect(() => {
    if (!markEdit) return
    const onDown = (e) => {
      if (e.target.closest && (e.target.closest('.mk-editor') || e.target.closest('.mk-grip'))) return
      setMarkEdit(null)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [markEdit])

  const openTask = useCallback((id, el) => {
    clearTimeout(hideTimer.current)
    setHover({ id, rect: el.getBoundingClientRect() })
  }, [])

  const closeTask = useCallback(() => {
    // 悬停详情晚一点再收，给鼠标留出「移进去点圆点」的时间
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setHover(null), 560)
  }, [])

  const keepOpen = useCallback(() => clearTimeout(hideTimer.current), [])

  const task = hover ? board.tasks.find((t) => t.id === hover.id) : null
  const group = task ? board.groups.find((g) => g.id === task.groupId) : null

  const onToggleMember = (taskId, mid) => commit((b) => toggleDuty(b, taskId, mid))

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'board.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const importJson = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const next = JSON.parse(reader.result)
        if (!replace(next)) alert('这个文件不像看板数据（缺 groups / tasks）')
      } catch {
        alert('读不了这个文件')
      }
    }
    reader.readAsText(file)
  }
  const onColor = (taskId, color) => commit((b) => updateTask(b, taskId, { color }))

  const ids = [...selection]

  const allPinned = ids.length > 0 && ids.every((id) => (board.tasks.find((t) => t.id === id) || {}).pinned)
  const batchTogglePin = () => commit((b) =>
    ids.reduce((acc, id) => updateTask(acc, id, { pinned: !allPinned }), b)
  )
  const batchMember = (mid) => commit((b) =>
    ids.reduce((acc, id) => {
      const has = (acc.duty[id] || []).includes(mid)
      return toggleDuty(acc, id, mid)
    }, b)
  )
  const batchColor = (color) => commit((b) =>
    ids.reduce((acc, id) => updateTask(acc, id, { color }), b)
  )
  const batchDelete = () => {
    commit((b) => ids.reduce((acc, id) => deleteTask(acc, id), b))
    setSelection(new Set())
  }

  return (
    <div className="app">
      <Toolbar
        canUndo={canUndo}
        onUndo={undo}
        onReset={() => { if (confirm('恢复到初始数据？')) { reset(); setSelection(new Set()) } }}
        settings={settings}
        setSettings={setSettings}
        theme={theme}
        setTheme={setTheme}
        onExport={exportJson}
        onImport={importJson}
      />

      <Timeline
        board={board}
        commit={commit}
        selection={selection}
        setSelection={setSelection}
        markSel={markSel}
        setMarkSel={setMarkSel}
        onEditMark={(id, elOrRect) => setMarkEdit({ id, rect: elOrRect.getBoundingClientRect ? elOrRect.getBoundingClientRect() : elOrRect })}
        onOpenTask={openTask}
        onCloseTask={closeTask}
        nowLine={settings.nowLine}
        dim={settings.dim}
      />

      <section className="duties">
        <div className="duties-title">负责域 · 每人参与了什么</div>
        <div className="duties-grid">
          {MEMBERS.map((m) => (
            <DutyZone key={m.id} member={m} board={board} onOpenTask={openTask} onCloseTask={closeTask} />
          ))}
        </div>
      </section>

      {selection.size > 0 && (
        <BatchBar
          count={selection.size}
          allPinned={allPinned}
          onTogglePin={batchTogglePin}
          onMember={batchMember}
          onColor={batchColor}
          onDelete={batchDelete}
          onClear={() => setSelection(new Set())}
        />
      )}

      {markEdit && (() => {
        const m = (board.milestones || []).find((x) => x.id === markEdit.id)
        if (!m) return null
        return (
          <div
            className="popover"
            style={place(
              { left: markEdit.rect.left, right: markEdit.rect.right, top: markEdit.rect.top, bottom: markEdit.rect.top + 26 },
              280,
              300
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <MarkEditor
              mark={m}
              onChange={(patch) => commit((b) => updateMilestone(b, m.id, patch))}
              onDelete={() => {
                commit((b) => removeMilestones(b, [m.id]))
                setMarkEdit(null)
              }}
              onClose={() => setMarkEdit(null)}
            />
          </div>
        )
      })()}

      {task && group && (
        <div className="popover" style={place(hover.rect, 330)}
          onMouseEnter={keepOpen} onMouseLeave={closeTask}>
          <TaskDetail
            task={task}
            group={group}
            duty={board.duty[task.id] || []}
            onToggle={(mid) => onToggleMember(task.id, mid)}
            onColor={(c) => onColor(task.id, c)}
          />
        </div>
      )}
    </div>
  )
}
