import { describe, it, expect, vi, beforeEach } from 'vitest'
import { playSound, setSoundEnabled, isSoundEnabled } from './sound'

const mockOscillator = {
  connect: vi.fn(),
  type: '',
  frequency: { setValueAtTime: vi.fn() },
  start: vi.fn(),
  stop: vi.fn(),
}
const mockGain = {
  connect: vi.fn(),
  gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
}
const mockCtx = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {},
  currentTime: 0,
}

vi.stubGlobal('AudioContext', vi.fn(() => mockCtx))

beforeEach(() => {
  vi.clearAllMocks()
  setSoundEnabled(true)
})

describe('sound', () => {
  it('plays feed sound without throwing', () => {
    expect(() => playSound('feed')).not.toThrow()
  })

  it('does not play when sound is disabled', () => {
    setSoundEnabled(false)
    playSound('feed')
    expect(mockCtx.createOscillator).not.toHaveBeenCalled()
  })

  it('isSoundEnabled returns current state', () => {
    setSoundEnabled(false)
    expect(isSoundEnabled()).toBe(false)
    setSoundEnabled(true)
    expect(isSoundEnabled()).toBe(true)
  })

  it('plays all sound types without throwing', () => {
    const types = ['feed', 'drink', 'play', 'hug', 'levelup', 'sweetspot'] as const
    types.forEach(t => expect(() => playSound(t)).not.toThrow())
  })
})
