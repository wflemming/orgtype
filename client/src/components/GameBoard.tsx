import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../hooks/useGame'
import { usePreview } from '../hooks/usePreview'
import { EmployeeCard } from './EmployeeCard'
import { NameInput } from './NameInput'
import { ScoreBar } from './ScoreBar'
import { CommandPalette } from './CommandPalette'
import { TriedLettersKeyboard } from './TriedLettersKeyboard'
import { FlagModal } from './FlagModal'
import PreviewPanel from './PreviewPanel'
import type { GameSession } from '../types/employee'
import { DIFFICULTY_CONFIG } from '../types/employee'

interface Props {
  session: GameSession
  onExit: () => void
  onSessionUpdate?: (session: GameSession) => void
}

export function GameBoard({ session, onExit, onSessionUpdate }: Props) {
  const game = useGame({ difficulty: session.difficulty, session, onSessionUpdate })
  const {
    currentEmployee,
    gameState,
    mode,
    revealedLetters,
    prefilledLetters,
    attemptedLetters,
    hintSecondsLeft,
    stats,
    currentIndex,
    totalEmployees,
    sessionId,
    handleKeyPress,
    nextEmployee,
    previousEmployee,
    retryEmployee,
    togglePause,
    updateCurrentEmployee,
    restart,
    employees,
  } = game

  const preview = usePreview(sessionId, employees, currentIndex)

  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(true)

  // Award peek points when a name is correctly revealed
  const prevGameStateRef = useRef(gameState)
  const awardPointsRef = useRef(preview.awardPoints)
  awardPointsRef.current = preview.awardPoints
  const statsRef = useRef(stats)
  statsRef.current = stats

  useEffect(() => {
    if (gameState === 'revealed' && prevGameStateRef.current !== 'revealed') {
      const s = statsRef.current
      const elapsed = s.total > 0 ? s.totalTime / s.total : 10
      awardPointsRef.current(elapsed, s.streak)
    }
    prevGameStateRef.current = gameState
  }, [gameState])

  // Keyboard shortcuts for preview: Cmd+1, Cmd+3
  const smallPreviewRef = useRef(preview.smallPreview)
  smallPreviewRef.current = preview.smallPreview
  const bigPreviewRef = useRef(preview.bigPreview)
  bigPreviewRef.current = preview.bigPreview

  useEffect(() => {
    function handlePreviewShortcut(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return
      if (e.key === '1') { e.preventDefault(); smallPreviewRef.current() }
      else if (e.key === '3') { e.preventDefault(); bigPreviewRef.current() }
    }
    window.addEventListener('keydown', handlePreviewShortcut)
    return () => window.removeEventListener('keydown', handlePreviewShortcut)
  }, [])

  const commands = useMemo(
    () => [
      { key: 'pause', label: gameState === 'paused' ? 'Resume game' : 'Pause game', shortcut: 'Cmd+.', onAction: togglePause },
      { key: 'peek1', label: `Peek +1 (${preview.smallCost}pt)`, shortcut: 'Cmd+1', onAction: preview.smallPreview },
      { key: 'peek3', label: `Peek +3 (${preview.bigCost}pt)`, shortcut: 'Cmd+3', onAction: preview.bigPreview },
      { key: 'retry', label: 'Retry current person', shortcut: 'Cmd+r', onAction: retryEmployee },
      { key: 'prev', label: 'Go back one person', shortcut: 'Cmd+b', onAction: previousEmployee },
      { key: 'skip', label: 'Skip to next person', shortcut: 'Cmd+Shift+n', onAction: nextEmployee },
      { key: 'restart', label: 'Restart round', shortcut: 'Cmd+Shift+r', onAction: restart },
    ],
    [gameState, togglePause, retryEmployee, previousEmployee, nextEmployee, restart, preview.smallPreview, preview.bigPreview, preview.smallCost, preview.bigCost]
  )

  if (gameState === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-3 border-sofi-purple border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (gameState === 'complete') {
    const avgTime =
      stats.total > 0 ? (stats.totalTime / stats.total).toFixed(1) : '0'
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 py-16"
      >
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-bold text-sofi-dark">Round Complete!</h2>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-sofi-purple">{stats.correct}</p>
            <p className="text-sm text-gray-400">Correct</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-sofi-hint">{stats.bestStreak}</p>
            <p className="text-sm text-gray-400">Best Streak</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-sofi-dark">{avgTime}s</p>
            <p className="text-sm text-gray-400">Avg Time</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={restart}
            className="px-8 py-3 bg-sofi-purple text-white rounded-xl font-semibold hover:bg-sofi-purple-dark transition-colors shadow-md"
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            className="px-8 py-3 bg-white text-sofi-dark border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </motion.div>
    )
  }

  if (!currentEmployee) return null

  const diffLabel = DIFFICULTY_CONFIG[session.difficulty].label

  return (
    <div className="flex gap-6 relative">
      <CommandPalette actions={commands} />

      {/* Main game area */}
      <div className={`flex flex-col items-center gap-10 transition-all duration-300 ${previewOpen ? 'flex-1' : 'w-full'}`}>
        <div className="flex items-center justify-between w-full max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-sofi-purple/10 text-sofi-purple text-xs font-semibold rounded-full">
              {diffLabel}
            </span>
            <span className="text-xs text-gray-400">
              {mode === 'random' ? '🎲 Random' : mode === 'top-down' ? '⬇ Top → Down' : '⬆ Bottom → Up'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewOpen((v) => !v)}
              className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                previewOpen
                  ? 'bg-sofi-purple/10 text-sofi-purple border-sofi-purple/30'
                  : 'bg-white text-gray-400 border-gray-200 hover:text-sofi-purple hover:border-sofi-purple/30'
              }`}
            >
              🔮 Preview {preview.peekPoints > 0 && <span className="ml-1 text-[10px] opacity-70">({preview.peekPoints})</span>}
            </button>
            <button
              onClick={onExit}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-400 hover:text-sofi-purple hover:border-sofi-purple/30 transition-colors"
            >
              Exit
            </button>
            <button
              onClick={togglePause}
              className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${
                gameState === 'paused'
                  ? 'bg-sofi-purple text-white border-sofi-purple'
                  : 'bg-white text-gray-400 border-gray-200 hover:text-sofi-purple hover:border-sofi-purple/30'
              }`}
            >
              {gameState === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', metaKey: true })
                )
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-400 hover:text-sofi-purple hover:border-sofi-purple/30 transition-colors"
            >
              <kbd className="font-mono">Cmd+K</kbd>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 relative">
          <EmployeeCard
            employee={currentEmployee}
            isRevealed={gameState === 'revealed' || gameState === 'timeout'}
            onEmployeeUpdated={updateCurrentEmployee}
            onFlag={() => setFlagModalOpen(true)}
          />
          <NameInput
            targetName={currentEmployee.displayName}
            revealedLetters={revealedLetters}
            prefilledLetters={prefilledLetters}
            onKeyPress={handleKeyPress}
            isRevealed={gameState === 'revealed'}
            isTimeout={gameState === 'timeout'}
            onNext={nextEmployee}
            onRetry={retryEmployee}
          />

          <AnimatePresence>
            {gameState === 'paused' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10 cursor-pointer"
                onClick={togglePause}
              >
                <div className="text-5xl mb-4">||</div>
                <p className="text-sofi-dark font-bold text-lg">Paused</p>
                <p className="text-gray-400 text-sm mt-2">
                  Click or <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Cmd+.</kbd> to resume
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Next hint in</span>
            <span
              className={`font-mono font-bold ${
                hintSecondsLeft <= 3 ? 'text-sofi-hint' : 'text-sofi-purple'
              }`}
            >
              {hintSecondsLeft}s
            </span>
          </div>
        )}

        {gameState === 'playing' && (
          <TriedLettersKeyboard
            attemptedLetters={attemptedLetters}
            targetName={currentEmployee.displayName}
          />
        )}

        <ScoreBar
          correct={stats.correct}
          total={stats.total}
          streak={stats.streak}
          bestStreak={stats.bestStreak}
          currentIndex={currentIndex}
          totalEmployees={totalEmployees}
        />

        <FlagModal
          employee={currentEmployee}
          isOpen={flagModalOpen}
          onClose={() => setFlagModalOpen(false)}
        />
      </div>

      {/* Shared preview panel props */}
      {(() => {
        const panelProps = {
          peekPoints: preview.peekPoints,
          previewCards: preview.previewCards,
          animation: preview.animation,
          canAffordSmall: preview.canAffordSmall,
          canAffordBig: preview.canAffordBig,
          smallCost: preview.smallCost,
          bigCost: preview.bigCost,
          onSmallPreview: preview.smallPreview,
          onBigPreview: preview.bigPreview,
          totalEmployees,
          currentIndex,
        }
        return (
          <>
            {/* Desktop: right column */}
            {previewOpen && (
              <div className="hidden lg:flex flex-col w-[280px] shrink-0 border-l border-gray-200 bg-gray-50/50 rounded-r-2xl">
                <PreviewPanel {...panelProps} />
              </div>
            )}

            {/* Mobile: floating button + slide-up drawer */}
            <div className="lg:hidden">
              {!previewOpen && (
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-sofi-purple text-white rounded-full shadow-lg flex items-center justify-center hover:bg-sofi-purple-dark transition-colors"
                  title="Open preview"
                >
                  <span className="text-lg">🔮</span>
                </button>
              )}
              <AnimatePresence>
                {previewOpen && (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-x-0 bottom-0 z-50 h-[50vh] bg-white border-t border-gray-200 rounded-t-2xl shadow-2xl"
                  >
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-600">Preview</span>
                      <button
                        onClick={() => setPreviewOpen(false)}
                        className="px-3 py-1 text-xs text-gray-400 hover:text-gray-600"
                      >
                        Close
                      </button>
                    </div>
                    <div className="h-[calc(50vh-44px)]">
                      <PreviewPanel {...panelProps} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )
      })()}
    </div>
  )
}
