const STORAGE_KEY = 'sound_enabled'

let _enabled = localStorage.getItem(STORAGE_KEY) !== 'false'
let _ctx: AudioContext | null = null

export function isSoundEnabled(): boolean { return _enabled }

export function setSoundEnabled(value: boolean): void {
  _enabled = value
  localStorage.setItem(STORAGE_KEY, String(value))
}

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}

function beep(frequency: number, duration: number, type: OscillatorType = 'square', gain = 0.12): void {
  if (!_enabled) return
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gainNode = c.createGain()
    osc.connect(gainNode)
    gainNode.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, c.currentTime)
    gainNode.gain.setValueAtTime(gain, c.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch { /* AudioContext unavailable (SSR, test, blocked) */ }
}

const SOUNDS: Record<string, () => void> = {
  feed:      () => beep(440, 0.10, 'square'),
  drink:     () => beep(600, 0.08, 'sine'),
  play:      () => { beep(523, 0.06, 'square'); setTimeout(() => beep(659, 0.06, 'square'), 80) },
  hug:       () => beep(330, 0.15, 'sine'),
  levelup:   () => [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'square', 0.2), i * 100)),
  sweetspot: () => beep(880, 0.05, 'sine', 0.08),
}

export function playSound(type: keyof typeof SOUNDS): void {
  SOUNDS[type]?.()
}
