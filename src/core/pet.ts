export type SpeciesId = 'slime' | 'ghost' | 'dragon' | 'fairy' | 'golem'

export type Mood = 'happy' | 'neutral' | 'sad' | 'sick' | 'sleeping' | 'bored'

export type EvolutionStage = 0 | 1 | 2 | 3

export interface PetState {
  id: string
  userId: string
  name: string
  species: SpeciesId
  createdAt: string

  // Stats universelles (0-100)
  thirst: number
  happiness: number
  energy: number

  // Stats conditionnelles par espèce (null si non applicable)
  hunger: number | null   // null pour ghost
  fear: number | null     // ghost uniquement
  fire: number | null     // dragon uniquement
  magic: number | null    // fairy uniquement

  // Progression RPG
  level: number
  xp: number
  age: number
  evolutionStage: EvolutionStage

  // État
  mood: Mood
  isAsleep: boolean
  activeLoreChapter: number
  lastSyncedAt: string
  lastInteractionAt: string
}

export function createPet(userId: string, name: string, species: SpeciesId): PetState {
  const now = new Date().toISOString()
  const base: PetState = {
    id: crypto.randomUUID(),
    userId,
    name,
    species,
    createdAt: now,
    thirst: 80,
    happiness: 80,
    energy: 80,
    hunger: null,
    fear: null,
    fire: null,
    magic: null,
    level: 1,
    xp: 0,
    age: 0,
    evolutionStage: 0,
    mood: 'neutral',
    isAsleep: false,
    activeLoreChapter: 0,
    lastSyncedAt: now,
    lastInteractionAt: now,
  }
  if (species === 'ghost') return { ...base, fear: 80 }
  if (species === 'dragon') return { ...base, hunger: 80, fire: 80 }
  if (species === 'fairy') return { ...base, hunger: 80, magic: 80 }
  return { ...base, hunger: 80 } // slime, golem
}
