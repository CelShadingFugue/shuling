import { useState } from 'react'
import { MEMBERS } from '../model/board'
import { COLORS } from '../model/colors'

export default function BatchBar({ count, onPin, onUnpin, onMember, onColor, onDelete, onClear }) {
  const [open, setOpen] = useState(null)

  return (
    <div className="batchbar" onMouseLeave={() => setOpen(null)}>
      <span className="batch-count">已选 {count} 项</span>

      <button className="b" onClick={onPin} title="锁定时间">📌 锁定</button>
      <button className="b" onClick={onUnpin} title="解锁">🔓 解锁</button>

      <div className="batch-pop-wrap">
        <button className={'b' + (open === 'people' ? ' on' : '')} onClick={() => setOpen(open === 'people' ? null : 'people')}>
          参与者 ▾
        </button>
        {open === 'people' && (
          <div className="batch-pop">
            {MEMBERS.map((m) => (
              <button key={m.id} className="pp" style={{ background: m.color, borderColor: m.color }}
                title={m.name} onClick={() => onMember(m.id)}>{m.short}</button>
            ))}
            <span className="batch-tip">点一下 = 全员加/减</span>
          </div>
        )}
      </div>

      <div className="batch-pop-wrap">
        <button className={'b' + (open === 'color' ? ' on' : '')} onClick={() => setOpen(open === 'color' ? null : 'color')}>
          颜色 ▾
        </button>
        {open === 'color' && (
          <div className="batch-pop">
            {COLORS.map((c) => (
              <button key={c.id} className={'sw' + (c.id === 'auto' ? ' auto' : ' c-' + c.id)}
                title={c.name} onClick={() => onColor(c.id)} />
            ))}
          </div>
        )}
      </div>

      <button className="b danger" onClick={onDelete}>删除</button>
      <button className="b ghost" onClick={onClear}>取消选择</button>
    </div>
  )
}
