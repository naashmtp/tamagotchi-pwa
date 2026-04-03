import { useState, useEffect } from 'react'
import './Minigames.css'

interface Props {
  onWin: (score: number) => void
  onLose: () => void
}

const EMOJIS = ['🌸', '⭐', '🍄', '💎', '🔥', '🌙']

function buildDeck(): string[] {
  const pairs = [...EMOJIS, ...EMOJIS]
  return pairs.sort(() => Math.random() - 0.5)
}

export function MemoryGame({ onWin, onLose }: Props) {
  const [deck, setDeck] = useState<string[]>(() => buildDeck())
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (matched.size === deck.length) {
      const score = Math.max(10, 50 - moves * 2)
      onWin(score)
    }
  }, [matched])

  function handleFlip(i: number) {
    if (locked || flipped.includes(i) || matched.has(i)) return
    const next = [...flipped, i]
    setFlipped(next)

    if (next.length === 2) {
      setMoves((m) => m + 1)
      setLocked(true)
      setTimeout(() => {
        if (deck[next[0]] === deck[next[1]]) {
          setMatched((prev) => new Set([...prev, next[0], next[1]]))
        }
        setFlipped([])
        setLocked(false)
      }, 700)
    }
  }

  return (
    <div className="minigame-container">
      <p className="minigame-subtitle">Moves: {moves}</p>
      <div className="memory-grid">
        {deck.map((emoji, i) => {
          const visible = flipped.includes(i) || matched.has(i)
          return (
            <button
              key={i}
              className={`memory-card${visible ? ' revealed' : ''}${matched.has(i) ? ' matched' : ''}`}
              onClick={() => handleFlip(i)}
            >
              {visible ? emoji : '?'}
            </button>
          )
        })}
      </div>
      <button className="minigame-quit" onClick={onLose}>Abandon</button>
    </div>
  )
}
