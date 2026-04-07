export interface Employee {
  id: number
  name: string
  role: string
  level: number
  managerId: number | null
  imageUrl: string | null
  linkedinUrl: string | null
  roleAlias: string | null
}

export type GameMode = 'random' | 'top-down' | 'bottom-up'

export type GameState = 'loading' | 'playing' | 'paused' | 'revealed' | 'timeout' | 'complete'
