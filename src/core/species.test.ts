import { describe, it, expect } from 'vitest'
import { SPECIES, getSpecies } from './species'

describe('species', () => {
  it('defines exactly 5 species', () => {
    expect(Object.keys(SPECIES)).toHaveLength(5)
  })

  it('each species has positive decay rates for active stats', () => {
    for (const species of Object.values(SPECIES)) {
      expect(species.decayRates.thirst).toBeGreaterThan(0)
      expect(species.decayRates.happiness).toBeGreaterThan(0)
      expect(species.decayRates.energy).toBeGreaterThan(0)
    }
  })

  it('golem has 0.5x decay multiplier', () => {
    expect(SPECIES.golem.decayMultiplier).toBe(0.5)
  })

  it('ghost has null hunger rate', () => {
    expect(SPECIES.ghost.decayRates.hunger).toBeNull()
  })

  it('getSpecies returns correct species', () => {
    expect(getSpecies('slime').id).toBe('slime')
  })
})
