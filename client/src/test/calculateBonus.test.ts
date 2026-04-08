import { describe, it, expect } from 'vitest'
import { calculateBonus } from '../hooks/usePreview'

describe('calculateBonus', () => {
  it('returns base 1 point for slow answer with no streak', () => {
    expect(calculateBonus(10, 1)).toBe(1)
  })

  it('adds speed bonus for answers under 5 seconds', () => {
    expect(calculateBonus(3, 1)).toBe(2)
  })

  it('adds streak bonus at streak 3', () => {
    expect(calculateBonus(10, 3)).toBe(3) // 1 base + 2 streak
  })

  it('adds streak bonus at streak 5', () => {
    expect(calculateBonus(10, 5)).toBe(4) // 1 base + 3 streak
  })

  it('adds streak bonus at multiples of 5 starting at 10', () => {
    expect(calculateBonus(10, 10)).toBe(6) // 1 base + 5 streak
    expect(calculateBonus(10, 15)).toBe(6)
    expect(calculateBonus(10, 20)).toBe(6)
  })

  it('stacks speed and streak bonuses', () => {
    expect(calculateBonus(2, 3)).toBe(4) // 1 base + 1 speed + 2 streak
    expect(calculateBonus(4, 5)).toBe(5) // 1 base + 1 speed + 3 streak
  })

  it('gives no streak bonus for non-milestone streaks', () => {
    expect(calculateBonus(10, 2)).toBe(1)
    expect(calculateBonus(10, 4)).toBe(1)
    expect(calculateBonus(10, 7)).toBe(1)
  })

  it('gives no streak bonus for streak multiples of 5 below 10', () => {
    // streak === 5 is handled by the explicit check, not the >= 10 branch
    expect(calculateBonus(10, 5)).toBe(4)
  })
})
