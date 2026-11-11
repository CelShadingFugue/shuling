import { PEOPLE } from '../data'

export default function ParticipantPicker({ active = [], onToggle }) {
  return (
    <div className="picker" onClick={(e) => e.stopPropagation()}>
      {PEOPLE.map((p) => {
        const on = active.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            className={'pp' + (on ? ' on' : '')}
            style={on ? { background: p.color, borderColor: p.color } : undefined}
            title={on ? `${p.name}：已参与（点一下退出）` : `${p.name}：点一下加入`}
            onClick={() => onToggle(p.id)}
          >
            {p.short}
          </button>
        )
      })}
    </div>
  )
}
