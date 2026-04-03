import { describe, it, expect } from 'vitest'
import { checkLoreTriggers, LORE } from './lore'
import { createPet } from './pet'

describe('checkLoreTriggers', () => {
  it('triggers chapter 0 at level 1', () => {
    const pet = createPet('u1', 'T', 'slime')
    expect(checkLoreTriggers(pet, [])).toContain(0)
  })

  it('triggers chapter 1 at level 5', () => {
    const pet = { ...createPet('u1', 'T', 'slime'), level: 5 }
    expect(checkLoreTriggers(pet, [0])).toContain(1)
  })

  it('does not re-trigger already unlocked chapters', () => {
    const pet = createPet('u1', 'T', 'slime')
    expect(checkLoreTriggers(pet, [0])).toHaveLength(0)
  })

  it('LORE has entries for all 5 species', () => {
    expect(LORE.slime.length).toBeGreaterThan(0)
    expect(LORE.ghost.length).toBeGreaterThan(0)
    expect(LORE.dragon.length).toBeGreaterThan(0)
    expect(LORE.fairy.length).toBeGreaterThan(0)
    expect(LORE.golem.length).toBeGreaterThan(0)
  })
})
