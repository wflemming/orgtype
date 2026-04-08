import { motion, AnimatePresence } from 'framer-motion'
import type { Employee } from '../types/employee'
import type { RevealAnimation } from '../hooks/usePreview'
import PeekMeter from './PeekMeter'

interface PreviewPanelProps {
  peekPoints: number
  previewCards: Employee[]
  animation: RevealAnimation
  canAffordSmall: boolean
  canAffordBig: boolean
  smallCost: number
  bigCost: number
  onSmallPreview: () => void
  onBigPreview: () => void
  totalEmployees: number
  currentIndex: number
}

function PreviewCard({ employee, index }: { employee: Employee; index: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
        delay: index * 0.1,
      }}
      className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200">
          {employee.imageUrl ? (
            <img src={employee.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-sofi-purple/10 flex items-center justify-center">
              <span className="text-sofi-purple text-xs font-bold">?</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 font-mono tracking-widest">
            {'_ '.repeat(Math.min(employee.displayName.split(' ')[0]?.length ?? 4, 6)).trim()}
          </p>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{employee.role}</p>
        </div>
      </div>
    </motion.div>
  )
}

function ChargeAnimation({ type }: { type: RevealAnimation }) {
  if (type === 'none') return null

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 1 }}
      animate={{ scale: 2.5, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div
        className={`rounded-full ${
          type === 'big'
            ? 'w-32 h-32 bg-sofi-purple/30 shadow-[0_0_60px_30px_rgba(108,64,224,0.3)]'
            : 'w-20 h-20 bg-sofi-purple/20 shadow-[0_0_40px_20px_rgba(108,64,224,0.2)]'
        }`}
      />
    </motion.div>
  )
}

export default function PreviewPanel({
  peekPoints,
  previewCards,
  animation,
  canAffordSmall,
  canAffordBig,
  smallCost,
  bigCost,
  onSmallPreview,
  onBigPreview,
  totalEmployees,
  currentIndex,
}: PreviewPanelProps) {
  const remaining = totalEmployees - currentIndex - 1

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence>
        {animation !== 'none' && <ChargeAnimation type={animation} />}
      </AnimatePresence>

      <PeekMeter
        points={peekPoints}
        revealedCount={currentIndex}
        totalNodes={totalEmployees}
      />

      <div className="flex items-center gap-2 px-3 pb-3">
        <button
          onClick={onSmallPreview}
          disabled={!canAffordSmall || remaining === 0}
          className="flex-1 px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-sofi-purple/30 hover:text-sofi-purple transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={`Preview next card (${smallCost} pt) — Cmd+1`}
        >
          Peek +1 ({smallCost}pt)
        </button>
        <button
          onClick={onBigPreview}
          disabled={!canAffordBig || remaining === 0}
          className="flex-1 px-3 py-2 text-xs font-medium bg-sofi-purple/10 text-sofi-purple border border-sofi-purple/20 rounded-lg hover:bg-sofi-purple/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={`Preview next 3 cards (${bigCost} pts) — Cmd+3`}
        >
          Peek +3 ({bigCost}pt)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {previewCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-3xl mb-3">🔮</p>
            <p className="text-sm text-gray-400 font-medium">No previews yet</p>
            <p className="text-[11px] text-gray-300 mt-1">
              Spend points to peek at upcoming cards
            </p>
            <p className="text-[10px] text-gray-300 mt-3 font-mono">
              Cmd+1 or Cmd+3
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
              Coming up
            </p>
            <AnimatePresence mode="popLayout">
              {previewCards.map((emp, i) => (
                <PreviewCard key={emp.id} employee={emp} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
