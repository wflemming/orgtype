import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  targetName: string
  revealedLetters: Set<number>
  prefilledLetters: Set<number>
  onKeyPress: (key: string) => void
  isRevealed: boolean
  isTimeout: boolean
  onNext: () => void
  onRetry: () => void
}

export function NameInput({
  targetName,
  revealedLetters,
  prefilledLetters,
  onKeyPress,
  isRevealed,
  isTimeout,
  onNext,
  onRetry,
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && (isRevealed || isTimeout)) {
        isTimeout ? onRetry() : onNext()
        return
      }
      if (e.key === 'Tab' && isTimeout) {
        e.preventDefault()
        onNext()
        return
      }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key) && !isRevealed && !isTimeout) {
        onKeyPress(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKeyPress, isRevealed, isTimeout, onNext, onRetry])

  const chars = targetName.split('')

  // Group characters into words for wrapping
  const words: { char: string; index: number }[][] = []
  let currentWord: { char: string; index: number }[] = []

  chars.forEach((char, i) => {
    if (char === ' ') {
      if (currentWord.length > 0) {
        words.push(currentWord)
        currentWord = []
      }
    } else {
      currentWord.push({ char, index: i })
    }
  })
  if (currentWord.length > 0) words.push(currentWord)

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-wrap justify-center gap-8">
        {words.map((word, wi) => (
          <div key={wi} className="flex gap-1.5">
            {word.map(({ char, index }) => {
              const isShown = revealedLetters.has(index)
              const isPrefilled = prefilledLetters.has(index)
              const isHinted = isShown && isTimeout && !isPrefilled

              let boxClass: string
              let animBg: string | undefined

              if (isHinted) {
                boxClass = 'bg-sofi-hint text-white border-sofi-hint'
                animBg = '#F59E0B'
              } else if (isPrefilled) {
                boxClass = 'bg-gray-100 text-gray-400 border-gray-200'
                animBg = undefined
              } else if (isShown) {
                boxClass = 'bg-sofi-purple text-white border-sofi-purple'
                animBg = '#6C40E0'
              } else {
                boxClass = 'bg-white text-sofi-dark border-gray-200'
                animBg = undefined
              }

              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={
                    isShown && !isPrefilled
                      ? { scale: [1, 1.2, 1], ...(animBg ? { backgroundColor: animBg } : {}) }
                      : {}
                  }
                  transition={{ duration: 0.3 }}
                  className={`w-10 h-12 flex items-center justify-center rounded-lg text-xl font-bold border-2 transition-colors ${boxClass}`}
                >
                  {isShown ? char : ''}
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {!isRevealed && !isTimeout && (
        <p className="text-gray-400 text-sm">
          Type letters to reveal the name...
        </p>
      )}

      {isTimeout && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sofi-hint font-semibold text-sm">Time's up! The hints gave it away.</p>
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="px-5 py-2.5 bg-sofi-hint text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-md"
            >
              Retry ↩
            </button>
            <button
              onClick={onNext}
              className="px-5 py-2.5 bg-gray-200 text-sofi-dark rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Skip →
            </button>
          </div>
          <p className="text-gray-300 text-xs">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono">Enter</kbd> retry
            {' '}<kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono">Tab</kbd> skip
          </p>
        </motion.div>
      )}

      {isRevealed && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="px-6 py-3 bg-sofi-purple text-white rounded-xl font-semibold hover:bg-sofi-purple-dark transition-colors shadow-md"
        >
          Next →
        </motion.button>
      )}
    </div>
  )
}
