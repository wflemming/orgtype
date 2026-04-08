import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getPlayers,
  createPlayer,
  deletePlayer,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getActiveSession,
  getPeekState,
  updatePeekState,
} from '../lib/storage'
import type { GameSession } from '../types/employee'
import { INITIAL_PEEK_STATE } from '../types/employee'

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-123' })

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: 'sess-1',
    playerId: 'player-1',
    difficulty: 'medium',
    mode: 'random',
    currentIndex: 0,
    stats: { correct: 0, total: 0, streak: 0, bestStreak: 0, totalTime: 0 },
    completedEmployeeIds: [],
    startedAt: '2026-01-01T00:00:00.000Z',
    lastPlayedAt: '2026-01-01T00:00:00.000Z',
    completed: false,
    totalElapsedMs: 0,
    ...overrides,
  }
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('players', () => {
    it('starts with empty players', () => {
      expect(getPlayers()).toEqual([])
    })

    it('creates and retrieves a player', () => {
      const player = createPlayer('Alice')
      expect(player.name).toBe('Alice')
      expect(player.id).toBe('test-uuid-123')
      expect(getPlayers()).toHaveLength(1)
    })

    it('deletes a player and their sessions', () => {
      const player = createPlayer('Alice')
      createSession(makeSession({ playerId: player.id }))
      deletePlayer(player.id)
      expect(getPlayers()).toHaveLength(0)
      expect(getSessions()).toHaveLength(0)
    })
  })

  describe('sessions', () => {
    it('creates and retrieves sessions', () => {
      createSession(makeSession())
      expect(getSessions()).toHaveLength(1)
    })

    it('updates a session', () => {
      const session = makeSession()
      createSession(session)
      updateSession({ ...session, currentIndex: 5 })
      expect(getSessions()[0].currentIndex).toBe(5)
    })

    it('deletes a session and its peek state', () => {
      createSession(makeSession())
      updatePeekState('sess-1', { points: 10, totalPeeksUsed: 2 })
      deleteSession('sess-1')
      expect(getSessions()).toHaveLength(0)
      // Peek state should also be cleared
      expect(getPeekState('sess-1')).toEqual(INITIAL_PEEK_STATE)
    })

    it('getActiveSession returns incomplete session', () => {
      createSession(makeSession({ playerId: 'p1', completed: false }))
      expect(getActiveSession('p1')).not.toBeNull()
    })

    it('getActiveSession returns null when all complete', () => {
      createSession(makeSession({ playerId: 'p1', completed: true }))
      expect(getActiveSession('p1')).toBeNull()
    })
  })

  describe('peek state', () => {
    it('returns initial state for new session', () => {
      expect(getPeekState('new-session')).toEqual(INITIAL_PEEK_STATE)
    })

    it('persists and retrieves peek state', () => {
      const state = { points: 15, totalPeeksUsed: 3 }
      updatePeekState('sess-1', state)
      expect(getPeekState('sess-1')).toEqual(state)
    })
  })
})
