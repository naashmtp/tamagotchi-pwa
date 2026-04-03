import { useState } from 'react'
import { usePetStore } from '../../store/petStore'
import { getPlaysLeft, recordPlay } from '../../hooks/useMinigameCap'
import { MemoryGame } from './MemoryGame'
import { RhythmGame } from './RhythmGame'
import './Minigames.css'

type Screen = 'hub' | 'memory' | 'rhythm' | 'result'

interface ResultState {
  won: boolean
  score: number
}

export function MinigamesHub() {
  const [screen, setScreen] = useState<Screen>('hub')
  const [result, setResult] = useState<ResultState | null>(null)
  const [playsLeft, setPlaysLeft] = useState(() => getPlaysLeft())
  const performAction = usePetStore((s) => s.performAction)

  function startGame(game: 'memory' | 'rhythm') {
    if (playsLeft <= 0) return
    setScreen(game)
  }

  function handleWin(score: number) {
    recordPlay()
    setPlaysLeft(getPlaysLeft())
    performAction('play')
    setResult({ won: true, score })
    setScreen('result')
  }

  function handleLose() {
    recordPlay()
    setPlaysLeft(getPlaysLeft())
    setResult({ won: false, score: 0 })
    setScreen('result')
  }

  if (screen === 'memory') {
    return <MemoryGame onWin={handleWin} onLose={handleLose} />
  }

  if (screen === 'rhythm') {
    return <RhythmGame onWin={handleWin} onLose={handleLose} />
  }

  if (screen === 'result' && result) {
    return (
      <div className="minigame-result">
        <h2>{result.won ? 'Bravo !' : 'Dommage...'}</h2>
        {result.won && <p>+{result.score} XP · ton compagnon est content !</p>}
        {!result.won && <p>Ton compagnon te regarde avec pitié.</p>}
        <p className="minigames-cap">{playsLeft} partie(s) restante(s) aujourd&apos;hui</p>
        <button className="result-btn" onClick={() => setScreen('hub')}>Retour</button>
      </div>
    )
  }

  return (
    <div className="minigames-hub">
      <h1 className="minigames-title">Mini-jeux</h1>
      <p className="minigames-cap">{playsLeft} / 5 parties aujourd&apos;hui</p>
      <div className="minigames-list">
        <button
          className="minigame-entry"
          disabled={playsLeft <= 0}
          onClick={() => startGame('memory')}
        >
          <div className="minigame-entry-name">Mémoire</div>
          <div className="minigame-entry-desc">Retrouve les paires avant d&apos;oublier.</div>
        </button>
        <button
          className="minigame-entry"
          disabled={playsLeft <= 0}
          onClick={() => startGame('rhythm')}
        >
          <div className="minigame-entry-name">Rythme</div>
          <div className="minigame-entry-desc">Répète la séquence de boutons.</div>
        </button>
      </div>
    </div>
  )
}
