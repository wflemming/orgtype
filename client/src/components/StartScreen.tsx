import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Player, GameSession, Difficulty, GameMode } from '../types/employee'
import { DIFFICULTY_CONFIG } from '../types/employee'
import {
  getPlayers,
  createPlayer,
  deletePlayer,
  getPlayerSessions,
  getActiveSession,
  createSession,
  deleteSession,
} from '../lib/storage'

interface Props {
  onStart: (session: GameSession) => void
}

type Step = 'player' | 'session'

const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert']
const modes: { value: GameMode; label: string; icon: string }[] = [
  { value: 'random', label: 'Random', icon: '🎲' },
  { value: 'top-down', label: 'Top → Down', icon: '⬇' },
  { value: 'bottom-up', label: 'Bottom → Up', icon: '⬆' },
]

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

export function StartScreen({ onStart }: Props) {
  const [step, setStep] = useState<Step>('player')
  const [players, setPlayers] = useState<Player[]>(getPlayers())
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('hard')
  const [mode, setMode] = useState<GameMode>('random')
  const [, setSessionVersion] = useState(0)

  function handleCreatePlayer() {
    const name = newPlayerName.trim()
    if (!name) return
    const player = createPlayer(name)
    setPlayers(getPlayers())
    setSelectedPlayer(player)
    setNewPlayerName('')
    setStep('session')
  }

  function handleSelectPlayer(player: Player) {
    setSelectedPlayer(player)
    setStep('session')
  }

  function handleDeletePlayer(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    deletePlayer(id)
    setPlayers(getPlayers())
    if (selectedPlayer?.id === id) {
      setSelectedPlayer(null)
      setStep('player')
    }
  }

  function handleResume(session: GameSession) {
    onStart(session)
  }

  function handleStartFresh() {
    if (!selectedPlayer) return

    // Clear any existing active session for this player
    const active = getActiveSession(selectedPlayer.id)
    if (active) {
      deleteSession(active.id)
    }

    const session: GameSession = {
      id: crypto.randomUUID(),
      playerId: selectedPlayer.id,
      difficulty,
      mode,
      currentIndex: 0,
      stats: { correct: 0, total: 0, streak: 0, bestStreak: 0, totalTime: 0 },
      completedEmployeeIds: [],
      startedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      completed: false,
      totalElapsedMs: 0,
    }
    createSession(session)
    onStart(session)
  }

  function handleDeleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    deleteSession(id)
    setSessionVersion((v) => v + 1)
  }

  const playerSessions = selectedPlayer ? getPlayerSessions(selectedPlayer.id) : []
  const activeSession = selectedPlayer ? getActiveSession(selectedPlayer.id) : null
  const completedSessions = playerSessions.filter((s) => s.completed)

  return (
    <div className="flex flex-col items-center gap-8 py-4 w-full max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {step === 'player' && (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-sofi-dark">Who's playing?</h2>
              <p className="text-gray-400 text-sm mt-1">
                Select your name or create a new player
              </p>
            </div>

            {/* Existing players */}
            {players.length > 0 && (
              <div className="space-y-2">
                {players.map((player) => {
                  const sessions = getPlayerSessions(player.id)
                  const active = sessions.find((s) => !s.completed)
                  const completed = sessions.filter((s) => s.completed).length
                  return (
                    <div
                      key={player.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectPlayer(player)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectPlayer(player)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-xl border border-gray-100 hover:border-sofi-purple/30 hover:shadow-sm transition-all group cursor-pointer"
                    >
                      <div className="text-left">
                        <p className="font-semibold text-sofi-dark">{player.name}</p>
                        <p className="text-xs text-gray-400">
                          {active
                            ? `In progress — ${DIFFICULTY_CONFIG[active.difficulty].label}, ${active.stats.correct}/${active.stats.total} correct`
                            : completed > 0
                              ? `${completed} completed game${completed > 1 ? 's' : ''}`
                              : 'No games yet'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {active && (
                          <span className="px-2 py-0.5 bg-sofi-purple/10 text-sofi-purple text-xs font-medium rounded-full">
                            Resume
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeletePlayer(e, player.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm"
                          title="Delete player"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* New player */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlayer()}
                placeholder="Enter your name..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sofi-purple/30 focus:border-sofi-purple"
                autoFocus={players.length === 0}
              />
              <button
                onClick={handleCreatePlayer}
                disabled={!newPlayerName.trim()}
                className="px-5 py-3 bg-sofi-purple text-white rounded-xl font-semibold hover:bg-sofi-purple-dark transition-colors disabled:opacity-50"
              >
                Start
              </button>
            </div>
          </motion.div>
        )}

        {step === 'session' && selectedPlayer && (
          <motion.div
            key="session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-6"
          >
            <div className="text-center">
              <button
                onClick={() => setStep('player')}
                className="text-xs text-gray-400 hover:text-sofi-purple transition-colors mb-2 inline-block"
              >
                ← Switch player
              </button>
              <h2 className="text-2xl font-bold text-sofi-dark">
                Hey, {selectedPlayer.name}
              </h2>
            </div>

            {/* Active session - resume option */}
            {activeSession && (
              <div className="bg-sofi-purple/5 rounded-xl p-5 border border-sofi-purple/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sofi-dark text-sm">Game in progress</p>
                  <button
                    onClick={(e) => handleDeleteSession(e, activeSession.id)}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Discard
                  </button>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mb-3">
                  <span>{DIFFICULTY_CONFIG[activeSession.difficulty].label}</span>
                  <span>{activeSession.stats.correct}/{activeSession.stats.total} correct</span>
                  <span>Streak: {activeSession.stats.bestStreak}</span>
                </div>
                <button
                  onClick={() => handleResume(activeSession)}
                  className="w-full px-5 py-3 bg-sofi-purple text-white rounded-xl font-semibold hover:bg-sofi-purple-dark transition-colors"
                >
                  Resume Game
                </button>
              </div>
            )}

            {/* New game config */}
            <div className="space-y-4">
              <p className="font-semibold text-sofi-dark text-sm">
                {activeSession ? 'Or start fresh' : 'Start a new game'}
              </p>

              {/* Difficulty */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Difficulty</label>
                <div className="grid grid-cols-4 gap-2">
                  {difficulties.map((d) => {
                    const cfg = DIFFICULTY_CONFIG[d]
                    return (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-3 rounded-xl text-center transition-all border ${
                          difficulty === d
                            ? 'bg-sofi-purple text-white border-sofi-purple shadow-md'
                            : 'bg-white text-sofi-dark border-gray-100 hover:border-sofi-purple/30'
                        }`}
                      >
                        <p className="font-semibold text-sm">{cfg.label}</p>
                        <p className={`text-xs mt-0.5 ${difficulty === d ? 'text-white/70' : 'text-gray-400'}`}>
                          {cfg.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Order</label>
                <div className="flex gap-2">
                  {modes.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        mode === m.value
                          ? 'bg-sofi-purple text-white border-sofi-purple shadow-md'
                          : 'bg-white text-sofi-dark border-gray-100 hover:border-sofi-purple/30'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartFresh}
                className={`w-full px-5 py-3 rounded-xl font-semibold transition-colors ${
                  activeSession
                    ? 'bg-white text-sofi-purple border-2 border-sofi-purple hover:bg-sofi-purple/5'
                    : 'bg-sofi-purple text-white hover:bg-sofi-purple-dark'
                }`}
              >
                Start New Game
              </button>
            </div>

            {/* Completed sessions history */}
            {completedSessions.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Past games</p>
                <div className="space-y-1.5">
                  {completedSessions.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg text-xs"
                    >
                      <div className="flex gap-3 text-gray-500">
                        <span className="font-medium">{DIFFICULTY_CONFIG[s.difficulty].label}</span>
                        <span>{s.stats.correct}/{s.stats.total} correct</span>
                        <span>Best streak: {s.stats.bestStreak}</span>
                        {s.totalElapsedMs > 0 && <span>{formatDuration(s.totalElapsedMs)}</span>}
                      </div>
                      <span className="text-gray-300">
                        {new Date(s.lastPlayedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
