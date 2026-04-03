import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Home } from './Home'
import { usePetStore } from '../../store/petStore'
import { createPet } from '../../core/pet'

vi.mock('../../lib/supabase', () => ({
  savePet: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../hooks/useDecayLoop', () => ({
  useDecayLoop: vi.fn(),
}))

const testPet = createPet('u1', 'Bubbles', 'slime')

beforeEach(() => {
  usePetStore.setState({ pet: { ...testPet }, loreUnlocked: [] })
})

describe('Home', () => {
  it('renders pet name', () => {
    render(<Home />)
    expect(screen.getByText('Bubbles')).toBeTruthy()
  })

  it('renders stat bars', () => {
    render(<Home />)
    expect(screen.getByText(/thirst/i)).toBeTruthy()
    expect(screen.getByText(/happiness/i)).toBeTruthy()
  })

  it('renders action buttons', () => {
    render(<Home />)
    expect(screen.getByRole('button', { name: /feed/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /play/i })).toBeTruthy()
  })

  it('calls performAction when Feed clicked', () => {
    const performAction = vi.fn()
    usePetStore.setState({ pet: { ...testPet }, loreUnlocked: [], performAction } as any)
    render(<Home />)
    fireEvent.click(screen.getByRole('button', { name: /feed/i }))
    expect(performAction).toHaveBeenCalledWith('feed')
  })
})
