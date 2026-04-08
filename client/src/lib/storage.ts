import type { Player, GameSession, PeekState } from '../types/employee'
import { INITIAL_PEEK_STATE } from '../types/employee'

const PLAYERS_KEY = 'orgtype_players'
const SESSIONS_KEY = 'orgtype_sessions'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

// --- Players ---

export function getPlayers(): Player[] {
  return read<Player[]>(PLAYERS_KEY, [])
}

export function createPlayer(name: string): Player {
  const player: Player = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  }
  const players = getPlayers()
  players.push(player)
  write(PLAYERS_KEY, players)
  return player
}

export function deletePlayer(id: string) {
  write(PLAYERS_KEY, getPlayers().filter((p) => p.id !== id))
  write(SESSIONS_KEY, getSessions().filter((s) => s.playerId !== id))
}

// --- Sessions ---

export function getSessions(): GameSession[] {
  return read<GameSession[]>(SESSIONS_KEY, [])
}

export function getPlayerSessions(playerId: string): GameSession[] {
  return getSessions().filter((s) => s.playerId === playerId)
}

export function getActiveSession(playerId: string): GameSession | null {
  return getPlayerSessions(playerId).find((s) => !s.completed) ?? null
}

export function createSession(session: GameSession) {
  const sessions = getSessions()
  sessions.push(session)
  write(SESSIONS_KEY, sessions)
}

export function updateSession(session: GameSession) {
  const sessions = getSessions().map((s) => (s.id === session.id ? session : s))
  write(SESSIONS_KEY, sessions)
}

export function deleteSession(id: string) {
  write(SESSIONS_KEY, getSessions().filter((s) => s.id !== id))
  localStorage.removeItem(`orgtype_peek_${id}`)
}

// --- Peek State ---

export function getPeekState(sessionId: string): PeekState {
  return read<PeekState>(`orgtype_peek_${sessionId}`, INITIAL_PEEK_STATE)
}

export function updatePeekState(sessionId: string, state: PeekState) {
  write(`orgtype_peek_${sessionId}`, state)
}
