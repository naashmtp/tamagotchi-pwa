import { create } from 'zustand'
import type { PetState, Mood } from '../core/pet'
import { feedPet, giveDrink, playWithPet, hugPet, putToSleep, wakeUp } from '../core/events'
import { applyDecay, computeDeltaMinutes } from '../core/timers'
import { deriveMood } from '../core/mood'
import { getSpecies } from '../core/species'
import { checkLoreTriggers } from '../core/lore'
import { checkSweetSpots, type StatKey } from '../core/sweetSpots'
import { playSound } from '../lib/sound'

export type PetAction = 'feed' | 'drink' | 'play' | 'hug' | 'sleep' | 'wake'

export interface ActionResult {
  action: PetAction
  xpGained: number
  sweetSpotHits: StatKey[]
  overindulgence: boolean
  hugSaturated: boolean
}

const XP_PER_LEVEL = 100
const HUG_COOLDOWN_MS = 2 * 60 * 1000
const HUG_MAX_CONSECUTIVE = 3

const ACTION_SOUNDS: Partial<Record<PetAction, Parameters<typeof playSound>[0]>> = {
  feed: 'feed', drink: 'drink', play: 'play', hug: 'hug',
}

interface PetStore {
  pet: PetState | null
  loreUnlocks: number[]
  lastInteractionAt: string
  consecutiveHugs: number
  lastHugAt: string | null

  setPet: (pet: PetState) => void
  clearPet: () => void
  performAction: (action: PetAction) => ActionResult
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

function isHugSaturated(consecutiveHugs: number, lastHugAt: string | null): boolean {
  if (consecutiveHugs < HUG_MAX_CONSECUTIVE) return false
  if (!lastHugAt) return false
  return Date.now() - new Date(lastHugAt).getTime() < HUG_COOLDOWN_MS
}

function isOverindulgence(action: PetAction, pet: PetState): boolean {
  if (action === 'feed' && pet.hunger !== null && pet.hunger > 90) return true
  if (action === 'play' && pet.energy < 20) return true
  return false
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: null,
  loreUnlocks: [],
  lastInteractionAt: new Date().toISOString(),
  consecutiveHugs: 0,
  lastHugAt: null,

  setPet: (pet) => {
    set({ pet })
    const { loreUnlocks: current } = get()
    checkLoreTriggers(pet, current).forEach((c) => get().unlockLore(c))
  },

  clearPet: () => set({ pet: null, loreUnlocks: [], consecutiveHugs: 0, lastHugAt: null }),

  performAction: (action) => {
    const { pet, consecutiveHugs, lastHugAt, loreUnlocks: currentUnlocks } = get()
    if (!pet) return { action, xpGained: 0, sweetSpotHits: [], overindulgence: false, hugSaturated: false }

    if (action === 'hug' && isHugSaturated(consecutiveHugs, lastHugAt)) {
      return { action, xpGained: 0, sweetSpotHits: [], overindulgence: false, hugSaturated: true }
    }

    const overindulgence = isOverindulgence(action, pet)
    const xpBefore = pet.xp + pet.level * XP_PER_LEVEL

    const now = new Date().toISOString()
    const updated = ACTION_HANDLERS[action](pet)
    const xpAfter = updated.xp + updated.level * XP_PER_LEVEL
    const xpGained = xpAfter - xpBefore

    const currentStats: Partial<Record<StatKey, number | null>> = {
      hunger: updated.hunger, thirst: updated.thirst, energy: updated.energy,
      fear: updated.fear, fire: updated.fire, magic: updated.magic,
    }
    const sweetSpotHits = checkSweetSpots(currentStats, updated.sweetSpots)

    const newConsecutiveHugs = action === 'hug' ? consecutiveHugs + 1 : 0
    const newLastHugAt = action === 'hug' ? now : lastHugAt

    const mood: Mood = deriveMood(updated, now)
    set({ pet: { ...updated, mood }, lastInteractionAt: now, consecutiveHugs: newConsecutiveHugs, lastHugAt: newLastHugAt })

    const { pet: newPet } = get()
    if (newPet) checkLoreTriggers(newPet, currentUnlocks).forEach((c) => get().unlockLore(c))

    if (updated.level > pet.level) playSound('levelup')
    else if (sweetSpotHits.length > 0) playSound('sweetspot')
    else if (ACTION_SOUNDS[action]) playSound(ACTION_SOUNDS[action]!)

    return { action, xpGained, sweetSpotHits, overindulgence, hugSaturated: false }
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
