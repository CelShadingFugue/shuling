import { TASKS } from '../data'

/**
 * 负责域：一个人参与了哪些事。
 * 卡片只显示名字；悬停时在 App 层弹出同样的 TaskDetail（看起来就是卡片放大）。
 */
export default function DutyZone({ person, participantsOf, onOpenTask, onCloseTask, onLeave }) {
  const mine = TASKS.filter((t) => participantsOf(t.id).includes(person.id))

  return (
    <section className="zone">
      <header className="zone-head">
        <span className="zone-avatar" style={{ background: person.color }}>
          {person.short}
        </span>
        <span className="zone-name">{person.name}</span>
        <span className="zone-count">{mine.length} 项</span>
      </header>

      {mine.length === 0 ? (
        <div className="zone-empty">
          还没参与任何工作。在上面时间线的卡片里，点亮自己那个圆点就行。
        </div>
      ) : (
        <div className="zone-grid">
          {mine.map((t) => (
            <div
              key={t.id}
              className="dcard"
              onMouseEnter={(e) => onOpenTask(t.id, e.currentTarget)}
              onMouseLeave={onCloseTask}
            >
              <span className="dcard-id">{t.id}</span>
              <span className="dcard-name">{t.name}</span>
              <button
                type="button"
                className="dcard-x"
                title="退出这件工作"
                onClick={(e) => {
                  e.stopPropagation()
                  onLeave(t.id, person.id)
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
