import { PetState, Mood } from './pet'

function getActiveStats(state: PetState): number[] {
  return [
    state.thirst,
    state.happiness,
    state.energy,
    state.hunger,
    state.fear,
    state.fire,
    state.magic,
  ].filter((v): v is number => v !== null)
}

export function deriveMood(state: PetState, lastInteractionAt: string): Mood {
  if (state.isAsleep) return 'sleeping'

  const stats = getActiveStats(state)
  if (stats.some((v) => v < 20)) return 'sick'
  if (state.happiness < 40) return 'sad'

  const minutesSinceInteraction =
    (Date.now() - new Date(lastInteractionAt).getTime()) / 60000
  if (state.happiness < 60 && minutesSinceInteraction > 30) return 'bored'

  if (state.happiness > 80 && stats.every((v) => v > 60)) return 'happy'

  return 'neutral'
}
