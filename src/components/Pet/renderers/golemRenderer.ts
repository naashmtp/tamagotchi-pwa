import type { Mood } from '../../../core/pet';
import type { ProceduralRenderer, RenderContext, RenderResult } from './types';

// Palette Golem (Granite / Slate / Azure Chrome)
const PALETTE = [
  [0, 0, 0, 0],         // 0: Transparent
  [15, 23, 42, 255],    // 1: Very dark slate outline
  [30, 41, 59, 255],    // 2: Deep shadow grey (Inner crack/shade)
  [51, 65, 85, 255],    // 3: Dark slate (Back stones)
  [71, 85, 105, 255],   // 4: Base slate grey (Main stones)
  [148, 163, 184, 255], // 5: Light slate (Highlights)
  [56, 189, 248, 255],  // 6: Azure core (Bright Blue magical inner)
  [186, 230, 253, 255]  // 7: Very light blue (Magic specular)
];

const DEAD_PALETTE = [
  ...PALETTE.slice(0, 6),
  [71, 85, 105, 255],   // Dead core (matches base slate, lost its magic entirely)
  [100, 116, 139, 255]  // Dead specular
];

const SICK_PALETTE = [
  ...PALETTE.slice(0, 6),
  [20, 184, 166, 255], // Sick core (Toxic Teal)
  [94, 234, 212, 255]
];

// Polygones hardcodés pour la stabilité (évite les tremblements liés au Math.random inter-frames)
const SHAPES = {
    head: [[-4,-6], [4,-6], [5,-1], [3,5], [-3,5], [-5,-1]],
    shoulderL: [[0,-1], [4,-3], [7,0], [6,5], [1,6], [-2,3]], 
    shoulderR: [[0,-1], [-4,-3], [-7,0], [-6,5], [-1,6], [2,3]], // Mirrored concept, drawn centered
    bodyTop: [[-7,-6], [7,-6], [9,-1], [5,6], [-5,6], [-9,-1]],
    bodyBottom: [[-5,-3], [5,-3], [6,3], [2,5], [-2,5], [-6,3]],
    handL: [[-2,-3], [3,-4], [4,2], [0,4], [-3,1]],
    handR: [[2,-3], [-3,-4], [-4,2], [0,4], [3,1]],
    legL: [[-3,-4], [3,-3], [4,5], [1,7], [-2,6], [-4,1]],
    legR: [[3,-4], [-3,-3], [-4,5], [-1,7], [2,6], [4,1]]
};

let magicSparks: { x: number, y: number, life: number, type: number }[] = [];

