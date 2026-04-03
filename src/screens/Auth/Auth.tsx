import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Auth.css'

export function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    if (!error) setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-screen">
        <p className="auth-sent">Vérifie ta boîte mail pour le lien de connexion !</p>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <h1 className="auth-title">🥚 Tamagotchi</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? '...' : 'Connexion'}
        </button>
      </form>
    </div>
  )
}
