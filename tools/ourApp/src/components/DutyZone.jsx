import { MEMBERS } from '../model/board'
import { parse } from '../model/time'

export default function DutyZone({ member, board, onOpenTask, onCloseTask }) {
  const mine = board.tasks.filter((t) => (board.duty[t.id] || []).includes(member.id))

  return (
    <section className="zone">
      <header className="zone-head">
        <span className="zone-avatar" style={{ background: member.color }}>{member.short}</span>
        <span className="zone-name">{member.name}</span>
        <span className="zone-count">{mine.length} 项</span>
      </header>

      {mine.length === 0 ? (
        <div className="zone-empty">还没参与任何工作。在时间线的卡片里点亮自己那个圆点。</div>
      ) : (
        <div className="zone-grid">
          {mine.map((t) => {
            const g = board.groups.find((x) => x.id === t.groupId)
            return (
              <div
                key={t.id}
                className={'dcard' + (t.color !== 'auto' ? ' c-' + t.color : '')}
                onMouseEnter={(e) => onOpenTask(t.id, e.currentTarget)}
                onMouseLeave={onCloseTask}
              >
                <i className="dcard-bar" style={{ background: g ? g.color : '#999' }} />
                <span className="dcard-id">{t.id}</span>
                <span className="dcard-name">{t.name}</span>
                <span className="dcard-date">{parse(t.start) ? `${new Date(parse(t.start)).getMonth() + 1}月` : ''}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
