import { describe, it, expect } from 'vitest'
import { deriveMood } from './mood'
import { PetState, createPet } from './pet'

function makeState(overrides: Partial<PetState> = {}): PetState {
  return { ...createPet('user-1', 'Test', 'slime'), ...overrides }
}

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString()
}

describe('deriveMood', () => {
  it('returns sleeping when isAsleep', () => {
    expect(deriveMood(makeState({ isAsleep: true }), minutesAgo(5))).toBe('sleeping')
  })

  it('returns sick when happiness below 20', () => {
    expect(deriveMood(makeState({ happiness: 10 }), minutesAgo(1))).toBe('sick')
  })

  it('returns sick when thirst below 20', () => {
    expect(deriveMood(makeState({ thirst: 15 }), minutesAgo(1))).toBe('sick')
  })

  it('returns sad when happiness below 40', () => {
    expect(deriveMood(makeState({ happiness: 35 }), minutesAgo(1))).toBe('sad')
  })

  it('returns bored when happiness < 60 and no interaction for 30+ min', () => {
    expect(deriveMood(makeState({ happiness: 55 }), minutesAgo(35))).toBe('bored')
  })

  it('returns happy when happiness > 80 and all stats > 60', () => {
    const state = makeState({ happiness: 90, thirst: 70, energy: 70, hunger: 70 })
    expect(deriveMood(state, minutesAgo(1))).toBe('happy')
  })

  it('returns neutral by default', () => {
    expect(deriveMood(makeState({ happiness: 65 }), minutesAgo(1))).toBe('neutral')
  })

  it('returns sick when hunger > 95', () => {
    const p = { ...createPet('u', 'T', 'slime'), hunger: 96 }
    expect(deriveMood(p, minutesAgo(1))).toBe('sick')
  })

  it('sleeping takes priority over sick', () => {
    expect(deriveMood(makeState({ isAsleep: true, happiness: 10 }), minutesAgo(1))).toBe('sleeping')
  })
})
