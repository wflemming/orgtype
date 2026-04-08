export interface Employee {
  id: number
  legalName: string
  preferredName: string | null
  displayName: string
  role: string
  level: number
  managerId: number | null
  imageUrl: string | null
  linkedinUrl: string | null
  roleAlias: string | null
  hidden?: boolean
}

export type GameMode = 'random' | 'top-down' | 'bottom-up'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; prefillPct: number; description: string }> = {
  easy: { label: 'Easy', prefillPct: 0.75, description: '75% of letters shown' },
  medium: { label: 'Medium', prefillPct: 0.50, description: '50% of letters shown' },
  hard: { label: 'Hard', prefillPct: 0.25, description: '25% of letters shown' },
  expert: { label: 'Expert', prefillPct: 0, description: 'No letters shown' },
}

export type GameState = 'loading' | 'playing' | 'paused' | 'revealed' | 'timeout' | 'complete'

export interface Player {
  id: string
  name: string
  createdAt: string
}

export interface GameSession {
  id: string
  playerId: string
  difficulty: Difficulty
  mode: GameMode
  currentIndex: number
  stats: {
    correct: number
    total: number
    streak: number
    bestStreak: number
    totalTime: number
  }
  completedEmployeeIds: number[]
  startedAt: string
  lastPlayedAt: string
  completed: boolean
  totalElapsedMs: number
}

export type FlagReason =
  | 'not_found'
  | 'wrong_role'
  | 'wrong_manager'
  | 'duplicate'
  | 'left_company'
  | 'other'

export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  not_found: "Can't find this person",
  wrong_role: 'Role appears incorrect',
  wrong_manager: 'Reports to wrong person',
  duplicate: 'Duplicate entry',
  left_company: 'No longer at company',
  other: 'Other',
}

// --- Shared constants ---

export const LEVEL_LABELS: Record<number, string> = {
  1: 'C-Suite',
  2: 'VP',
  3: 'Director',
  4: 'IC',
}

// --- Peek / Preview types ---

export interface PeekState {
  points: number
  totalPeeksUsed: number
}

export const INITIAL_PEEK_STATE: PeekState = {
  points: 5,
  totalPeeksUsed: 0,
}

export const MAX_PEEK_POINTS = 20

export interface EmployeeFlag {
  id: number
  employeeId: number
  employeeName: string
  employeeRole: string
  reason: string
  note: string | null
  status: string
  createdAt: string
}
