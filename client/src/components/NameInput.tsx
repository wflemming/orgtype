import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface Props {
  targetName: string
  revealedLetters: Set<number>
  onKeyPress: (key: string) => void
  isRevealed: boolean
  onNext: () => void
}

export function NameInput({
  targetName,
  revealedLetters,
  onKeyPress,
  isRevealed,
  onNext,
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && isRevealed) {
        onNext()
        return
      }
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        onKeyPress(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKeyPress, isRevealed, onNext])

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
      <div className="flex flex-wrap justify-center gap-3">
        {words.map((word, wi) => (
          <div key={wi} className="flex gap-1.5">
            {word.map(({ char, index }) => {
              const isShown = revealedLetters.has(index)
              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={
                    isShown
                      ? { scale: [1, 1.2, 1], backgroundColor: '#6C40E0' }
                      : {}
                  }
                  transition={{ duration: 0.3 }}
                  className={`w-10 h-12 flex items-center justify-center rounded-lg text-xl font-bold border-2 transition-colors ${
                    isShown
                      ? 'bg-sofi-purple text-white border-sofi-purple'
                      : 'bg-white text-sofi-dark border-gray-200'
                  }`}
                >
                  {isShown ? char : ''}
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {!isRevealed && (
        <p className="text-gray-400 text-sm">
          Type letters to reveal the name...
        </p>
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