export const golemRenderer: ProceduralRenderer = {
  getHaloColor: (mood: Mood) => {
    if (mood === 'dead') return 'rgba(0,0,0,0)'; 
    if (mood === 'sick') return 'rgba(20,184,166,0.1)'; 
    if (mood === 'sad') return 'rgba(56,189,248,0.05)'; 
    return 'rgba(56,189,248,0.15)'; // Azure blue glow
  },

  draw: ({ ctx, frame, mood, interactionProgress, interactionType, CANVAS_SIZE }: RenderContext): RenderResult => {
      let eyesStyle = 'normal';
      let emotionYOffset = 0;
      let targetPalette = PALETTE;
      
      let jumpOffset = 0;
      let globalShake = 0;
      let armDroop = 0; // Arms slide down relative to center
      let coreFlicker = false; // Core sputters
      
      // Floating offset for breath
      let breathY = Math.sin(frame * 0.05) * 1.5;
      let expansion = 1.0; // Distance multiplier between pieces
      let coreGlow = 1.0 + Math.sin(frame * 0.1) * 0.2;

      switch (mood) {
        case 'happy':
          eyesStyle = 'happy';
          expansion = 1.3 + Math.sin(frame * 0.1) * 0.1; // Roches écartées et dansantes
          coreGlow = 1.8 + Math.sin(frame * 0.15) * 0.4;
          if (frame % 60 < 20) {
             jumpOffset = Math.sin((frame%60)/20 * Math.PI) * 6; // Lourd saut joyeux
             armDroop = -4; // Lève les poings
          }
           // Spawns happy energy sparks
          if (frame % 10 === 0) {
             magicSparks.push({ x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20, life: 0, type: 0 });
          }
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          expansion = 0; // Se désassemble au sol
          breathY = 0;
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          globalShake = (Math.random() - 0.5) * 2; // Frissons constants
          expansion = 0.8 + Math.random() * 0.2; // Perte de cohésion spatiale (les roches se rentrent dedans / glissent)
          breathY = Math.sin(frame * 0.03) * 0.5; // Souffle très faible
          coreFlicker = Math.random() > 0.7; // Le noyau grésille par intermittence
          if (coreFlicker) coreGlow = 0.2; // Diminution abrupte de la lumière
          armDroop = 6; // Bras pendants d'épuisement
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 6; // Tête totalement enfouie
          expansion = 0.5; // Rétractation maximale (mode bouclier / boule de pierre)
          breathY = Math.sin(frame * 0.015) * 2.5; // Respiration ample et profonde
          coreGlow = 0.5 + Math.sin(frame * 0.015) * 0.2; // Cœur couve doucement
          jumpOffset = -4; // Le corps s'affaisse vers le sol
          break;
        case 'sad':
          emotionYOffset = 4; // Tête penchée en avant
          eyesStyle = 'watery';
          expansion = 0.85; // Repli sur soi
          armDroop = 10; // Poings qui traînent presque par terre
          coreGlow = 0.3; // Presque éteint
          breathY = Math.sin(frame * 0.02) * 1.0; // Souffle lent et lourd
          jumpOffset = -2; // Posture affaissée
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          emotionYOffset = 2;
          expansion = 0.95;
          armDroop = (frame % 200 > 150) ? 4 : 0; // Lâche les bras périodiquement
          coreGlow = 0.8;
          break;
        case 'neutral':
        default:
          break;
      }

      // --- LOGICS INTERACTIONS ---
      let overrideEyes: string | null = null;
      let meltFactor = 0; // Si > 0, les pierres tombent au sol (tas de gravats)

      if (interactionProgress > 0) {
          const progress = interactionProgress;
          if (interactionType === 0) {
              // Wobble (Tremblement de terre)
              globalShake = Math.cos(progress * Math.PI * 15) * (3 * (1-progress));
              overrideEyes = 'surprised'; 
              expansion = 1.0 + Math.sin(progress * Math.PI)*0.2;
          } else if (interactionType === 1) {
              // Squish (Compactage de défense extreme)
              if (progress < 0.2) {
                  expansion = 1.0 - (progress/0.2)*0.5; // Rétractation à 0.5
              } else {
                  expansion = 0.5 + ((progress-0.2)/0.8)*0.5;
              }
              overrideEyes = 'squished';
              jumpOffset = -2;
          } else if (interactionType === 2) {
              // Jump (Saut très lourd)
              jumpOffset = Math.sin(progress * Math.PI) * 12; 
              overrideEyes = 'surprised';
              // A l'apogée, les pierres s'écartent par manque de gravité
              expansion = 1.0 + Math.sin(progress * Math.PI)*0.4;
          } else if (interactionType === 3) {
              // Stretch (Démantèlement magique)
              expansion = 1.0 + Math.sin(progress * Math.PI) * 1.5; 
              overrideEyes = 'happy';
              globalShake = (Math.random()-0.5)*1; // Vibre d'énergie
              coreGlow = 2.0;
          } else if (interactionType === 4) {
              // Melt (Effondrement en tas de pierres)
              if (progress < 0.2) {
                  meltFactor = (progress / 0.2);
                  overrideEyes = 'surprised';
              } else if (progress < 0.8) {
                  meltFactor = 1;
                  overrideEyes = 'closed';
              } else {
                  meltFactor = 1 - ((progress - 0.8) / 0.2);
                  overrideEyes = 'half-closed';
              }
          } else if (interactionType === 5) {
              // Shake/Angry (Charge du Golem)
              expansion = 1.3;
              globalShake = (Math.random() - 0.5) * 4;
              overrideEyes = 'angry';
              coreGlow = 1.5 + Math.random();
              
              // Spawns angry energy sparks
              if (frame % 2 === 0) {
                 magicSparks.push({
                    x: (Math.random() - 0.5) * 25,
                    y: (Math.random() - 0.5) * 25,
                    life: 0,
                    type: Math.floor(Math.random() * 3)
                 });
              }
          }
      }

      // Si mort, effondrement permanent
      if (mood === 'dead') meltFactor = 1.0;

      // Base Center
      const cx = CANVAS_SIZE / 2 + globalShake;
      const cy = CANVAS_SIZE / 2 + 10 - jumpOffset + (interactionType === 1 ? 4 : 0); // Légèrement plus bas de base

      // Ombre portee
      ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
      ctx.beginPath();
      // L'ombre rétrécit au saut, s'élargit à l'effondrement
      const shadowW = 16 - jumpOffset*0.5 + meltFactor*8;
      ctx.ellipse(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 22, shadowW, shadowW * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- POSITIONS DES ROCHES (Relatives au centre, avant expansion) ---
      // [x, y, wobble speed, driftX, driftY]
      const PARAMS = {
          head:       { tgt: [0, -18 + emotionYOffset],   w: 0.08,  floor: [0, 16] },
          shoulderL:  { tgt: [-12, -8],                  w: 0.11,  floor: [-14, 18] },
          shoulderR:  { tgt: [12, -8],                   w: 0.09,  floor: [14, 18] },
          bodyTop:    { tgt: [0, -6 + breathY*0.5],       w: 0.07,  floor: [0, 10] },
          bodyBottom: { tgt: [0, 4 - breathY*0.3],        w: 0.08,  floor: [-2, 14] },
          handL:      { tgt: [-16, 2 + breathY*1.5 + armDroop],     w: 0.13,  floor: [-20, 20] },
          handR:      { tgt: [16, 2 + breathY*1.5 + armDroop],      w: 0.12,  floor: [20, 20] },
          legL:       { tgt: [-6, 12],                   w: 0.0,   floor: [-8, 20] },
          legR:       { tgt: [6, 12],                    w: 0.0,   floor: [8, 20] }
      };

      const drawRock = (shape: number[][], partKey: keyof typeof PARAMS, baseColor: string, isBack: boolean = false) => {
          const conf = PARAMS[partKey];
          
          // Calcul des positions dynamiques
          const normalX = conf.tgt[0] * expansion;
          const normalY = conf.tgt[1] * expansion + (partKey.startsWith('leg') ? 0 : breathY);
          
          // Interpolation vers l'effondrement (Melt / Dead)
          const finalX = normalX * (1 - meltFactor) + conf.floor[0] * meltFactor;
          const finalY = normalY * (1 - meltFactor) + conf.floor[1] * meltFactor;
          
          // Petit flottement autonome (micro gravité)
          // Neutralisé aux jambes et effondrement
          const driftMul = (1 - meltFactor) * (partKey.startsWith('leg') ? 0.2 : 1.0);
          const fX = finalX + Math.sin(frame * conf.w) * 1.5 * driftMul;
          const fY = finalY + Math.cos(frame * conf.w * 0.8) * 1.5 * driftMul;
          
          // Rotation aléatoire liée à la position si effondré, ou expansion
          const rotPhase = (conf.floor[0] * 0.1) * meltFactor + (interactionType === 3 ? conf.tgt[0]*0.02 * (expansion-1) : 0);

          ctx.save();
          ctx.translate(cx + fX, cy + fY);
          ctx.rotate(rotPhase);

          // Couleurs
          ctx.fillStyle = baseColor;
          ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`; // Outline
          ctx.lineWidth = 1.5;
          ctx.lineJoin = 'bevel';

          // Tracer le polygone
          ctx.beginPath();
          ctx.moveTo(shape[0][0], shape[0][1]);
          for(let i=1; i<shape.length; i++) {
              ctx.lineTo(shape[i][0], shape[i][1]);
          }
          ctx.closePath();
          ctx.fill(); ctx.stroke();

          // Highlight / Texture Line (fake 3D bevel)
          // Draw a line from pt 0 to pt 2 for a cracked facet look
          if (shape.length > 3) {
             ctx.strokeStyle = isBack ? `rgb(${targetPalette[2].slice(0,3).join(',')})` : `rgb(${targetPalette[5].slice(0,3).join(',')})`;
             ctx.lineWidth = 1;
             ctx.beginPath();
             ctx.moveTo(shape[0][0], shape[0][1]);
             ctx.lineTo(shape[2][0], shape[2][1]);
             ctx.stroke();
          }

          ctx.restore();
          
          return { x: cx + fX, y: cy + fY }; // Renvoyer position finale pour lier avec énergie
      };

      // --- RENDU DANS L'ORDRE DE PROFONDEUR (Z-INDEX) ---
      const colorBack = `rgb(${targetPalette[3].slice(0,3).join(',')})`;
      const colorBase = `rgb(${targetPalette[4].slice(0,3).join(',')})`;

      // 1. BACK ROCKS (Bras arrière, épaules)
      const pHandL = drawRock(SHAPES.handL, 'handL', colorBack, true);
      const pHandR = drawRock(SHAPES.handR, 'handR', colorBack, true);
      drawRock(SHAPES.shoulderL, 'shoulderL', colorBack, true);
      drawRock(SHAPES.shoulderR, 'shoulderR', colorBack, true);
      const pLegL = drawRock(SHAPES.legL, 'legL', colorBase);
      const pLegR = drawRock(SHAPES.legR, 'legR', colorBase);

      // 2. MAGICAL ENERGY CORE & CONNECTIONS
      const pChest = PARAMS.bodyTop.tgt[1] * expansion * (1-meltFactor) + PARAMS.bodyTop.floor[1] * meltFactor;
      const coreX = cx;
      const coreY = cy + pChest + 2;

      // Draw energy links if expanding (Stretch interaction or happy jump)
      if (expansion > 1.1 && meltFactor === 0 && mood !== 'dead') {
          ctx.strokeStyle = `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, ${0.5 * (expansion-1)})`;
          ctx.lineWidth = 1 + Math.random();
          ctx.beginPath();
          ctx.moveTo(coreX, coreY); ctx.lineTo(pHandL.x, pHandL.y);
          ctx.moveTo(coreX, coreY); ctx.lineTo(pHandR.x, pHandR.y);
          ctx.moveTo(coreX, coreY); ctx.lineTo(cx, cy - 18 * expansion); // To head
          ctx.stroke();
      }

      // Draw Magic Core (Glow + Center)
      if (mood !== 'dead' && meltFactor < 0.8 && (!coreFlicker || Math.random() > 0.3)) {
          // Glow
          const glowRad = 6 * coreGlow * (1 - meltFactor);
          const grd = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, glowRad);
          grd.addColorStop(0, `rgba(${targetPalette[7][0]}, ${targetPalette[7][1]}, ${targetPalette[7][2]}, 0.8)`);
          grd.addColorStop(0.5, `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, 0.5)`);
          grd.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(coreX, coreY, glowRad, 0, Math.PI*2); ctx.fill();
          
          // Core Diamond
          ctx.fillStyle = `rgb(${targetPalette[7].slice(0,3).join(',')})`;
          ctx.beginPath();
          ctx.moveTo(coreX, coreY - 3*(1-meltFactor));
          ctx.lineTo(coreX + 2*(1-meltFactor), coreY);
          ctx.lineTo(coreX, coreY + 3*(1-meltFactor));
          ctx.lineTo(coreX - 2*(1-meltFactor), coreY);
          ctx.fill();
      }

      // 3. FRONT ROCKS (Torse, Bas, Tête)
      drawRock(SHAPES.bodyTop, 'bodyTop', colorBase);
      drawRock(SHAPES.bodyBottom, 'bodyBottom', colorBase);
      
      const headPos = drawRock(SHAPES.head, 'head', colorBase);

      // --- YEUX SUR LA TÊTE MAGIQUE ---
      // Les yeux se dessinent sur les coordonnées finales de la tête
      if (meltFactor === 0) { // On ferme/cache les yeux s'il est un tas de pierre complet (ou presque)
          const eyeSpacing = 2.5;
          const eyeYLoc = headPos.y + 1; // Au milieu du polygone tête
          const headX = headPos.x;
          
          const finalEyesStyle = overrideEyes || eyesStyle;
          const eyeColor = `rgb(${targetPalette[6].slice(0,3).join(',')})`; // Les yeux brillent comme l'énergie vitale

          const drawEye = (x: number, y: number, isRight: boolean) => {
              if (finalEyesStyle === 'normal') {
                  ctx.fillStyle = eyeColor;
                  ctx.fillRect(x - 0.5, y - 1, 1, 2);
              }
              if (finalEyesStyle === 'happy') {
                 ctx.strokeStyle = eyeColor;
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.moveTo(x - 1, y); ctx.lineTo(x, y - 1); ctx.lineTo(x + 1, y);
                 ctx.stroke();
              }
               if (finalEyesStyle === 'closed') {
                 ctx.fillStyle = `rgb(${targetPalette[2].slice(0,3).join(',')})`; // Gris terne, éteint
                 ctx.fillRect(x - 1, y, 2, 1);
              }
              if (finalEyesStyle === 'watery') {
                  ctx.fillStyle = eyeColor;
                  ctx.fillRect(x - 0.5, y - 1, 1, 2);
                  ctx.fillStyle = `rgba(${targetPalette[7][0]}, ${targetPalette[7][1]}, ${targetPalette[7][2]}, 0.8)`;
                  ctx.fillRect(x - 0.5, y + 1, 1, 1 + Math.abs(Math.sin(frame*0.1)));
              }
              if (finalEyesStyle === 'half-closed') {
                  ctx.fillStyle = eyeColor;
                  ctx.fillRect(x - 0.5, y, 1, 1);
              }
              if (finalEyesStyle === 'dead') {
                 ctx.strokeStyle = `rgb(${targetPalette[2].slice(0,3).join(',')})`;
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.moveTo(x - 1, y - 1); ctx.lineTo(x + 1, y + 1);
                 ctx.moveTo(x + 1, y - 1); ctx.lineTo(x - 1, y + 1);
                 ctx.stroke();
              }
              if (finalEyesStyle === 'sick') {
                 ctx.fillStyle = eyeColor;
                 ctx.fillRect(x - 0.5, y - 0.5 + Math.random(), 1, 1);
              }
              if (finalEyesStyle === 'angry') {
                 ctx.strokeStyle = eyeColor;
                 ctx.lineWidth = 1.2;
                 ctx.beginPath();
                 if (!isRight) {
                     ctx.moveTo(x - 1.5, y - 1); ctx.lineTo(x + 0.5, y + 0.5); 
                 } else {
                     ctx.moveTo(x + 1.5, y - 1); ctx.lineTo(x - 0.5, y + 0.5); 
                 }
                 ctx.stroke();
              }
               if (finalEyesStyle === 'surprised') {
                 ctx.fillStyle = eyeColor;
                 ctx.beginPath(); ctx.ellipse(x, y, 1, 1.5, 0, 0, Math.PI*2); ctx.fill();
              }
              if (finalEyesStyle === 'squished') {
                 ctx.fillStyle = eyeColor;
                 ctx.fillRect(x - 1.5, y, 3, 0.5);
              }
          };

          drawEye(headX - eyeSpacing, eyeYLoc, false);
          drawEye(headX + eyeSpacing, eyeYLoc, true);
      }

      // --- EFFETS SPECIAUX DE PARTICULES ---
      // Utilisé seulement pour l'humeur Angry / Interaction
      for(let i=magicSparks.length-1; i>=0; i--) {
          const p = magicSparks[i];
          p.life++;
          if (p.life > 10) {
              magicSparks.splice(i, 1);
              continue;
          }
          const alpha = 1 - (p.life / 10);
          ctx.strokeStyle = `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, ${alpha})`;
          ctx.lineWidth = 1;
          
          const px = coreX + p.x;
          const py = coreY + p.y;
          
          ctx.beginPath();
          if (p.type === 0) {
             ctx.moveTo(px, py - 4); ctx.lineTo(px, py + 4);
             ctx.moveTo(px - 4, py); ctx.lineTo(px + 4, py);
          } else {
             ctx.moveTo(px - 2, py - 2); ctx.lineTo(px + 2, py + 2);
             ctx.moveTo(px + 2, py - 2); ctx.lineTo(px - 2, py + 2);
          }
          ctx.stroke();
      }

      return { targetPalette };
  }
};

