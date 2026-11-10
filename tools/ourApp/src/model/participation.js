import { useCallback, useEffect, useState } from 'react'
import { SEED_PARTICIPATION } from '../data'

const KEY = 'ourApp.participation.v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * “谁参与了什么”。
 * 现在的形状是 { 任务 id: [人 id, ...] }，
 * 下一轮会换成 Task / Person / Participation 三个对象 + 一个仓储。
 */
export function useParticipation() {
  const [map, setMap] = useState(() => load() || SEED_PARTICIPATION)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(map))
    } catch {
      /* 隐私模式下写不进去，忽略 */
    }
  }, [map])

  const toggle = useCallback((taskId, personId) => {
    setMap((prev) => {
      const cur = prev[taskId] || []
      const next = cur.includes(personId)
        ? cur.filter((x) => x !== personId)
        : [...cur, personId]
      const out = { ...prev, [taskId]: next }
      if (next.length === 0) delete out[taskId]
      return out
    })
  }, [])

  const reset = useCallback(() => setMap(SEED_PARTICIPATION), [])

  const participantsOf = useCallback((taskId) => map[taskId] || [], [map])

  return { map, toggle, reset, participantsOf }
}
