import { useRef, useState } from 'react'
import { MEMBERS } from '../model/board'
import { COLORS } from '../model/colors'
import PinIcon from './PinIcon'

export default function BatchBar({ count, allPinned, onTogglePin, onMember, onColor, onDelete, onClear }) {
  const [open, setOpen] = useState(null)
  const timer = useRef(null)

  const hold = () => clearTimeout(timer.current)
  const closeLater = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(null), 280)
  }
  const toggle = (name) => {
    hold()
    setOpen(open === name ? null : name)
  }

  return (
    <div className="batchbar">
      <span className="batch-count">已选 {count} 项</span>

      <button className={'b' + (allPinned ? ' on' : '')} onClick={onTogglePin} title={allPinned ? '点一下解锁' : '点一下全部锁定'}>
        <PinIcon on={allPinned} size={13} />
        <span className="b-txt">{allPinned ? '已锁' : '锁定'}</span>
      </button>

      <div className="batch-pop-wrap" onMouseEnter={hold} onMouseLeave={closeLater}>
        <button className={'b' + (open === 'people' ? ' on' : '')} onClick={() => toggle('people')}>
          参与者 ▾
        </button>
        {open === 'people' && (
          <div className="batch-pop" onMouseEnter={hold} onMouseLeave={closeLater}>
            {MEMBERS.map((m) => (
              <button
                key={m.id}
                className="pp"
                style={{ background: m.color, borderColor: m.color }}
                title={m.name}
                onClick={() => onMember(m.id)}
              >
                {m.short}
              </button>
            ))}
            <span className="batch-tip">点一下 = 全员加/减</span>
          </div>
        )}
      </div>

      <div className="batch-pop-wrap" onMouseEnter={hold} onMouseLeave={closeLater}>
        <button className={'b' + (open === 'color' ? ' on' : '')} onClick={() => toggle('color')}>
          颜色 ▾
        </button>
        {open === 'color' && (
          <div className="batch-pop" onMouseEnter={hold} onMouseLeave={closeLater}>
            {COLORS.map((c) => (
              <button
                key={c.id}
                className={'sw' + (c.id === 'auto' ? ' auto' : ' c-' + c.id)}
                title={c.name}
                onClick={() => onColor(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button className="b danger" onClick={onDelete}>删除</button>
      <button className="b ghost" onClick={onClear}>取消选择</button>
    </div>
  )
}
