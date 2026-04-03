import { describe, it, expect } from 'vitest'
import { feedPet, giveDrink, playWithPet, hugPet, putToSleep, wakeUp, gainXP } from './events'
import { createPet, PetState } from './pet'

function pet(overrides: Partial<PetState> = {}): PetState {
  return { ...createPet('u1', 'T', 'slime'), ...overrides }
}

describe('feedPet', () => {
  it('increases hunger by 20, capped at 100', () => {
    expect(feedPet(pet({ hunger: 70 })).hunger).toBe(90)
    expect(feedPet(pet({ hunger: 90 })).hunger).toBe(100)
  })

  it('grants 5 XP', () => {
    expect(feedPet(pet()).xp).toBe(5)
  })

  it('does nothing if hunger is null (ghost)', () => {
    const ghost = { ...createPet('u1', 'G', 'ghost'), hunger: null }
    expect(feedPet(ghost).hunger).toBeNull()
    expect(feedPet(ghost).xp).toBe(0)
  })
})

describe('giveDrink', () => {
  it('increases thirst by 20, capped at 100', () => {
    expect(giveDrink(pet({ thirst: 60 })).thirst).toBe(80)
  })

  it('grants 3 XP', () => {
    expect(giveDrink(pet()).xp).toBe(3)
  })
})

describe('playWithPet', () => {
  it('increases happiness by 15, capped at 100', () => {
    expect(playWithPet(pet({ happiness: 70 })).happiness).toBe(85)
  })

  it('grants 8 XP', () => {
    expect(playWithPet(pet()).xp).toBe(8)
  })
})

describe('hugPet', () => {
  it('increases happiness by 10, capped at 100', () => {
    expect(hugPet(pet({ happiness: 95 })).happiness).toBe(100)
  })

  it('grants 8 XP', () => {
    expect(hugPet(pet()).xp).toBe(8)
  })
})

describe('putToSleep / wakeUp', () => {
  it('putToSleep sets isAsleep to true', () => {
    expect(putToSleep(pet()).isAsleep).toBe(true)
  })

  it('wakeUp sets isAsleep to false', () => {
    expect(wakeUp(pet({ isAsleep: true })).isAsleep).toBe(false)
  })
})

describe('secondary costs', () => {
  it('feedPet drains thirst and energy', () => {
    const p = pet()
    const after = feedPet(p)
    expect(after.thirst).toBeLessThan(p.thirst)
    expect(after.energy).toBeLessThan(p.energy)
  })

  it('feedPet gives diminishing return when hunger > 90', () => {
    const p = pet({ hunger: 92 })
    const after = feedPet(p)
    expect(after.hunger! - 92).toBeLessThanOrEqual(5)
  })

  it('giveDrink gives small energy boost', () => {
    const p = pet()
    const after = giveDrink(p)
    expect(after.energy).toBeGreaterThan(p.energy)
  })

  it('playWithPet drains hunger thirst energy', () => {
    const p = pet()
    const after = playWithPet(p)
    expect(after.hunger!).toBeLessThan(p.hunger!)
    expect(after.thirst).toBeLessThan(p.thirst)
    expect(after.energy).toBeLessThan(p.energy)
  })

  it('playWithPet gives less happiness when exhausted (energy < 20)', () => {
    const petNormal = pet()
    const petTired = pet({ energy: 15 })
    const normalResult = playWithPet(petNormal)
    const tiredResult = playWithPet(petTired)
    expect(normalResult.happiness - petNormal.happiness).toBeGreaterThan(
      tiredResult.happiness - petTired.happiness
    )
  })

  it('hugPet drains energy slightly', () => {
    const p = pet()
    const after = hugPet(p)
    expect(after.energy).toBeLessThan(p.energy)
  })
})

describe('gainXP', () => {
  it('levels up when XP reaches 100', () => {
    const leveled = gainXP(pet({ xp: 95 }), 10)
    expect(leveled.level).toBe(2)
    expect(leveled.xp).toBe(5)
  })

  it('sets evolutionStage 1 at level 5', () => {
    const p = gainXP(pet({ level: 4, xp: 95 }), 10)
    expect(p.evolutionStage).toBe(1)
  })

  it('sets evolutionStage 2 at level 10', () => {
    const p = gainXP(pet({ level: 9, xp: 95 }), 10)
    expect(p.evolutionStage).toBe(2)
  })

  it('sets evolutionStage 3 at level 20', () => {
    const p = gainXP(pet({ level: 19, xp: 95 }), 10)
    expect(p.evolutionStage).toBe(3)
  })
})
