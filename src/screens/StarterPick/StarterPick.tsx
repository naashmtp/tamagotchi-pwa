import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SPECIES } from '../../core/species'
import { SpeciesId } from '../../core/pet'
import { createPet } from '../../core/pet'
import { usePetStore } from '../../store/petStore'
import { supabase, savePet } from '../../lib/supabase'
import './StarterPick.css'

const SPECIES_LIST = Object.values(SPECIES)

export function StarterPick() {
  const [selected, setSelected] = useState<SpeciesId | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const setPet = usePetStore((s) => s.setPet)
  const navigate = useNavigate()

  async function handleConfirm() {
    if (!selected || !name.trim()) return
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const pet = createPet(data.user.id, name.trim(), selected)
    await savePet(pet)
    setPet(pet)
    navigate('/home')
  }

  return (
    <div className="starter-pick">
      <h1 className="starter-title">Choisis ton compagnon</h1>
      <div className="starter-eggs">
        {SPECIES_LIST.map((sp) => (
          <button
            key={sp.id}
            className={`egg-card${selected === sp.id ? ' selected' : ''}`}
            onClick={() => setSelected(sp.id)}
          >
            <div className="egg-visual" style={{ background: sp.eggColor }} />
            <span className="egg-name">{sp.name}</span>
          </button>
        ))}
      </div>

      {selected && (
        <p className="egg-hint">{SPECIES[selected].eggHint}</p>
      )}

      {selected && (
        <div className="starter-form">
          <input
            className="name-input"
            placeholder="Donne-lui un nom..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <button
            className="confirm-btn"
            disabled={!name.trim() || loading}
            onClick={handleConfirm}
          >
            {loading ? '...' : 'Confirmer'}
          </button>
        </div>
      )}
    </div>
  )
}
