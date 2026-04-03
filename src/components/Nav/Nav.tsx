import { NavLink } from 'react-router-dom'
import './Nav.css'

export function Nav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/home">🏠</NavLink>
      <NavLink to="/minigames">🎮</NavLink>
      <NavLink to="/journal">📖</NavLink>
      <NavLink to="/profile">👤</NavLink>
    </nav>
  )
}
