import { useCallback, useRef } from 'react'
import type { PeekState } from '../types/employee'
import { MAX_PEEK_POINTS } from '../types/employee'
import { getPeekState, updatePeekState } from '../lib/storage'

export function usePeekMeter(sessionId: string) {
  const stateRef = useRef<PeekState>(getPeekState(sessionId))

  const persist = useCallback(() => {
    updatePeekState(sessionId, stateRef.current)
  }, [sessionId])

  const getState = useCallback(() => stateRef.current, [])

  const addPoints = useCallback(
    (amount: number) => {
      const s = stateRef.current
      stateRef.current = {
        ...s,
        points: Math.min(s.points + amount, MAX_PEEK_POINTS),
      }
      persist()
      return stateRef.current.points
    },
    [persist]
  )

  const spendPoints = useCallback(
    (cost: number): boolean => {
      const s = stateRef.current
      if (s.points < cost) return false
      stateRef.current = {
        ...s,
        points: s.points - cost,
        totalPeeksUsed: s.totalPeeksUsed + 1,
      }
      persist()
      return true
    },
    [persist]
  )

  return {
    getState,
    addPoints,
    spendPoints,
  }
}
