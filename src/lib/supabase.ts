import { createClient } from '@supabase/supabase-js'
import type { PetState } from '../core/pet'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
)

function petToRow(pet: PetState): Record<string, unknown> {
  return {
    id: pet.id,
    user_id: pet.userId,
    name: pet.name,
    species: pet.species,
    created_at: pet.createdAt,
    thirst: pet.thirst,
    happiness: pet.happiness,
    energy: pet.energy,
    hunger: pet.hunger,
    fear: pet.fear,
    fire: pet.fire,
    magic: pet.magic,
    level: pet.level,
    xp: pet.xp,
    age: pet.age,
    evolution_stage: pet.evolutionStage,
    mood: pet.mood,
    is_asleep: pet.isAsleep,
    active_lore_chapter: pet.activeLoreChapter,
    last_synced_at: pet.lastSyncedAt,
    last_interaction_at: pet.lastInteractionAt,
  }
}

function rowToPet(row: Record<string, unknown>): PetState {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    species: row.species as PetState['species'],
    createdAt: row.created_at as string,
    thirst: row.thirst as number,
    happiness: row.happiness as number,
    energy: row.energy as number,
    hunger: row.hunger as number | null,
    fear: row.fear as number | null,
    fire: row.fire as number | null,
    magic: row.magic as number | null,
    level: row.level as number,
    xp: row.xp as number,
    age: row.age as number,
    evolutionStage: row.evolution_stage as PetState['evolutionStage'],
    mood: row.mood as PetState['mood'],
    isAsleep: row.is_asleep as boolean,
    activeLoreChapter: row.active_lore_chapter as number,
    lastSyncedAt: row.last_synced_at as string,
    lastInteractionAt: row.last_interaction_at as string,
  }
}

export async function savePet(pet: PetState): Promise<void> {
  const { error } = await supabase
    .from('pets')
    .upsert(petToRow(pet), { onConflict: 'user_id' })
  if (error) throw error
}

export async function loadPet(userId: string): Promise<PetState | null> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return rowToPet(data as Record<string, unknown>)
}

export async function loadLoreUnlocks(userId: string): Promise<number[]> {
  const { data } = await supabase
    .from('lore_unlocks')
    .select('chapter_index')
    .eq('user_id', userId)
  return (data ?? []).map((r: { chapter_index: number }) => r.chapter_index)
}
