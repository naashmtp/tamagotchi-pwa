import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { usePetStore } from './petStore'
import { createPet } from '../core/pet'

beforeEach(() => {
  usePetStore.setState({
    pet: null,
    loreUnlocks: [],
    lastInteractionAt: new Date().toISOString(),
    consecutiveHugs: 0,
    lastHugAt: null,
  })
})

describe('petStore', () => {
  it('setPet stores a pet', () => {
    const pet = createPet('u1', 'Blobby', 'slime')
    act(() => usePetStore.getState().setPet(pet))
    expect(usePetStore.getState().pet?.name).toBe('Blobby')
  })

  it('performAction feed increases hunger', () => {
    const pet = createPet('u1', 'Blobby', 'slime')
    act(() => usePetStore.getState().setPet(pet))
    act(() => usePetStore.getState().performAction('feed'))
    expect(usePetStore.getState().pet?.hunger).toBe(100)
  })

  it('performAction updates lastInteractionAt', () => {
    const before = new Date().toISOString()
    const pet = createPet('u1', 'Blobby', 'slime')
    act(() => usePetStore.getState().setPet(pet))
    act(() => usePetStore.getState().performAction('play'))
    expect(usePetStore.getState().lastInteractionAt >= before).toBe(true)
  })

  it('unlockLore adds chapter', () => {
    act(() => usePetStore.getState().unlockLore(1))
    expect(usePetStore.getState().loreUnlocks).toContain(1)
  })

  it('unlockLore does not add duplicates', () => {
    act(() => usePetStore.getState().unlockLore(1))
    act(() => usePetStore.getState().unlockLore(1))
    expect(usePetStore.getState().loreUnlocks).toHaveLength(1)
  })
})

describe('performAction returns ActionResult', () => {
  it('returns action name and xpGained', () => {
    usePetStore.setState({ pet: createPet('u', 'T', 'slime'), loreUnlocks: [], consecutiveHugs: 0, lastHugAt: null })
    const result = usePetStore.getState().performAction('drink')
    expect(result.action).toBe('drink')
    expect(result.xpGained).toBeGreaterThan(0)
  })

  it('returns hugSaturated true after 3 quick hugs', () => {
    usePetStore.setState({ pet: createPet('u', 'T', 'slime'), loreUnlocks: [], consecutiveHugs: 3, lastHugAt: new Date().toISOString() })
    const result = usePetStore.getState().performAction('hug')
    expect(result.hugSaturated).toBe(true)
  })

  it('does not change pet on saturated hug', () => {
    const pet = createPet('u', 'T', 'slime')
    usePetStore.setState({ pet, loreUnlocks: [], consecutiveHugs: 3, lastHugAt: new Date().toISOString() })
    usePetStore.getState().performAction('hug')
    expect(usePetStore.getState().pet?.happiness).toBe(pet.happiness)
  })

  it('detects overindulgence on overfed', () => {
    const pet = { ...createPet('u', 'T', 'slime'), hunger: 92 }
    usePetStore.setState({ pet, loreUnlocks: [], consecutiveHugs: 0, lastHugAt: null })
    const result = usePetStore.getState().performAction('feed')
    expect(result.overindulgence).toBe(true)
  })
})
