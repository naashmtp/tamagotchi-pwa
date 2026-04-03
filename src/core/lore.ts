import type { PetState, SpeciesId } from './pet'

export interface LoreEntry {
  chapterIndex: number
  title: string
  text: string
  triggerLevel: number
}

export const LORE: Record<SpeciesId, LoreEntry[]> = {
  slime: [
    { chapterIndex: 0, triggerLevel: 1,  title: 'Naissance',       text: "Une masse verte et douce émerge de l'œuf. Elle absorbe déjà tout ce qui l'entoure, curieuse du monde." },
    { chapterIndex: 1, triggerLevel: 5,  title: 'Premières formes', text: "Le Slime apprend à se mouvoir. Chaque surface est une invitation. Sa couleur change légèrement selon ce qu'il absorbe." },
    { chapterIndex: 2, triggerLevel: 10, title: "L'Absorption",     text: "Un Slime adulte peut absorber n'importe quelle substance et en extraire l'essence nutritive. Un don rare dans ce monde." },
  ],
  ghost: [
    { chapterIndex: 0, triggerLevel: 1,  title: 'Éveil',      text: "L'œuf translucide s'ouvre sans bruit. Le Ghost n'a pas besoin de manger — il se nourrit de présence." },
    { chapterIndex: 1, triggerLevel: 5,  title: 'La peur',    text: "Sans attention, la peur du Ghost grandit. Mais une main tendue dans l'obscurité suffit à la dissiper." },
    { chapterIndex: 2, triggerLevel: 10, title: 'Le passage', text: "Un Ghost pleinement développé peut traverser les murs. Il n'est jamais vraiment là — sauf pour toi." },
  ],
  dragon: [
    { chapterIndex: 0, triggerLevel: 1,  title: 'Éclosion ardente', text: "L'œuf explose dans un souffle chaud. Le Dragon regarde le monde avec des yeux de braise." },
    { chapterIndex: 1, triggerLevel: 5,  title: 'Le feu intérieur', text: "Sa flamme intérieure doit rester vive. L'inactivité l'éteint lentement. Il a besoin d'action." },
    { chapterIndex: 2, triggerLevel: 10, title: 'Maîtrise',         text: "Le Dragon adulte canalise son feu. Il ne détruit plus — il forge. Chaque souffle est une création." },
  ],
  fairy: [
    { chapterIndex: 0, triggerLevel: 1,  title: 'Scintillement',      text: "La Fairy sort de l'œuf en laissant une trace lumineuse. Elle rit — un son comme des clochettes." },
    { chapterIndex: 1, triggerLevel: 5,  title: 'La magie du bonheur', text: "Quand la Fairy est heureuse, sa magie déborde et touche ceux qui l'entourent. Sa joie est contagieuse." },
    { chapterIndex: 2, triggerLevel: 10, title: 'Pleine puissance',   text: "Une Fairy épanouie peut toucher d'autres créatures et les réconforter à distance. Un don pour les temps qui viennent." },
  ],
  golem: [
    { chapterIndex: 0, triggerLevel: 1,  title: 'Éveil lent',  text: "Le Golem s'extrait de l'œuf calmement, sans hâte. Il a attendu longtemps. Il peut attendre encore." },
    { chapterIndex: 1, triggerLevel: 5,  title: 'La patience', text: "Le Golem médite. Son énergie se reconstitue de l'intérieur. Il n'a besoin de presque rien — sauf de temps." },
    { chapterIndex: 2, triggerLevel: 10, title: 'Fondation',   text: "Un Golem adulte est une fondation. Immuable. Ses besoins sont minimes mais sa présence, absolue." },
  ],
}

export function checkLoreTriggers(pet: PetState, alreadyUnlocked: number[]): number[] {
  return LORE[pet.species]
    .filter((e) => pet.level >= e.triggerLevel && !alreadyUnlocked.includes(e.chapterIndex))
    .map((e) => e.chapterIndex)
}
