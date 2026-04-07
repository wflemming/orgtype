interface Props {
  correct: number
  total: number
  streak: number
  bestStreak: number
  currentIndex: number
  totalEmployees: number
}

export function ScoreBar({
  correct,
  total,
  streak,
  bestStreak,
  currentIndex,
  totalEmployees,
}: Props) {
  const progress = totalEmployees > 0 ? ((currentIndex + 1) / totalEmployees) * 100 : 0

  return (
    <div className="w-full max-w-2xl">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-6 text-sm">
          <span className="text-sofi-dark">
            <span className="font-semibold text-sofi-purple">{correct}</span>
            <span className="text-gray-400">/{total}</span>
          </span>
          <span className="text-sofi-dark">
            Streak: <span className="font-semibold text-sofi-hint">{streak}</span>
          </span>
          <span className="text-gray-400">
            Best: <span className="font-semibold">{bestStreak}</span>
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {totalEmployees}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-sofi-purple rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
