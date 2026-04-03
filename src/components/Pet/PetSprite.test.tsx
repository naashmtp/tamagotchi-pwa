import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PetSprite } from './PetSprite'

describe('PetSprite', () => {
  it('applies correct mood class', () => {
    const { container } = render(<PetSprite species="slime" mood="happy" />)
    expect(container.firstChild).toHaveClass('mood-happy')
  })

  it('applies correct species class', () => {
    const { container } = render(<PetSprite species="ghost" mood="neutral" />)
    expect(container.firstChild).toHaveClass('species-ghost')
  })

  it('sets species color as CSS variable', () => {
    const { container } = render(<PetSprite species="dragon" mood="neutral" />)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--species-color')).toBe('#e87e7e')
  })

  it('renders pet-sprite base class', () => {
    const { container } = render(<PetSprite species="slime" mood="neutral" />)
    expect(container.firstChild).toHaveClass('pet-sprite')
  })
})
