import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../hooks/useGame'
import { EmployeeCard } from './EmployeeCard'
import { NameInput } from './NameInput'
import { ModeSelector } from './ModeSelector'
import { ScoreBar } from './ScoreBar'
import { CommandPalette } from './CommandPalette'

export function GameBoard() {
  const {
    currentEmployee,
    gameState,
    mode,
    revealedLetters,
    stats,
    currentIndex,
    totalEmployees,
    handleKeyPress,
    nextEmployee,
    previousEmployee,
    retryEmployee,
    togglePause,
    updateCurrentEmployee,
    restart,
    changeMode,
  } = useGame()

  const commands = useMemo(
    () => [
      { key: 'pause', label: gameState === 'paused' ? 'Resume game' : 'Pause game', shortcut: 'Cmd+.', onAction: togglePause },
      { key: 'retry', label: 'Retry current person', shortcut: 'Cmd+r', onAction: retryEmployee },
      { key: 'prev', label: 'Go back one person', shortcut: 'Cmd+b', onAction: previousEmployee },
      { key: 'skip', label: 'Skip to next person', shortcut: 'Cmd+Shift+n', onAction: nextEmployee },
      { key: 'restart', label: 'Restart round', shortcut: 'Cmd+Shift+r', onAction: restart },
    ],
    [gameState, togglePause, retryEmployee, previousEmployee, nextEmployee, restart]
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
        <button
          onClick={restart}
          className="px-8 py-3 bg-sofi-purple text-white rounded-xl font-semibold hover:bg-sofi-purple-dark transition-colors shadow-md mt-4"
        >
          Play Again
        </button>
      </motion.div>
    )
  }

  if (!currentEmployee) return null

  return (
    <div className="flex flex-col items-center gap-10 relative">
      <CommandPalette actions={commands} />

      <div className="flex items-center justify-between w-full max-w-2xl">
        <ModeSelector mode={mode} onChange={changeMode} />
        <div className="flex gap-2">
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
        />
        <NameInput
          targetName={currentEmployee.name}
          revealedLetters={revealedLetters}
          onKeyPress={handleKeyPress}
          isRevealed={gameState === 'revealed'}
          isTimeout={gameState === 'timeout'}
          onNext={nextEmployee}
          onRetry={retryEmployee}
        />

        {/* Pause overlay */}
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

      <ScoreBar
        correct={stats.correct}
        total={stats.total}
        streak={stats.streak}
        bestStreak={stats.bestStreak}
        currentIndex={currentIndex}
        totalEmployees={totalEmployees}
      />
    </div>
  )
}
