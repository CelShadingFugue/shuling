import { MEMBERS } from '../model/board'
import { noteOf } from '../model/notes'
import { COLORS } from '../model/colors'
import { parse, fmtDateTime } from '../model/time'

export default function TaskDetail({ task, group, duty = [], onToggle, onColor }) {
  const note = noteOf(task.id)
  return (
    <div className="td">
      <div className="td-head">
        <span className="td-id" style={{ color: group.color, borderColor: `${group.color}55`, background: `${group.color}14` }}>
          {task.id}
        </span>
        <span className="td-name">{task.name}</span>
        {task.pinned && <span className="td-pin">已锁定</span>}
      </div>

      <div className="td-meta">
        {group.name} · {fmtDateTime(parse(task.start))} → {fmtDateTime(parse(task.end))}
      </div>

      {note.desc && <p className="td-desc">{note.desc}</p>}

      {note.acc && (
        <div className="td-row">
          <span className="td-k">交付</span>
          <span className="td-v">{note.acc}</span>
        </div>
      )}

      <div className="td-row">
        <span className="td-k">参与</span>
        <div className="picker">
          {MEMBERS.map((m) => {
            const on = duty.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                className={'pp' + (on ? ' on' : '')}
                style={on ? { background: m.color, borderColor: m.color } : undefined}
                title={m.name}
                onClick={() => onToggle(m.id)}
              >
                {m.short}
              </button>
            )
          })}
        </div>
      </div>

      <div className="td-row">
        <span className="td-k">颜色</span>
        <div className="swatches">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.name}
              className={'sw' + (c.id === 'auto' ? ' auto' : ' c-' + c.id) + (task.color === c.id ? ' on' : '')}
              onClick={() => onColor(c.id)}
            />
          ))}
        </div>
      </div>

      <div className="td-foot">
        <span className="td-hint">点圆点 = 我参与 · Ctrl+滚轮缩放</span>
      </div>
    </div>
  )
}
