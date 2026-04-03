import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MinigamesHub } from './MinigamesHub'
import { usePetStore } from '../../store/petStore'
import { createPet } from '../../core/pet'

beforeEach(() => {
  localStorage.clear()
  usePetStore.setState({ pet: createPet('u1', 'Bub', 'slime'), loreUnlocked: [] })
})

describe('MinigamesHub', () => {
  it('shows 5 plays available on first render', () => {
    render(<MinigamesHub />)
    expect(screen.getByText(/5 \/ 5/)).toBeTruthy()
  })

  it('renders both game buttons', () => {
    render(<MinigamesHub />)
    expect(screen.getByText('Mémoire')).toBeTruthy()
    expect(screen.getByText('Rythme')).toBeTruthy()
  })

  it('disables game buttons when no plays left', () => {
    localStorage.setItem('minigame_daily', JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      count: 5,
    }))
    render(<MinigamesHub />)
    const btn = screen.getByRole('button', { name: /mémoire/i })
    expect(btn).toBeDisabled()
  })

  it('navigates to memory game on click', () => {
    render(<MinigamesHub />)
    fireEvent.click(screen.getByText('Mémoire'))
    expect(screen.getByText(/moves/i)).toBeTruthy()
  })
})
