import { usePetStore } from '../../store/petStore'
import { supabase } from '../../lib/supabase'
import { SPECIES } from '../../core/species'
import './Profile.css'

const EVOLUTION_LABELS = ['Œuf', 'Bébé', 'Jeune', 'Adulte']

export function Profile() {
  const { pet } = usePetStore()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (!pet) return null

  const sp = SPECIES[pet.species]

  return (
    <div className="profile">
      <h1 className="profile-title">Profil</h1>

      <div className="profile-card">
        <div className="profile-egg" style={{ background: sp.eggColor }} />
        <div className="profile-info">
          <p className="profile-pet-name">{pet.name}</p>
          <p className="profile-species">{sp.name} · {EVOLUTION_LABELS[pet.evolutionStage]}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-label">Niveau</span>
          <span className="profile-stat-val">{pet.level}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">XP</span>
          <span className="profile-stat-val">{pet.xp}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">Âge</span>
          <span className="profile-stat-val">{pet.age}j</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">Humeur</span>
          <span className="profile-stat-val">{pet.mood}</span>
        </div>
      </div>

      <button className="signout-btn" onClick={handleSignOut}>
        Se déconnecter
      </button>
    </div>
  )
}
