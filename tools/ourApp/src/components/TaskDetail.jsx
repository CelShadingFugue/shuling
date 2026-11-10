import { fmtMonth } from '../model/time'
import ParticipantPicker from './ParticipantPicker'

/**
 * 一张卡片的详细信息。时间线悬停和负责域里放大，用的都是这一个。
 * 想加字段（负责人、状态、依赖）就改这里，两处一起变。
 */
export default function TaskDetail({ task, line, participants, onToggle }) {
  return (
    <div className="td">
      <div className="td-head">
        <span
          className="td-id"
          style={{
            color: line.color,
            borderColor: `${line.color}55`,
            background: `${line.color}14`,
          }}
        >
          {task.id}
        </span>
        <span className="td-name">{task.name}</span>
      </div>

      <div className="td-meta">
        {line.name} · {fmtMonth(task.start)} → {fmtMonth(task.end)}
      </div>

      <p className="td-desc">{task.desc}</p>

      <div className="td-row">
        <span className="td-k">交付</span>
        <span className="td-v">{task.acceptance}</span>
      </div>

      <div className="td-row">
        <span className="td-k">参与</span>
        <ParticipantPicker active={participants} onToggle={onToggle} />
      </div>

      <div className="td-foot">
        <a className="td-link" href={`../../../${task.readme}`} target="_blank" rel="noreferrer">
          看细节 →
        </a>
        <span className="td-hint">点亮圆点 = 我也参与</span>
      </div>
    </div>
  )
}
