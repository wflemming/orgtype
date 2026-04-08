import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MAX_PEEK_POINTS } from '../types/employee'

interface PeekMeterProps {
  points: number
  revealedCount: number
  totalNodes: number
}

export default function PeekMeter({ points, revealedCount, totalNodes }: PeekMeterProps) {
  const [flash, setFlash] = useState<number | null>(null)
  const prevPointsRef = useRef(points)

  useEffect(() => {
    if (points > prevPointsRef.current) {
      setFlash(points - prevPointsRef.current)
      const timer = setTimeout(() => setFlash(null), 1200)
      prevPointsRef.current = points
      return () => clearTimeout(timer)
    }
    prevPointsRef.current = points
  }, [points])

  const pct = totalNodes > 0 ? Math.round((revealedCount / totalNodes) * 100) : 0

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm" title="Peek points">👁</span>
        <div className="relative flex items-center">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sofi-purple rounded-full"
              initial={false}
              animate={{ width: `${(points / MAX_PEEK_POINTS) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>
          <span className="ml-2 text-xs font-semibold text-gray-600 tabular-nums">{points}</span>
          <AnimatePresence>
            {flash != null && (
              <motion.span
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute -top-1 right-0 text-xs font-bold text-sofi-success pointer-events-none"
              >
                +{flash}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-px h-4 bg-gray-200" />

      <div className="text-[11px] text-gray-500 whitespace-nowrap">
        <span className="font-semibold text-sofi-purple">{revealedCount}</span>
        <span className="text-gray-400">/{totalNodes}</span>
        <span className="ml-1 text-gray-400">({pct}%)</span>
      </div>
    </div>
  )
}
