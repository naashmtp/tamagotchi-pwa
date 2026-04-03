import type { Mood, SpeciesId } from '../../core/pet'
import { SPECIES } from '../../core/species'
import { Slime } from './Slime'
import './PetSprite.css'

interface Props {
  species: SpeciesId
  mood: Mood
}

export function PetSprite({ species, mood }: Props) {
  if (species === 'slime') {
    return <Slime mood={mood} size={256} />
  }

  const color = SPECIES[species].eggColor
  return (
    <div
      className={`pet-sprite species-${species} mood-${mood}`}
      style={{ '--species-color': color } as React.CSSProperties}
    />
  )
}
