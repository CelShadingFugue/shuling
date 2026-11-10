import { useState } from 'react'
import { COLOR_HEX } from '../model/colors'

export default function MarkEditor({ mark, onChange, onDelete, onClose }) {
  const [name, setName] = useState(mark.name || '')
  const [note, setNote] = useState(mark.note || '')

  const commitName = () => {
    if (name !== (mark.name || '')) onChange({ name })
  }
  const commitNote = () => {
    if (note !== (mark.note || '')) onChange({ note })
  }

  return (
    <div className="mk-editor">
      <div className="t">时间点 · {mark.at.replace('T', ' ').slice(0, 16)}</div>

      <input
        value={name}
        autoFocus
        placeholder="起个名字（默认显示“未命名”）"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />

      <textarea
        value={note}
        placeholder="这条线要交什么 / 验收标准"
        onChange={(e) => setNote(e.target.value)}
        onBlur={commitNote}
      />

      <div className="row">
        <span>颜色</span>
        <div className="swatches">
          <button
            type="button"
            className={'sw' + (mark.color === '#23262B' ? ' on' : '')}
            style={{ background: '#23262B', borderColor: '#23262B' }}
            title="黑（默认）"
            onClick={() => onChange({ color: '#23262B' })}
          />
          {Object.entries(COLOR_HEX).map(([id, hex]) => (
            <button
              key={id}
              type="button"
              className={'sw' + (mark.color === hex ? ' on' : '')}
              style={{ background: hex, borderColor: hex }}
              title={id}
              onClick={() => onChange({ color: hex })}
            />
          ))}
        </div>
      </div>

      <div className="acts">
        <button type="button" className="b danger" onClick={onDelete}>删除这条线</button>
        <button type="button" className="b" onClick={onClose}>完成</button>
      </div>
    </div>
  )
}
