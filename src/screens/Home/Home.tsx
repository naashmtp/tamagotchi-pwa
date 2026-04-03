import { useEffect } from 'react'
import { usePetStore } from '../../store/petStore'
import { useDecayLoop } from '../../hooks/useDecayLoop'
import { PetSprite } from '../../components/Pet/PetSprite'
import { StatsBar } from '../../components/Stats/StatsBar'
import { ActionButtons } from '../../components/Actions/ActionButtons'
import { savePet } from '../../lib/supabase'
import './Home.css'

export function Home() {
  const { pet, performAction } = usePetStore()
  useDecayLoop()

  useEffect(() => {
    if (pet) savePet(pet)
  }, [pet])

  if (!pet) return null

  return (
    <div className="home">
      <div className="home-header">
        <span className="pet-name">{pet.name}</span>
        <span className="pet-level">Lv {pet.level}</span>
      </div>

      <div className="sprite-area">
        <PetSprite species={pet.species} mood={pet.mood} />
        <span className="mood-label">{pet.mood}</span>
      </div>

      <div className="stats-panel">
        <StatsBar label="Thirst" value={pet.thirst} />
        <StatsBar label="Happiness" value={pet.happiness} />
        <StatsBar label="Energy" value={pet.energy} />
        <StatsBar label="Hunger" value={pet.hunger} />
        <StatsBar label="Fear" value={pet.fear} />
        <StatsBar label="Fire" value={pet.fire} />
        <StatsBar label="Magic" value={pet.magic} />
      </div>

      <ActionButtons isAsleep={pet.isAsleep} onAction={performAction} />

      <div className="home-footer">
        <span className="pet-age">Âge : {pet.age}j</span>
        <span className="xp-label">{pet.xp} XP</span>
      </div>
    </div>
  )
}
