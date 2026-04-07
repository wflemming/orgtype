import { motion } from 'framer-motion'
import { useGame } from '../hooks/useGame'
import { EmployeeCard } from './EmployeeCard'
import { NameInput } from './NameInput'
import { ModeSelector } from './ModeSelector'
import { ScoreBar } from './ScoreBar'

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
    restart,
    changeMode,
  } = useGame()

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
    <div className="flex flex-col items-center gap-10">
      <ModeSelector mode={mode} onChange={changeMode} />

      <div className="flex flex-col md:flex-row items-center gap-12">
        <EmployeeCard
          employee={currentEmployee}
          isRevealed={gameState === 'revealed'}
        />
        <NameInput
          targetName={currentEmployee.name}
          revealedLetters={revealedLetters}
          onKeyPress={handleKeyPress}
          isRevealed={gameState === 'revealed'}
          onNext={nextEmployee}
        />
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
