import { useState, useCallback, useEffect, useRef } from 'react'
import type { Employee, GameMode, GameState, Difficulty, GameSession } from '../types/employee'
import { DIFFICULTY_CONFIG } from '../types/employee'
import { fetchEmployees } from '../api/employees'
import { updateSession } from '../lib/storage'

const HINT_INTERVAL_MS = 10_000
const COUNTDOWN_INTERVAL_MS = 1_000
const INITIAL_HINT_SECONDS = HINT_INTERVAL_MS / 1_000

function clearTimer(ref: React.RefObject<ReturnType<typeof setInterval> | null>) {
  if (ref.current != null) {
    clearInterval(ref.current)
    ref.current = null
  }
}

interface GameStats {
  correct: number
  total: number
  streak: number
  bestStreak: number
  totalTime: number
}

interface UseGameOptions {
  difficulty: Difficulty
  session: GameSession
  onSessionUpdate?: (session: GameSession) => void
}

function prefillLetters(name: string, pct: number): Set<number> {
  const indices = name
    .split('')
    .map((ch, i) => ({ ch, i }))
    .filter(({ ch }) => ch !== ' ')
    .map(({ i }) => i)

  const count = Math.floor(indices.length * pct)
  // Shuffle and take first `count`
  const shuffled = [...indices].sort(() => Math.random() - 0.5)
  return new Set(shuffled.slice(0, count))
}

