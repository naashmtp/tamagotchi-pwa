import { usePetStore } from '../../store/petStore'
import { LORE } from '../../core/lore'
import './Journal.css'

export function Journal() {
  const { pet, loreUnlocked } = usePetStore()

  if (!pet) return null

  const chapters = LORE[pet.species]

  return (
    <div className="journal">
      <h1 className="journal-title">Journal</h1>
      <p className="journal-subtitle">{pet.name} — {pet.species}</p>
      <div className="journal-chapters">
        {chapters.map((chapter) => {
          const unlocked = loreUnlocked.includes(chapter.chapterIndex)
          return (
            <div
              key={chapter.chapterIndex}
              className={`journal-entry${unlocked ? ' unlocked' : ' locked'}`}
            >
              <div className="journal-entry-header">
                <span className="journal-chapter-num">Ch. {chapter.chapterIndex + 1}</span>
                <span className="journal-chapter-title">
                  {unlocked ? chapter.title : '???'}
                </span>
                <span className="journal-trigger">Nv. {chapter.triggerLevel}</span>
              </div>
              {unlocked && (
                <p className="journal-entry-text">{chapter.text}</p>
              )}
              {!unlocked && (
                <p className="journal-entry-locked">Atteins le niveau {chapter.triggerLevel} pour débloquer.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
