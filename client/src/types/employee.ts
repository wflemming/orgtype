export interface Employee {
  id: number
  name: string
  role: string
  level: number
  managerId: number | null
  imageUrl: string | null
  linkedinUrl: string | null
}

export type GameMode = 'random' | 'top-down' | 'bottom-up'

export type GameState = 'loading' | 'playing' | 'revealed' | 'complete'
