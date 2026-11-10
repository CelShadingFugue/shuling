import { useCallback, useRef, useState } from 'react'
import { INITIAL } from '../model/board'

const KEY = 'ourApp.board.v2'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const b = JSON.parse(raw)
    return b && b.tasks && b.groups ? b : null
  } catch {
    return null
  }
}

/**
 * 唯一的写入口：commit(fn)。
 * 每次 commit 前把上一版推进撤销栈 —— 快照式撤销，对象小，够用。
 */
export function useBoard() {
  const [board, setBoard] = useState(() => load() || INITIAL)
  const ref = useRef(board)
  const undoStack = useRef([])
  const [undoDepth, setUndoDepth] = useState(0)

  const persist = useCallback((b) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(b))
    } catch {
      /* ignore */
    }
  }, [])

  const commit = useCallback(
    (fn) => {
      const prev = ref.current
      const next = typeof fn === 'function' ? fn(prev) : fn
      if (!next || next === prev) return prev
      undoStack.current.push(prev)
      if (undoStack.current.length > 80) undoStack.current.shift()
      ref.current = next
      setBoard(next)
      setUndoDepth(undoStack.current.length)
      persist(next)
      return next
    },
    [persist]
  )

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return
    ref.current = prev
    setBoard(prev)
    setUndoDepth(undoStack.current.length)
    persist(prev)
  }, [persist])

  const reset = useCallback(() => {
    undoStack.current.push(ref.current)
    ref.current = INITIAL
    setBoard(INITIAL)
    setUndoDepth(undoStack.current.length)
    persist(INITIAL)
  }, [persist])

  return { board, commit, undo, reset, canUndo: undoDepth > 0 }
}
