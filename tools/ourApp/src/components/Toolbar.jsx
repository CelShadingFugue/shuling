import { useRef, useState } from 'react'
import { THEMES } from '../model/colors'

export default function Toolbar({ canUndo, onUndo, onReset, settings, setSettings, theme, setTheme, onExport, onImport }) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef(null)

  return (
    <header className="top">
      <div className="brand">
        <b>ourApp</b>
        <span>书灵 · 项目工作台</span>
      </div>
      <div className="top-hint">
        卡片悬停看细节 · 点圆点 = 参与 · Ctrl+滚轮缩放 · Shift+滚轮横移 · Ctrl 拖框多选
      </div>

      <div className="top-tools">
        <button className="btn" onClick={onUndo} disabled={!canUndo}>撤销</button>
        <button className="btn" onClick={onReset}>重置</button>
        <button className={'btn' + (open ? ' on' : '')} onClick={() => setOpen(!open)}>设置</button>
      </div>

      {open && (
        <div className="settings" onMouseLeave={() => setOpen(false)}>
          <div className="set-row">
            <label>显示当前时刻</label>
            <input type="checkbox" checked={settings.nowLine} onChange={(e) => setSettings({ ...settings, nowLine: e.target.checked })} />
          </div>
          <div className="set-row">
            <label>拖动时聚焦变暗</label>
            <input type="checkbox" checked={settings.dim} onChange={(e) => setSettings({ ...settings, dim: e.target.checked })} />
          </div>
          <div className="set-row">
            <label>主题</label>
            <div className="segs">
              {THEMES.map((t) => (
                <button key={t.id} className={theme === t.id ? 'on' : ''} onClick={() => setTheme(t.id)}>{t.name}</button>
              ))}
            </div>
          </div>
          <div className="set-row">
            <label>数据</label>
            <div className="segs">
              <button onClick={onExport}>导出</button>
              <button onClick={() => fileRef.current && fileRef.current.click()}>导入</button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files && e.target.files[0]
              if (f) onImport(f)
              e.target.value = ''
            }}
          />
          <div className="set-note">外观设置只存在本机；数据可导出给 CLI 改，再导回来。</div>
        </div>
      )}
    </header>
  )
}
