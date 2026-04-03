import { create } from 'zustand'
import { PetState, Mood } from '../core/pet'
import { feedPet, giveDrink, playWithPet, hugPet, putToSleep, wakeUp } from '../core/events'
import { applyDecay, computeDeltaMinutes } from '../core/timers'
import { deriveMood } from '../core/mood'
import { getSpecies } from '../core/species'
import { checkLoreTriggers } from '../core/lore'

export type PetAction = 'feed' | 'drink' | 'play' | 'hug' | 'sleep' | 'wake'

interface PetStore {
  pet: PetState | null
  loreUnlocks: number[]
  lastInteractionAt: string

  setPet: (pet: PetState) => void
  clearPet: () => void
  performAction: (action: PetAction) => void
  tickDecay: () => void
  unlockLore: (chapter: number) => void
}

const ACTION_HANDLERS: Record<PetAction, (p: PetState) => PetState> = {
  feed: feedPet,
  drink: giveDrink,
  play: playWithPet,
  hug: hugPet,
  sleep: putToSleep,
  wake: wakeUp,
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: null,
  loreUnlocks: [],
  lastInteractionAt: new Date().toISOString(),

  setPet: (pet) => set({ pet }),

  clearPet: () => set({ pet: null, loreUnlocks: [] }),

  performAction: (action) => {
    const { pet } = get()
    if (!pet) return
    const now = new Date().toISOString()
    const updated = ACTION_HANDLERS[action](pet)
    const mood: Mood = deriveMood(updated, now)
    set({ pet: { ...updated, mood }, lastInteractionAt: now })
    const { pet: newPet, loreUnlocks: currentUnlocks } = get()
    if (newPet) {
      checkLoreTriggers(newPet, currentUnlocks).forEach((c) => get().unlockLore(c))
    }
  },

  tickDecay: () => {
    const { pet, lastInteractionAt } = get()
    if (!pet) return
    const delta = computeDeltaMinutes(pet.lastSyncedAt)
    if (delta < 0.5) return
    const species = getSpecies(pet.species)
    const decayed = applyDecay(pet, species, delta)
    const mood = deriveMood(decayed, lastInteractionAt)
    set({ pet: { ...decayed, mood } })
  },

  unlockLore: (chapter) => {
    set((state) => ({
      loreUnlocks: state.loreUnlocks.includes(chapter)
        ? state.loreUnlocks
        : [...state.loreUnlocks, chapter],
    }))
  },
}))
