import { useState, useCallback, useEffect, useRef } from 'react'
import type { Employee, GameMode, GameState } from '../types/employee'
import { fetchEmployees } from '../api/employees'

interface GameStats {
  correct: number
  total: number
  streak: number
  bestStreak: number
  totalTime: number
}

export function useGame() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameState, setGameState] = useState<GameState>('loading')
  const [mode, setMode] = useState<GameMode>('random')
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set())
  const [typedLetters, setTypedLetters] = useState<string[]>([])
  const [stats, setStats] = useState<GameStats>({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    totalTime: 0,
  })
  const startTimeRef = useRef<number>(Date.now())
  const hintTimerRef = useRef<ReturnType<typeof setInterval>>()

  const currentEmployee = employees[currentIndex] ?? null
  const targetName = currentEmployee?.name ?? ''

  const loadEmployees = useCallback(async (gameMode: GameMode) => {
    setGameState('loading')
    try {
      const data = await fetchEmployees(gameMode)
      setEmployees(data)
      setCurrentIndex(0)
      setRevealedLetters(new Set())
      setTypedLetters([])
      setGameState('playing')
      startTimeRef.current = Date.now()
    } catch {
      setGameState('loading')
    }
  }, [])

  useEffect(() => {
    loadEmployees(mode)
  }, [mode, loadEmployees])

  // Auto-hint timer: reveal a random unrevealed letter every 10 seconds
  useEffect(() => {
    if (gameState !== 'playing' || !targetName) return

    hintTimerRef.current = setInterval(() => {
      setRevealedLetters((prev) => {
        const nameChars = targetName.split('')
        const unrevealedIndices = nameChars
          .map((ch, i) => ({ ch, i }))
          .filter(({ ch, i }) => ch !== ' ' && !prev.has(i))
          .map(({ i }) => i)

        if (unrevealedIndices.length === 0) return prev

        const randomIdx =
          unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)]
        const next = new Set([...prev, randomIdx])

        // If auto-hint just revealed the last letter, trigger timeout
        const allRevealed = nameChars.every(
          (ch, i) => ch === ' ' || next.has(i)
        )
        if (allRevealed) {
          clearInterval(hintTimerRef.current)
          setTimeout(() => setGameState('timeout'), 300)
        }

        return next
      })
    }, 10000)

    return () => clearInterval(hintTimerRef.current)
  }, [gameState, targetName])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== 'playing' || !targetName) return

      const lowerKey = key.toLowerCase()
      const nameChars = targetName.split('')

      // Check if the typed letter matches any unrevealed position
      const newRevealed = new Set(revealedLetters)
      let matched = false

      nameChars.forEach((ch, i) => {
        if (ch.toLowerCase() === lowerKey && !newRevealed.has(i) && ch !== ' ') {
          newRevealed.add(i)
          matched = true
        }
      })

      if (matched) {
        setRevealedLetters(newRevealed)
        setTypedLetters((prev) => [...prev, lowerKey])

        // Check if all non-space characters are revealed
        const allRevealed = nameChars.every(
          (ch, i) => ch === ' ' || newRevealed.has(i)
        )

        if (allRevealed) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          clearInterval(hintTimerRef.current)
          setGameState('revealed')
          setStats((prev) => ({
            correct: prev.correct + 1,
            total: prev.total + 1,
            streak: prev.streak + 1,
            bestStreak: Math.max(prev.bestStreak, prev.streak + 1),
            totalTime: prev.totalTime + elapsed,
          }))
        }
      }
    },
    [gameState, targetName, revealedLetters]
  )

  const nextEmployee = useCallback(() => {
    if (currentIndex + 1 >= employees.length) {
      setGameState('complete')
      return
    }
    setCurrentIndex((prev) => prev + 1)
    setRevealedLetters(new Set())
    setTypedLetters([])
    setGameState('playing')
    startTimeRef.current = Date.now()
  }, [currentIndex, employees.length])

  const retryEmployee = useCallback(() => {
    setRevealedLetters(new Set())
    setTypedLetters([])
    setGameState('playing')
    startTimeRef.current = Date.now()
  }, [])

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      clearInterval(hintTimerRef.current)
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }, [gameState])

  const previousEmployee = useCallback(() => {
    if (currentIndex <= 0) return
    clearInterval(hintTimerRef.current)
    setCurrentIndex((prev) => prev - 1)
    setRevealedLetters(new Set())
    setTypedLetters([])
    setGameState('playing')
    startTimeRef.current = Date.now()
  }, [currentIndex])

  const restart = useCallback(() => {
    setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, totalTime: 0 })
    loadEmployees(mode)
  }, [mode, loadEmployees])

  const updateCurrentEmployee = useCallback(
    (updated: Employee) => {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === updated.id ? updated : emp))
      )
    },
    []
  )

  const changeMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode)
      setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0, totalTime: 0 })
    },
    []
  )

  return {
    currentEmployee,
    gameState,
    mode,
    revealedLetters,
    typedLetters,
    stats,
    currentIndex,
    totalEmployees: employees.length,
    handleKeyPress,
    nextEmployee,
    previousEmployee,
    retryEmployee,
    togglePause,
    updateCurrentEmployee,
    restart,
    changeMode,
  }
}
