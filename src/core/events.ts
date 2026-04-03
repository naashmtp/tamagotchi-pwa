import type { PetState, EvolutionStage } from './pet'

const XP_PER_LEVEL = 100

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function evolutionStageForLevel(level: number): EvolutionStage {
  if (level >= 20) return 3
  if (level >= 10) return 2
  if (level >= 5) return 1
  return 0
}

export function gainXP(state: PetState, amount: number): PetState {
  let xp = state.xp + amount
  let level = state.level
  while (xp >= XP_PER_LEVEL) {
    xp -= XP_PER_LEVEL
    level++
  }
  return { ...state, xp, level, evolutionStage: evolutionStageForLevel(level) }
}

export function feedPet(state: PetState): PetState {
  if (state.hunger === null) return state
  const isOverfed = state.hunger > 90
  const hungerGain = isOverfed ? 5 : 20
  return gainXP({
    ...state,
    hunger: clamp(state.hunger + hungerGain),
    thirst: clamp(state.thirst - 5),
    energy: clamp(state.energy - 3),
  }, 5)
}

export function giveDrink(state: PetState): PetState {
  return gainXP({
    ...state,
    thirst: clamp(state.thirst + 20),
    energy: clamp(state.energy + 3),
  }, 3)
}

export function playWithPet(state: PetState): PetState {
  const isExhausted = state.energy < 20
  const happinessGain = isExhausted ? 5 : 15
  const energyCost = isExhausted ? 25 : 15
  return gainXP({
    ...state,
    happiness: clamp(state.happiness + happinessGain),
    energy: clamp(state.energy - energyCost),
    hunger: state.hunger !== null ? clamp(state.hunger - 10) : null,
    thirst: clamp(state.thirst - 8),
  }, 8)
}

export function hugPet(state: PetState): PetState {
  return gainXP({
    ...state,
    happiness: clamp(state.happiness + 10),
    energy: clamp(state.energy - 3),
  }, 8)
}

export function putToSleep(state: PetState): PetState {
  return { ...state, isAsleep: true }
}

export function wakeUp(state: PetState): PetState {
  return { ...state, isAsleep: false }
}