export function useGame({ difficulty, session, onSessionUpdate }: UseGameOptions) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentIndex, setCurrentIndex] = useState(session.currentIndex)
  const [gameState, setGameState] = useState<GameState>('loading')
  const [mode] = useState<GameMode>(session.mode)
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set())
  const [prefilledLetters, setPrefilledLetters] = useState<Set<number>>(new Set())
  const [typedLetters, setTypedLetters] = useState<string[]>([])
  const [stats, setStats] = useState<GameStats>(session.stats)
  const [attemptedLetters, setAttemptedLetters] = useState<Set<string>>(new Set())
  const [hintSecondsLeft, setHintSecondsLeft] = useState(10)
  const [hintResetKey, setHintResetKey] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const hintTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionRef = useRef<GameSession>(session)
  const sessionStartRef = useRef<number>(Date.now())

  const currentEmployee = employees[currentIndex] ?? null
  const targetName = currentEmployee?.displayName ?? ''

  const prefillPct = DIFFICULTY_CONFIG[difficulty].prefillPct

  // Persist session to localStorage
  const persistSession = useCallback(
    (updates: Partial<GameSession>) => {
      sessionRef.current = { ...sessionRef.current, ...updates, lastPlayedAt: new Date().toISOString() }
      updateSession(sessionRef.current)
      onSessionUpdate?.(sessionRef.current)
    },
    [onSessionUpdate]
  )

  const initRound = useCallback(
    (name: string) => {
      const prefilled = prefillLetters(name, prefillPct)
      setPrefilledLetters(prefilled)
      setRevealedLetters(new Set(prefilled))
      setTypedLetters([])
      setAttemptedLetters(new Set())
      startTimeRef.current = Date.now()
    },
    [prefillPct]
  )

  const loadEmployees = useCallback(
    async (gameMode: GameMode) => {
      setGameState('loading')
      try {
        const data = await fetchEmployees(gameMode)
        setEmployees(data)
        setGameState('playing')
        const idx = session.currentIndex
        setCurrentIndex(idx)
        if (data[idx]) {
          initRound(data[idx].displayName)
        }
      } catch {
        setGameState('loading')
      }
    },
    [initRound, session.currentIndex]
  )

  useEffect(() => {
    loadEmployees(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-hint timer: reveal a random unrevealed letter every 10 seconds
  useEffect(() => {
    if (gameState !== 'playing' || !targetName) return

    setHintSecondsLeft(INITIAL_HINT_SECONDS)

    hintTimerRef.current = setInterval(() => {
      setHintSecondsLeft(INITIAL_HINT_SECONDS)
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

        const allRevealed = nameChars.every(
          (ch, i) => ch === ' ' || next.has(i)
        )
        if (allRevealed) {
          clearTimer(hintTimerRef)
          clearTimer(countdownRef)
          setTimeout(() => setGameState('timeout'), 300)
        }

        return next
      })
    }, HINT_INTERVAL_MS)

    countdownRef.current = setInterval(() => {
      setHintSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, COUNTDOWN_INTERVAL_MS)

    return () => {
      clearTimer(hintTimerRef)
      clearTimer(countdownRef)
    }
  }, [gameState, targetName, hintResetKey])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== 'playing' || !targetName) return

      const lowerKey = key.toLowerCase()
      const nameChars = targetName.split('')

      setAttemptedLetters((prev) => new Set([...prev, lowerKey]))

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

        const allRevealed = nameChars.every(
          (ch, i) => ch === ' ' || newRevealed.has(i)
        )

        if (allRevealed) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          clearTimer(hintTimerRef)
          clearTimer(countdownRef)
          setGameState('revealed')
          const newStats = {
            correct: stats.correct + 1,
            total: stats.total + 1,
            streak: stats.streak + 1,
            bestStreak: Math.max(stats.bestStreak, stats.streak + 1),
            totalTime: stats.totalTime + elapsed,
          }
          setStats(newStats)

          const empId = employees[currentIndex]?.id
          const completedIds = empId
            ? [...new Set([...sessionRef.current.completedEmployeeIds, empId])]
            : sessionRef.current.completedEmployeeIds
          persistSession({ stats: newStats, completedEmployeeIds: completedIds })
        } else {
          setHintResetKey((prev) => prev + 1)
        }
      }
    },
    [gameState, targetName, revealedLetters, stats, currentIndex, employees, persistSession]
  )

  const nextEmployee = useCallback(() => {
    if (currentIndex + 1 >= employees.length) {
      setGameState('complete')
      const elapsed = Date.now() - sessionStartRef.current
      persistSession({
        completed: true,
        totalElapsedMs: sessionRef.current.totalElapsedMs + elapsed,
      })
      return
    }
    const nextIdx = currentIndex + 1
    setCurrentIndex(nextIdx)
    setGameState('playing')
    persistSession({ currentIndex: nextIdx })
    if (employees[nextIdx]) {
      initRound(employees[nextIdx].displayName)
    }
  }, [currentIndex, employees, persistSession, initRound])

  const retryEmployee = useCallback(() => {
    if (currentEmployee) {
      initRound(currentEmployee.displayName)
    }
    setGameState('playing')
  }, [currentEmployee, initRound])

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      clearTimer(hintTimerRef)
      clearTimer(countdownRef)
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }, [gameState])

  const previousEmployee = useCallback(() => {
    if (currentIndex <= 0) return
    clearTimer(hintTimerRef)
    clearTimer(countdownRef)
    const prevIdx = currentIndex - 1
    setCurrentIndex(prevIdx)
    setGameState('playing')
    persistSession({ currentIndex: prevIdx })
    if (employees[prevIdx]) {
      initRound(employees[prevIdx].displayName)
    }
  }, [currentIndex, employees, persistSession, initRound])

  const restart = useCallback(() => {
    const freshStats = { correct: 0, total: 0, streak: 0, bestStreak: 0, totalTime: 0 }
    setStats(freshStats)
    setCurrentIndex(0)
    persistSession({ currentIndex: 0, stats: freshStats, completedEmployeeIds: [], completed: false })
    loadEmployees(mode)
  }, [mode, loadEmployees, persistSession])

  const updateCurrentEmployee = useCallback(
    (updated: Employee) => {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === updated.id ? updated : emp))
      )
    },
    []
  )

  // timeout counts as seen but not correct
  const handleTimeout = useCallback(() => {
    const newStats = { ...stats, total: stats.total + 1, streak: 0 }
    setStats(newStats)
    persistSession({ stats: newStats })
  }, [stats, persistSession])

  // Track timeout stat when game enters timeout
  const prevGameStateRef = useRef<GameState>('loading')
  useEffect(() => {
    if (gameState === 'timeout' && prevGameStateRef.current === 'playing') {
      handleTimeout()
    }
    prevGameStateRef.current = gameState
  }, [gameState, handleTimeout])

  return {
    currentEmployee,
    gameState,
    mode,
    revealedLetters,
    prefilledLetters,
    typedLetters,
    attemptedLetters,
    hintSecondsLeft,
    stats,
    currentIndex,
    employees,
    totalEmployees: employees.length,
    completedEmployeeIds: sessionRef.current.completedEmployeeIds,
    sessionId: sessionRef.current.id,
    handleKeyPress,
    nextEmployee,
    previousEmployee,
    retryEmployee,
    togglePause,
    updateCurrentEmployee,
    restart,
  }
}
