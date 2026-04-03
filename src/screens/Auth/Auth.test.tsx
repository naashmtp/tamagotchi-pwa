import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Auth } from './Auth'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

describe('Auth screen', () => {
  it('renders email input and submit button', () => {
    render(<Auth />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument()
  })

  it('shows confirmation after submit', async () => {
    const user = userEvent.setup()
    render(<Auth />)
    await user.type(screen.getByPlaceholderText(/email/i), 'nash@test.com')
    await user.click(screen.getByRole('button', { name: /connexion/i }))
    expect(await screen.findByText(/vérifie ta boîte mail/i)).toBeInTheDocument()
  })
})
