import { Mood, SpeciesId } from '../../core/pet'
import { SPECIES } from '../../core/species'
import './PetSprite.css'

interface Props {
  species: SpeciesId
  mood: Mood
}

export function PetSprite({ species, mood }: Props) {
  const color = SPECIES[species].eggColor
  return (
    <div
      className={`pet-sprite species-${species} mood-${mood}`}
      style={{ '--species-color': color } as React.CSSProperties}
    />
  )
}
