import { describe, it, expect } from 'vitest'
import { applyDecay, computeDeltaMinutes } from './timers'
import { createPet } from './pet'
import { SPECIES, getSpecies } from './species'

describe('computeDeltaMinutes', () => {
  it('computes correct delta', () => {
    const past = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    expect(computeDeltaMinutes(past)).toBeCloseTo(10, 0)
  })
})

describe('applyDecay', () => {
  it('reduces hunger over time for slime', () => {
    const p = createPet('u1', 'T', 'slime')
    expect(applyDecay(p, SPECIES.slime, 10).hunger).toBeLessThan(80)
  })

  it('never goes below 0', () => {
    const p = { ...createPet('u1', 'T', 'slime'), hunger: 1 }
    expect(applyDecay(p, SPECIES.slime, 1000).hunger).toBe(0)
  })

  it('golem decays at half rate of slime', () => {
    const slime = createPet('u1', 'S', 'slime')
    const golem = createPet('u1', 'G', 'golem')
    const sr = applyDecay(slime, SPECIES.slime, 10)
    const gr = applyDecay(golem, SPECIES.golem, 10)
    const slimeDrop = 80 - (sr.hunger ?? 0)
    const golemDrop = 80 - (gr.hunger ?? 0)
    expect(golemDrop).toBeCloseTo(slimeDrop * 0.5, 1)
  })

  it('does not touch null stats (ghost hunger)', () => {
    const ghost = createPet('u1', 'G', 'ghost')
    expect(applyDecay(ghost, SPECIES.ghost, 60).hunger).toBeNull()
  })

  it('energy recovers while asleep', () => {
    const p = { ...createPet('u1', 'T', 'slime'), isAsleep: true, energy: 40 }
    expect(applyDecay(p, SPECIES.slime, 10).energy).toBeGreaterThan(40)
  })

  it('updates lastSyncedAt', () => {
    const past = new Date(Date.now() - 5000).toISOString()
    const p = { ...createPet('u1', 'T', 'slime'), lastSyncedAt: past }
    expect(applyDecay(p, SPECIES.slime, 5).lastSyncedAt).not.toBe(past)
  })
})

describe('sweet spot passive bonus', () => {
  it('adds happiness when a stat is in sweet spot', () => {
    const pet = createPet('u', 'T', 'slime')
    const forcedSpot = { min: 70, max: 90, discovered: true, hitsInZone: 5 }
    const petWithSpot = { ...pet, thirst: 80, sweetSpots: { thirst: forcedSpot } }
    const species = getSpecies('slime')
    const after = applyDecay(petWithSpot, species, 1)
    // With 1 stat in sweet spot: +0.15 happiness bonus, minus normal decay ~0.2/min
    expect(after.happiness).toBeGreaterThan(petWithSpot.happiness - 0.2)
  })

  it('records sweet spot hit and increments hitsInZone', () => {
    const pet = createPet('u', 'T', 'slime')
    const forcedSpot = { min: 70, max: 90, discovered: false, hitsInZone: 0 }
    const petWithSpot = { ...pet, thirst: 80, sweetSpots: { thirst: forcedSpot } }
    const species = getSpecies('slime')
    const after = applyDecay(petWithSpot, species, 1)
    expect(after.sweetSpots.thirst!.hitsInZone).toBe(1)
  })
})
