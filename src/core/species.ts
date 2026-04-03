import { SpeciesId } from './pet'

export interface DecayRates {
  thirst: number
  happiness: number
  energy: number
  hunger: number | null
  fear: number | null
  fire: number | null
  magic: number | null
}

export interface SpeciesDefinition {
  id: SpeciesId
  name: string
  eggColor: string
  eggHint: string
  decayRates: DecayRates
  decayMultiplier: number
}

const BASE_DECAY: DecayRates = {
  thirst: 0.33,
  happiness: 0.2,
  energy: 0.15,
  hunger: 0.2,
  fear: null,
  fire: null,
  magic: null,
}

export const SPECIES: Record<SpeciesId, SpeciesDefinition> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    eggColor: '#7ecf7e',
    eggHint: 'Un œuf doux et légèrement gélatineux. Il semble absorber la lumière.',
    decayRates: { ...BASE_DECAY },
    decayMultiplier: 1,
  },
  ghost: {
    id: 'ghost',
    name: 'Ghost',
    eggColor: '#c0c0e8',
    eggHint: 'Un œuf translucide et froid. On croit parfois y voir un visage.',
    decayRates: { ...BASE_DECAY, hunger: null, fear: 0.25 },
    decayMultiplier: 1,
  },
  dragon: {
    id: 'dragon',
    name: 'Dragon',
    eggColor: '#e87e7e',
    eggHint: 'Un œuf chaud et rugueux. Il vibre légèrement par moments.',
    decayRates: { ...BASE_DECAY, fire: 0.3 },
    decayMultiplier: 1,
  },
  fairy: {
    id: 'fairy',
    name: 'Fairy',
    eggColor: '#f0c0f0',
    eggHint: 'Un œuf délicat, irisé. Il scintille quand on le regarde trop longtemps.',
    decayRates: { ...BASE_DECAY, happiness: 0.3, magic: 0.1 },
    decayMultiplier: 1,
  },
  golem: {
    id: 'golem',
    name: 'Golem',
    eggColor: '#a09080',
    eggHint: 'Un œuf lourd, rocailleux. Il semble avoir toujours été là.',
    decayRates: { ...BASE_DECAY },
    decayMultiplier: 0.5,
  },
}

export function getSpecies(id: SpeciesId): SpeciesDefinition {
  return SPECIES[id]
}
