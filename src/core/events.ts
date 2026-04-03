import { PetState, EvolutionStage } from './pet'

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
  return gainXP({ ...state, hunger: clamp(state.hunger + 20) }, 5)
}

export function giveDrink(state: PetState): PetState {
  return gainXP({ ...state, thirst: clamp(state.thirst + 20) }, 3)
}

export function playWithPet(state: PetState): PetState {
  return gainXP({ ...state, happiness: clamp(state.happiness + 15) }, 8)
}

export function hugPet(state: PetState): PetState {
  return gainXP({ ...state, happiness: clamp(state.happiness + 10) }, 8)
}

export function putToSleep(state: PetState): PetState {
  return { ...state, isAsleep: true }
}

export function wakeUp(state: PetState): PetState {
  return { ...state, isAsleep: false }
}
