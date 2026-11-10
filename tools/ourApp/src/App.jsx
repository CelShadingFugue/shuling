import { useCallback, useEffect, useRef, useState } from 'react'
import { LINES, PEOPLE, TASKS, MILESTONES } from './data'
import { useParticipation } from './model/participation'
import Timeline from './components/Timeline'
import DutyZone from './components/DutyZone'
import TaskDetail from './components/TaskDetail'

const lineOf = (id) => LINES.find((l) => l.id === id)

/** 弹层贴着鼠标所在的那个元素放，放不下就翻到上面 */
function place(rect, width, estHeight = 320) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.min(Math.max(12, rect.left - 8), vw - width - 12)
  let top = rect.bottom + 10
  if (top + estHeight > vh - 12) top = Math.max(12, rect.top - estHeight - 10)
  return { left, top, width }
}

export default function App() {
  const { toggle, reset, participantsOf } = useParticipation()
  const [hover, setHover] = useState(null)
  const timer = useRef(null)

  const show = useCallback((kind, id, el) => {
    clearTimeout(timer.current)
    setHover({ kind, id, rect: el.getBoundingClientRect() })
  }, [])

  const scheduleHide = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setHover(null), 150)
  }, [])

  const keepOpen = useCallback(() => clearTimeout(timer.current), [])

  // 一滚动就关掉，免得浮层跟着旧坐标乱飘
  useEffect(() => {
    const onScroll = () => setHover(null)
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [])

  const task = hover?.kind === 'task' ? TASKS.find((t) => t.id === hover.id) : null
  const milestone = hover?.kind === 'ms' ? MILESTONES.find((m) => m.id === hover.id) : null

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <b>ourApp</b>
          <span>书灵 · 项目工作台</span>
        </div>
        <div className="top-hint">
          卡片悬停看细节 · 点圆点表示“我参与” · 往下滚动是各自的负责域
        </div>
        <button type="button" className="btn" onClick={reset}>
          重置
        </button>
      </header>

      <section className="board">
        <Timeline
          participantsOf={participantsOf}
          onOpenTask={(id, el) => show('task', id, el)}
          onCloseTask={scheduleHide}
          onOpenMilestone={(id, el) => show('ms', id, el)}
        />
      </section>

      <section className="duties">
        <div className="duties-title">负责域 · 每人参与了什么</div>
        <div className="duties-grid">
          {PEOPLE.map((p) => (
            <DutyZone
              key={p.id}
              person={p}
              participantsOf={participantsOf}
              onOpenTask={(id, el) => show('task', id, el)}
              onCloseTask={scheduleHide}
              onLeave={toggle}
            />
          ))}
        </div>
      </section>

      <footer className="foot">
        v0.1 雏形 · 数据写死在 src/data/index.js · 改了以后跑 pnpm build 重新生成
      </footer>

      {task && (
        <div
          className="popover"
          style={place(hover.rect, 320)}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleHide}
        >
          <TaskDetail
            task={task}
            line={lineOf(task.line)}
            participants={participantsOf(task.id)}
            onToggle={(pid) => toggle(task.id, pid)}
          />
        </div>
      )}

      {milestone && (
        <div
          className="popover small"
          style={place(hover.rect, 300, 200)}
          onMouseEnter={keepOpen}
          onMouseLeave={scheduleHide}
        >
          <div className="ms-tip">
            <div className="ms-tip-head">
              <span className="ms-tip-date">{milestone.short}</span>
              <span className="ms-tip-title">{milestone.title}</span>
            </div>
            <p className="ms-tip-body">{milestone.criteria}</p>
            <div className="ms-tip-foot">验收标准</div>
          </div>
        </div>
      )}
    </div>
  )
}
