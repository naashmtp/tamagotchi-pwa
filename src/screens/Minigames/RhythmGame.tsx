import { useState, useEffect, useCallback } from 'react'
import './Minigames.css'

interface Props {
  onWin: (score: number) => void
  onLose: () => void
}

const SEQUENCE_LENGTH = 5
const KEYS = ['A', 'B', 'C', 'D'] as const
type Key = typeof KEYS[number]

function randomSequence(): Key[] {
  return Array.from({ length: SEQUENCE_LENGTH }, () => KEYS[Math.floor(Math.random() * KEYS.length)])
}

type Phase = 'showing' | 'input' | 'result'

export function RhythmGame({ onWin, onLose }: Props) {
  const [sequence] = useState<Key[]>(randomSequence)
  const [shown, setShown] = useState<number>(-1) // index currently highlighted
  const [input, setInput] = useState<Key[]>([])
  const [phase, setPhase] = useState<Phase>('showing')

  useEffect(() => {
    if (phase !== 'showing') return
    let i = 0
    const id = setInterval(() => {
      setShown(i)
      i++
      if (i >= sequence.length) {
        clearInterval(id)
        setTimeout(() => { setShown(-1); setPhase('input') }, 500)
      }
    }, 700)
    return () => clearInterval(id)
  }, [phase])

  const handleKey = useCallback((key: Key) => {
    if (phase !== 'input') return
    const next = [...input, key]
    const pos = next.length - 1
    if (sequence[pos] !== key) {
      onLose()
      return
    }
    if (next.length === sequence.length) {
      onWin(30)
      return
    }
    setInput(next)
  }, [phase, input, sequence, onWin, onLose])

  return (
    <div className="minigame-container">
      <p className="minigame-subtitle">
        {phase === 'showing' ? 'Mémorise la séquence...' : 'Répète la séquence !'}
      </p>
      <div className="rhythm-sequence">
        {sequence.map((k, i) => (
          <div
            key={i}
            className={`rhythm-dot${shown === i ? ' active' : ''}${phase === 'input' && i < input.length ? ' done' : ''}`}
          />
        ))}
      </div>
      <div className="rhythm-keys">
        {KEYS.map((k) => (
          <button
            key={k}
            className="rhythm-key"
            disabled={phase !== 'input'}
            onClick={() => handleKey(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <button className="minigame-quit" onClick={onLose}>Abandon</button>
    </div>
  )
}
