import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ActionButtons } from './ActionButtons'

describe('ActionButtons', () => {
  it('calls onAction with feed when Feed button clicked', () => {
    const onAction = vi.fn()
    render(<ActionButtons isAsleep={false} onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: /feed/i }))
    expect(onAction).toHaveBeenCalledWith('feed')
  })

  it('calls onAction with sleep when Sleep button clicked', () => {
    const onAction = vi.fn()
    render(<ActionButtons isAsleep={false} onAction={onAction} />)
    fireEvent.click(screen.getByRole('button', { name: /sleep/i }))
    expect(onAction).toHaveBeenCalledWith('sleep')
  })

  it('shows Wake button when pet is asleep', () => {
    render(<ActionButtons isAsleep={true} onAction={vi.fn()} />)
    expect(screen.getByRole('button', { name: /wake/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /sleep/i })).toBeNull()
  })

  it('disables action buttons when pet is asleep', () => {
    render(<ActionButtons isAsleep={true} onAction={vi.fn()} />)
    const feedBtn = screen.getByRole('button', { name: /feed/i })
    expect(feedBtn).toBeDisabled()
  })
})
