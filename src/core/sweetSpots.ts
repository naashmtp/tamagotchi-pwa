import type { SpeciesId } from './pet'

export interface SweetSpot {
  min: number
  max: number
  discovered: boolean
  hitsInZone: number
}

export type StatKey = 'hunger' | 'thirst' | 'energy' | 'fear' | 'fire' | 'magic'
export type SweetSpots = Partial<Record<StatKey, SweetSpot>>

const SWEET_SPOT_CENTERS: Record<SpeciesId, Partial<Record<StatKey, [number, number]>>> = {
  slime:  { hunger: [40, 70], thirst: [40, 70], energy: [40, 70] },
  ghost:  { thirst: [40, 70], energy: [30, 60], fear:   [40, 70] },
  dragon: { hunger: [50, 80], thirst: [50, 75], energy: [55, 80], fire:  [50, 80] },
  fairy:  { hunger: [35, 65], thirst: [40, 70], energy: [30, 60], magic: [40, 70] },
  golem:  { hunger: [25, 55], thirst: [25, 55], energy: [25, 55] },
}

function randomCenter(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateSweetSpots(species: SpeciesId): SweetSpots {
  const ranges = SWEET_SPOT_CENTERS[species]
  const result: SweetSpots = {}
  for (const [stat, [lo, hi]] of Object.entries(ranges) as [StatKey, [number, number]][]) {
    const center = randomCenter(lo, hi)
    result[stat] = { min: center - 10, max: center + 10, discovered: false, hitsInZone: 0 }
  }
  return result
}

export function checkSweetSpots(
  stats: Partial<Record<StatKey, number | null>>,
  sweetSpots: SweetSpots
): StatKey[] {
  const hits: StatKey[] = []
  for (const [stat, spot] of Object.entries(sweetSpots) as [StatKey, SweetSpot][]) {
    const value = stats[stat]
    if (value != null && value >= spot.min && value <= spot.max) hits.push(stat)
  }
  return hits
}

export function recordSweetSpotHit(sweetSpots: SweetSpots, stat: StatKey): SweetSpots {
  const spot = sweetSpots[stat]
  if (!spot) return sweetSpots
  const hitsInZone = spot.hitsInZone + 1
  return { ...sweetSpots, [stat]: { ...spot, hitsInZone, discovered: hitsInZone >= 3 } }
}
