import { LINES, TASKS, MILESTONES, PEOPLE } from '../data'
import { MONTHS, packRows, spanStyle, labelStyle, milestonePct } from '../model/time'

function Chip({ task, line, participants, onOpen, onClose }) {
  return (
    <div
      className="chip"
      style={{ ...spanStyle(task.start, task.end), top: 6 + task.row * 34, borderLeft: `3px solid ${line.color}` }}
      onMouseEnter={(e) => onOpen(task.id, e.currentTarget)}
      onMouseLeave={onClose}
    >
      <span className="chip-id">{task.id}</span>
      <span className="chip-name">{task.name}</span>
      {participants.length > 0 && (
        <span className="chip-dots">
          {participants.map((pid) => {
            const p = PEOPLE.find((x) => x.id === pid)
            return <i key={pid} style={{ background: p.color }} title={p.name} />
          })}
        </span>
      )}
    </div>
  )
}

function Mark({ m, onOpen, onClose, bottom }) {
  return (
    <div
      className="mark-label"
      style={labelStyle(m.at)}
      onMouseEnter={(e) => onOpen(m.id, e.currentTarget)}
      onMouseLeave={onClose}
    >
      {bottom ? m.title : m.short}
    </div>
  )
}

export default function Timeline({ participantsOf, onOpenTask, onCloseTask, onOpenMilestone }) {
  const rows = LINES.map((line) => ({
    line,
    ...packRows(TASKS.filter((t) => t.line === line.id)),
  }))

  return (
    <div className="tl">
      {/* 月份表头 */}
      <div className="tl-head">
        <div className="tl-rail-head" />
        <div className="tl-months">
          {MONTHS.map((m) => (
            <div key={m.key} className={'tl-month' + (m.isYearStart ? ' year-start' : '')}>
              {m.isYearStart && <em>{m.year}</em>}
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 上端：验收时间点 */}
      <div className="tl-marks">
        {MILESTONES.map((m) => (
          <Mark key={m.id} m={m} onOpen={onOpenMilestone} onClose={onCloseTask} />
        ))}
      </div>

      {/* 主体：每条主线一行 */}
      <div className="tl-body">
        {rows.map(({ line, placed, rowCount }) => (
          <div className="tl-row" key={line.id}>
            <div className="tl-rail">
              <i style={{ background: line.color }} />
              <span>{line.name}</span>
            </div>
            <div className="tl-track" style={{ height: 12 + rowCount * 34 }}>
              {placed.map((t) => (
                <Chip
                  key={t.id}
                  task={t}
                  line={line}
                  participants={participantsOf(t.id)}
                  onOpen={onOpenTask}
                  onClose={onCloseTask}
                />
              ))}
            </div>
          </div>
        ))}

        {/* 验收虚线，盖在所有行上面 */}
        <div className="tl-lines">
          {MILESTONES.map((m) => (
            <div key={m.id} className="dash" style={{ left: `${milestonePct(m.at)}%` }}>
              <div
                className="dash-hit"
                onMouseEnter={(e) => onOpenMilestone(m.id, e.currentTarget)}
                onMouseLeave={onCloseTask}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 下端：这次验收叫什么 */}
      <div className="tl-marks bottom">
        {MILESTONES.map((m) => (
          <Mark key={m.id} m={m} onOpen={onOpenMilestone} onClose={onCloseTask} bottom />
        ))}
      </div>
    </div>
  )
}
