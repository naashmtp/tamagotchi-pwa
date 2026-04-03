import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StarterPick } from './StarterPick'
import { usePetStore } from '../../store/petStore'

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) } },
  savePet: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

beforeEach(() => {
  usePetStore.setState({ pet: null, loreUnlocked: [] })
})

describe('StarterPick', () => {
  it('renders 5 species eggs', () => {
    render(<StarterPick />)
    expect(screen.getByText('Slime')).toBeTruthy()
    expect(screen.getByText('Ghost')).toBeTruthy()
    expect(screen.getByText('Dragon')).toBeTruthy()
    expect(screen.getByText('Fairy')).toBeTruthy()
    expect(screen.getByText('Golem')).toBeTruthy()
  })

  it('shows egg hint when egg selected', () => {
    render(<StarterPick />)
    fireEvent.click(screen.getByText('Slime'))
    expect(screen.getByText(/gélatineux/)).toBeTruthy()
  })

  it('shows name input after selecting a species', () => {
    render(<StarterPick />)
    fireEvent.click(screen.getByText('Dragon'))
    expect(screen.getByPlaceholderText(/nom/i)).toBeTruthy()
  })

  it('confirm button disabled when name empty', () => {
    render(<StarterPick />)
    fireEvent.click(screen.getByText('Slime'))
    const btn = screen.getByRole('button', { name: /confirmer|adopt/i })
    expect(btn).toBeDisabled()
  })
})
