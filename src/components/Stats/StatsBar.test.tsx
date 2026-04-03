import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsBar } from './StatsBar'

describe('StatsBar', () => {
  it('renders label', () => {
    render(<StatsBar label="Thirst" value={60} />)
    expect(screen.getByText('Thirst')).toBeTruthy()
  })

  it('fills bar proportionally', () => {
    const { container } = render(<StatsBar label="Hunger" value={40} />)
    const fill = container.querySelector('.stats-bar-fill') as HTMLElement
    expect(fill.style.width).toBe('40%')
  })

  it('applies low class when value < 25', () => {
    const { container } = render(<StatsBar label="Energy" value={20} />)
    expect(container.querySelector('.stats-bar-fill')).toHaveClass('low')
  })

  it('does not apply low class when value >= 25', () => {
    const { container } = render(<StatsBar label="Energy" value={50} />)
    expect(container.querySelector('.stats-bar-fill')).not.toHaveClass('low')
  })

  it('renders nothing when value is null', () => {
    const { container } = render(<StatsBar label="Hunger" value={null} />)
    expect(container.firstChild).toBeNull()
  })
})
