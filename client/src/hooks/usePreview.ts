import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { Employee } from '../types/employee'
import { usePeekMeter } from './usePeekMeter'

export type RevealAnimation = 'none' | 'small' | 'big'

const SMALL_COST = 1
const BIG_COST = 3
const SMALL_COUNT = 1
const BIG_COUNT = 3

export function calculateBonus(elapsedSeconds: number, streak: number): number {
  let points = 1
  if (elapsedSeconds < 5) points += 1
  if (streak === 3) points += 2
  else if (streak === 5) points += 3
  else if (streak >= 10 && streak % 5 === 0) points += 5
  return points
}

export function usePreview(
  sessionId: string,
  employees: Employee[],
  currentIndex: number
) {
  const peekMeter = usePeekMeter(sessionId)
  const [previewIds, setPreviewIds] = useState<Set<number>>(new Set())
  const [animation, setAnimation] = useState<RevealAnimation>('none')
  const [, forceRender] = useState(0)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up animation timer on unmount
  useEffect(() => {
    return () => {
      if (animTimer.current) clearTimeout(animTimer.current)
    }
  }, [])

  const triggerAnimation = useCallback((type: RevealAnimation) => {
    if (animTimer.current) clearTimeout(animTimer.current)
    setAnimation(type)
    animTimer.current = setTimeout(() => setAnimation('none'), 600)
  }, [])

  const peek = useCallback(
    (cost: number, count: number, animType: RevealAnimation): boolean => {
      if (peekMeter.getState().points < cost) return false
      const upcoming: Employee[] = []
      for (let i = currentIndex + 1; i < employees.length && upcoming.length < count; i++) {
        upcoming.push(employees[i])
      }
      if (upcoming.length === 0) return false

      peekMeter.spendPoints(cost)
      setPreviewIds((prev) => {
        const next = new Set(prev)
        for (const emp of upcoming) next.add(emp.id)
        return next
      })
      triggerAnimation(animType)
      forceRender((n) => n + 1)
      return true
    },
    [peekMeter, employees, currentIndex, triggerAnimation]
  )

  const smallPreview = useCallback(() => peek(SMALL_COST, SMALL_COUNT, 'small'), [peek])
  const bigPreview = useCallback(() => peek(BIG_COST, BIG_COUNT, 'big'), [peek])

  const previewCards = useMemo(() => {
    const result: Employee[] = []
    for (let i = currentIndex + 1; i < employees.length; i++) {
      if (previewIds.has(employees[i].id)) result.push(employees[i])
    }
    return result
  }, [employees, currentIndex, previewIds])

  const awardPoints = useCallback(
    (elapsedSeconds: number, streak: number) => {
      const bonus = calculateBonus(elapsedSeconds, streak)
      peekMeter.addPoints(bonus)
      forceRender((n) => n + 1)
      return bonus
    },
    [peekMeter]
  )

  const peekPoints = peekMeter.getState().points
  const remaining = employees.length - currentIndex - 1

  return {
    peekPoints,
    previewCards,
    animation,
    smallPreview,
    bigPreview,
    awardPoints,
    canAffordSmall: peekPoints >= SMALL_COST && remaining > 0,
    canAffordBig: peekPoints >= BIG_COST && remaining > 0,
    smallCost: SMALL_COST,
    bigCost: BIG_COST,
  }
}
