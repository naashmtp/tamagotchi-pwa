import { describe, it, expect } from 'vitest'
import { generateSweetSpots, checkSweetSpots, recordSweetSpotHit } from './sweetSpots'

describe('generateSweetSpots', () => {
  it('generates a sweet spot for each relevant stat per species', () => {
    const spots = generateSweetSpots('slime')
    expect(spots.hunger).toBeDefined()
    expect(spots.thirst).toBeDefined()
    expect(spots.energy).toBeDefined()
    expect(spots.fear).toBeUndefined()
  })

  it('generates narrow zones (width = 20)', () => {
    const spots = generateSweetSpots('dragon')
    expect(spots.energy!.max - spots.energy!.min).toBe(20)
  })

  it('ghost has no hunger sweet spot but has fear', () => {
    const spots = generateSweetSpots('ghost')
    expect(spots.hunger).toBeUndefined()
    expect(spots.fear).toBeDefined()
  })

  it('starts undiscovered with 0 hits', () => {
    const spots = generateSweetSpots('slime')
    expect(spots.hunger!.discovered).toBe(false)
    expect(spots.hunger!.hitsInZone).toBe(0)
  })
})

describe('checkSweetSpots', () => {
  it('returns stat keys currently in sweet spot', () => {
    const spots = { hunger: { min: 50, max: 70, discovered: true, hitsInZone: 5 } }
    expect(checkSweetSpots({ hunger: 60 }, spots)).toEqual(['hunger'])
    expect(checkSweetSpots({ hunger: 40 }, spots)).toEqual([])
  })

  it('ignores null stats', () => {
    const spots = { hunger: { min: 50, max: 70, discovered: true, hitsInZone: 5 } }
    expect(checkSweetSpots({ hunger: null }, spots)).toEqual([])
  })
})

describe('recordSweetSpotHit', () => {
  it('increments hitsInZone', () => {
    const spots = { hunger: { min: 50, max: 70, discovered: false, hitsInZone: 1 } }
    const updated = recordSweetSpotHit(spots, 'hunger')
    expect(updated.hunger!.hitsInZone).toBe(2)
  })

  it('marks discovered after 3 hits', () => {
    const spots = { hunger: { min: 50, max: 70, discovered: false, hitsInZone: 2 } }
    const updated = recordSweetSpotHit(spots, 'hunger')
    expect(updated.hunger!.discovered).toBe(true)
  })
})
