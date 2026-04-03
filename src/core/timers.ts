import type { PetState } from './pet'
import type { SpeciesDefinition } from './species'

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

  return {
    ...state,
    hunger: decayOrNull(state.hunger, r.hunger),
    thirst: clamp(state.thirst - r.thirst * m * deltaMinutes),
    happiness: clamp(state.happiness - r.happiness * m * deltaMinutes),
    energy: clamp(state.energy + energyChange),
    fear: decayOrNull(state.fear, r.fear),
    fire: decayOrNull(state.fire, r.fire),
    magic: decayOrNull(state.magic, r.magic),
    age: Math.floor((Date.now() - new Date(state.createdAt).getTime()) / 86400000),
    lastSyncedAt: new Date().toISOString(),
  }
}
