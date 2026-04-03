import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { usePetStore } from './petStore'
import { createPet } from '../core/pet'

beforeEach(() => {
  usePetStore.setState({
    pet: null,
    loreUnlocks: [],
    lastInteractionAt: new Date().toISOString(),
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
