import type { Mood, SpeciesId } from '../../core/pet'
import { ProceduralPet } from './ProceduralPet'
import { slimeRenderer } from './renderers/slimeRenderer'
import { ghostRenderer } from './renderers/ghostRenderer'
import { dragonRenderer } from './renderers/dragonRenderer'
import { fairyRenderer } from './renderers/fairyRenderer'
import { golemRenderer } from './renderers/golemRenderer'
import type { ProceduralRenderer } from './renderers/types'
import './PetSprite.css'

interface Props {
  species: SpeciesId
  mood: Mood
}

const RENDERERS: Record<SpeciesId, ProceduralRenderer> = {
  slime: slimeRenderer,
  ghost: ghostRenderer,
  dragon: dragonRenderer,
  fairy: fairyRenderer,
  golem: golemRenderer
}

export function PetSprite({ species, mood }: Props) {
  const renderer = RENDERERS[species]
  
  if (renderer) {
    return <ProceduralPet mood={mood} size={256} renderer={renderer} />
  }

  // Fallback si un jour une espèce n'a pas de renderer procedural
  return (
    <div
      className={`pet-sprite species-${species} mood-${mood}`}
      style={{ '--species-color': 'gray' } as React.CSSProperties}
    />
  )
}


