import { useCallback, useEffect, useRef, useState } from 'react'
import { MEMBERS, deleteTask, toggleDuty, updateTask } from './model/board'
import { useBoard } from './state/useBoard'
import Timeline from './components/Timeline'
import DutyZone from './components/DutyZone'
import TaskDetail from './components/TaskDetail'
import BatchBar from './components/BatchBar'
import Toolbar from './components/Toolbar'

function place(rect, width, est = 340) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.min(Math.max(10, rect.left - 8), vw - width - 10)
  let top = rect.bottom + 10
  if (top + est > vh - 10) top = Math.max(10, rect.top - est - 10)
  return { left, top, width }
}

export default function App() {
  const { board, commit, undo, reset, canUndo } = useBoard()
  const [selection, setSelection] = useState(() => new Set())
  const [hover, setHover] = useState(null)
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

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSelection(new Set()); setHover(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openTask = useCallback((id, el) => {
    clearTimeout(hideTimer.current)
    setHover({ id, rect: el.getBoundingClientRect() })
  }, [])

  const closeTask = useCallback(() => {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setHover(null), 160)
  }, [])

  const keepOpen = useCallback(() => clearTimeout(hideTimer.current), [])

  const task = hover ? board.tasks.find((t) => t.id === hover.id) : null
  const group = task ? board.groups.find((g) => g.id === task.groupId) : null

  const onToggleMember = (taskId, mid) => commit((b) => toggleDuty(b, taskId, mid))
  const onColor = (taskId, color) => commit((b) => updateTask(b, taskId, { color }))

  const ids = [...selection]

  const batchPin = (v) => commit((b) =>
    ids.reduce((acc, id) => updateTask(acc, id, { pinned: v }), b)
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
      />

      <Timeline
        board={board}
        commit={commit}
        selection={selection}
        setSelection={setSelection}
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
          onPin={() => batchPin(true)}
          onUnpin={() => batchPin(false)}
          onMember={batchMember}
          onColor={batchColor}
          onDelete={batchDelete}
          onClear={() => setSelection(new Set())}
        />
      )}

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
