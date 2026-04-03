import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Auth } from './Auth'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

describe('Auth screen', () => {
  it('renders email, password inputs and submit button', () => {
    render(<Auth />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument()
  })

  it('calls signInWithPassword on submit', async () => {
    const { supabase } = await import('../../lib/supabase')
    const user = userEvent.setup()
    render(<Auth />)
    await user.type(screen.getByPlaceholderText(/email/i), 'nash@test.com')
    await user.type(screen.getByPlaceholderText(/mot de passe/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /connexion/i }))
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'nash@test.com',
      password: 'secret123',
    })
  })
})
