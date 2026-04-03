import type { PetState } from './pet'
import type { SpeciesDefinition } from './species'
import { checkSweetSpots, recordSweetSpotHit, type StatKey } from './sweetSpots'

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

export function computeDeltaMinutes(lastSyncedAt: string): number {
  return (Date.now() - new Date(lastSyncedAt).getTime()) / 60000
}

export function applyDecay(
  state: PetState,
  species: SpeciesDefinition,
  deltaMinutes: number
): PetState {
  const m = species.decayMultiplier
  const r = species.decayRates

  function decayOrNull(current: number | null, rate: number | null): number | null {
    if (current === null || rate === null) return current
    return clamp(current - rate * m * deltaMinutes)
  }

  const energyChange = state.isAsleep
    ? 0.5 * deltaMinutes
    : -(r.energy * m * deltaMinutes)

  const currentStats: Partial<Record<StatKey, number | null>> = {
    hunger: state.hunger,
    thirst: state.thirst,
    energy: state.energy,
    fear: state.fear,
    fire: state.fire,
    magic: state.magic,
  }

  const sweetSpotHits = checkSweetSpots(currentStats, state.sweetSpots)
  const sweetSpotBonus = sweetSpotHits.length * 0.15 * deltaMinutes

  let updatedSweetSpots = state.sweetSpots
  for (const stat of sweetSpotHits) {
    updatedSweetSpots = recordSweetSpotHit(updatedSweetSpots, stat)
  }

  return {
    ...state,
    hunger: decayOrNull(state.hunger, r.hunger),
    thirst: clamp(state.thirst - r.thirst * m * deltaMinutes),
    happiness: clamp(state.happiness - r.happiness * m * deltaMinutes + sweetSpotBonus),
    energy: clamp(state.energy + energyChange),
    fear: decayOrNull(state.fear, r.fear),
    fire: decayOrNull(state.fire, r.fire),
    magic: decayOrNull(state.magic, r.magic),
    age: Math.floor((Date.now() - new Date(state.createdAt).getTime()) / 86400000),
    lastSyncedAt: new Date().toISOString(),
    sweetSpots: updatedSweetSpots,
  }
}
