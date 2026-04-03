import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, loadPet, loadLoreUnlocks } from './lib/supabase'
import { usePetStore } from './store/petStore'
import { Auth } from './screens/Auth/Auth'
import { StarterPick } from './screens/StarterPick/StarterPick'
import { Home } from './screens/Home/Home'
import { MinigamesHub } from './screens/Minigames/MinigamesHub'
import { Journal } from './screens/Journal/Journal'
import { Profile } from './screens/Profile/Profile'
import { Nav } from './components/Nav/Nav'
import './App.css'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { pet, setPet, unlockLore } = usePetStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return
    loadPet(session.user.id).then((p) => { if (p) setPet(p) })
    loadLoreUnlocks(session.user.id).then((chapters) => chapters.forEach(unlockLore))
  }, [session])

  if (loading) return <div className="app-loading">...</div>
  if (!session) return <Auth />

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to={pet ? '/home' : '/starter'} replace />} />
          <Route path="/starter" element={<StarterPick />} />
          <Route path="/home" element={<Home />} />
          <Route path="/minigames" element={<MinigamesHub />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        {pet && <Nav />}
      </div>
    </BrowserRouter>
  )
}
