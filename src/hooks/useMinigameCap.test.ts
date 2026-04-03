import { describe, it, expect, beforeEach } from 'vitest'
import { getPlaysLeft, recordPlay } from './useMinigameCap'

beforeEach(() => {
  localStorage.clear()
})

describe('useMinigameCap', () => {
  it('starts with 5 plays available', () => {
    expect(getPlaysLeft()).toBe(5)
  })

  it('decrements after recording a play', () => {
    recordPlay()
    expect(getPlaysLeft()).toBe(4)
  })

  it('reaches 0 after 5 plays', () => {
    for (let i = 0; i < 5; i++) recordPlay()
    expect(getPlaysLeft()).toBe(0)
  })

  it('resets when date changes', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    localStorage.setItem('minigame_daily', JSON.stringify({ date: yesterday, count: 5 }))
    expect(getPlaysLeft()).toBe(5)
  })
})
