import type { Mood } from '../../../core/pet';
import type { ProceduralRenderer, RenderContext, RenderResult } from './types';

// Palette Dragon (Obsidian / Crimson / Flame)
const PALETTE = [
  [0, 0, 0, 0],         // 0: Transparent
  [21, 10, 10, 255],    // 1: Obsidian outline
  [69, 10, 10, 255],    // 2: Deep shadow red
  [127, 29, 29, 255],   // 3: Dark red
  [185, 28, 28, 255],   // 4: Base crimson
  [239, 68, 68, 255],   // 5: Light red
  [249, 115, 22, 255],  // 6: Flame orange highlight
  [253, 186, 116, 255]  // 7: Very bright highlight (specular)
];

const DEAD_PALETTE = [
  [0, 0, 0, 0],
  [15, 23, 42, 255],
  [30, 41, 59, 255],   
  [51, 65, 85, 255],   
  [71, 85, 105, 255],   
  [100, 116, 139, 255], 
  [148, 163, 184, 255], 
  [203, 213, 225, 255]
];

const SICK_PALETTE = [
  ...PALETTE.slice(0, 4),
  [161, 98, 7, 255],    // Muddy bronze base
  [202, 138, 4, 255],   // Sick yellow
  [253, 224, 71, 255],  // Light yellow
  [254, 240, 138, 255]
];

// Gestion des particules de fumée persistantes via une closure grossière (state outside pure render)
// It's a localized state for visual flair.
let smokeParticles: { x: number, y: number, life: number, maxLife: number, vx: number, vy: number }[] = [];

export const dragonRenderer: ProceduralRenderer = {
  getHaloColor: (mood: Mood) => {
    if (mood === 'dead') return 'rgba(148,163,184,0.15)'; 
    if (mood === 'sick') return 'rgba(202,138,4,0.15)'; 
    if (mood === 'sad') return 'rgba(239,68,68,0.1)'; 
    return 'rgba(249,115,22,0.15)'; // Flame halo
  },

  draw: ({ ctx, frame, mood, interactionProgress, interactionType, CANVAS_SIZE }: RenderContext): RenderResult => {
      let eyesStyle = 'normal';
      let emotionYOffset = 0;
      let targetPalette = PALETTE;
      
      let jumpOffset = 0;
      let shapeSquash = 0;
      let shiverX = 0;
      
      // Heavy breathing / Wing flapping
      let breath = Math.sin(frame * 0.05) * 1.5; 
      let wingAngle = Math.sin(frame * 0.2) * 0.5;

      switch (mood) {
        case 'happy':
          jumpOffset = Math.abs(Math.sin(frame * 0.08) * 6); // Fast jump
          if (jumpOffset < 2) shapeSquash = Math.abs(jumpOffset - 2) * 2; 
          eyesStyle = 'happy';
          wingAngle = Math.sin(frame * 0.4) * 0.8; // Happy fast flapping
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 6; // Collapsed
          breath = 0; 
          shapeSquash = 6; 
          wingAngle = Math.PI / 2; // Wings down
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          emotionYOffset = 2; 
          shiverX = (Math.random() - 0.5) * 2; // Heavy shivering
          breath = Math.sin(frame * 0.1) * 1; 
          shapeSquash = 2;
          wingAngle = Math.PI / 4 + Math.sin(frame * 0.05) * 0.1; // Drooping wings
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 4;
          breath = Math.sin(frame * 0.02) * 2.5; // Very deep breath
          shapeSquash = 4;
          wingAngle = Math.PI / 3;
          break;
        case 'sad':
          emotionYOffset = 3; 
          eyesStyle = 'watery';
          shapeSquash = 3; 
          breath = Math.sin(frame * 0.02) * 0.5; 
          wingAngle = Math.PI / 3;
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          const sigh = Math.max(0, Math.sin(frame * 0.02)) * 3; 
          emotionYOffset = 2 + sigh;
          shapeSquash = 2 + sigh;
          breath = 0; 
          wingAngle = 0.2;
          break;
        case 'neutral':
        default:
          break;
      }

      // --- LOGIQUE D'INTERACTION ---
      let overrideEyes: string | null = null;
      let overrideSquash = 0;
      let overrideJump = 0;
      let overrideShiver = 0;

      if (interactionProgress > 0) {
          const progress = interactionProgress;
          if (interactionType === 0) {
              overrideSquash = Math.sin(progress * Math.PI * 6) * (3 * (1-progress)); 
              overrideShiver = Math.cos(progress * Math.PI * 8) * (4 * (1-progress));
              overrideEyes = 'surprised'; 
              wingAngle = -0.5; // Wings up in surprise
          } else if (interactionType === 1) {
              if (progress < 0.3) {
                  overrideSquash = progress * 15; 
                  overrideJump = - (progress * 2); 
                  wingAngle = Math.PI / 2;
              } else {
                  const popProgress = (progress - 0.3) / 0.7;
                  overrideSquash = Math.cos(popProgress * Math.PI * 5) * (4 * (1-popProgress));
              }
              overrideEyes = 'squished';
          } else if (interactionType === 2) {
              overrideJump = Math.sin(progress * Math.PI) * 12; 
              overrideEyes = 'surprised';
              wingAngle = Math.sin(progress * Math.PI * 4) * 0.8; // frantic flapping
              if (progress > 0.1 && progress < 0.9) overrideSquash = -2;
          } else if (interactionType === 3) {
              overrideSquash = Math.sin(progress * Math.PI) * -8; 
              overrideEyes = 'happy';
              wingAngle = -0.8; // Wings fully extended
          } else if (interactionType === 4) {
              if (progress < 0.2) {
                  overrideSquash = (progress / 0.2) * 6; 
                  overrideEyes = 'closed';
              } else if (progress < 0.8) {
                  overrideSquash = 6 + Math.sin(progress * Math.PI * 10); 
                  overrideEyes = 'half-closed';
              } else {
                  overrideSquash = ((1 - progress) / 0.2) * 6; 
                  overrideEyes = 'surprised';
              }
              wingAngle = Math.PI / 2;
          } else if (interactionType === 5) {
              overrideShiver = (Math.random() - 0.5) * 6;
              overrideSquash = -1; 
              overrideEyes = 'angry';
              wingAngle = Math.sin(progress * Math.PI * 8) * 0.5; // Angry flutter
              
              // Emits lots of smoke
              if (frame % 2 === 0) {
                 smokeParticles.push({
                     x: CANVAS_SIZE/2 - 8, y: CANVAS_SIZE/2 + 4,
                     vx: -1 - Math.random(), vy: -0.5 - Math.random(),
                     life: 0, maxLife: 20 + Math.random() * 10
                 });
              }
          }
      }

      // Idle smoke emission
      if (mood !== 'dead' && mood !== 'sleeping' && interactionProgress <= 0 && Math.random() < 0.03) {
          smokeParticles.push({
             x: CANVAS_SIZE/2 - 8, y: CANVAS_SIZE/2 + 8 + emotionYOffset - jumpOffset,
             vx: -0.5 - Math.random()*0.5, vy: -0.5 - Math.random()*0.5,
             life: 0, maxLife: 30 + Math.random() * 20
         });
      }

      // Application des valeurs finales
      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver;
      const cy = CANVAS_SIZE / 2 + 16 - jumpOffset - overrideJump + emotionYOffset;
      const w = 22 + breath * 0.5 + shapeSquash + overrideSquash; 
      const h = 16 - breath - shapeSquash*0.8 - overrideSquash/2; 

      // Ombre portee
      ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
      ctx.beginPath();
      ctx.ellipse(CANVAS_SIZE / 2 + overrideShiver * 0.5, CANVAS_SIZE / 2 + 20, (22 + shapeSquash + overrideSquash) * 0.9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- WINGS ---
      const wingOriginX = cx + 8;
      const wingOriginY = cy - h * 0.6;
      ctx.fillStyle = `rgb(${targetPalette[3].slice(0,3).join(',')})`; // Darker red for wings behind
      ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.lineWidth = 1.5;
      
      const drawWing = (x: number, y: number, isRight: boolean) => {
         ctx.save();
         ctx.translate(x, y);
         const angle = isRight ? wingAngle : -wingAngle;
         ctx.rotate(angle);
         ctx.beginPath();
         // Small leathery dragon wing
         ctx.moveTo(0, 0);
         const dir = isRight ? 1 : -1;
         ctx.quadraticCurveTo(8*dir, -10, 12*dir, -12); // top edge
         ctx.quadraticCurveTo(10*dir, -4, 14*dir, 0); // outer point
         ctx.quadraticCurveTo(8*dir, 2, 4*dir, 6); // bottom edge back to body
         ctx.lineTo(0,0);
         ctx.fill();
         ctx.stroke();
         ctx.restore();
      };
      drawWing(wingOriginX, wingOriginY, true); // right wing (facing away)
      drawWing(cx + 2, wingOriginY, false); // left wing (facing camera)

      // --- MAIN BODY (Squat rounded shape) ---
      const gradBody = ctx.createRadialGradient(cx, cy, 2, cx, cy, w * 1.5);
      gradBody.addColorStop(0, `rgb(${targetPalette[5].slice(0,3).join(',')})`);
      gradBody.addColorStop(0.7, `rgb(${targetPalette[4].slice(0,3).join(',')})`);
      gradBody.addColorStop(1, `rgb(${targetPalette[2].slice(0,3).join(',')})`);

      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.beginPath(); ctx.ellipse(cx + 4, cy, w * 0.7, h, 0, 0, Math.PI * 2); ctx.fill(); // Outline body
      ctx.fillStyle = gradBody;
      ctx.beginPath(); ctx.ellipse(cx + 4, cy, w * 0.7 - 1.5, h - 1.5, 0, 0, Math.PI * 2); ctx.fill(); // Fill body

      // --- BIG HEAD ---
      const headX = cx - 6;
      const headY = cy - 4 - h * 0.2;
      const headW = 12 + overrideSquash * 0.5;
      const headH = 10 - overrideSquash * 0.5;

      // Horns
      ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`; // Flame orange horns
      ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.beginPath();
      ctx.moveTo(headX - 4, headY - headH * 0.8);
      ctx.lineTo(headX - 8, headY - headH * 1.5); // left horn tip
      ctx.lineTo(headX, headY - headH * 0.5);
      ctx.fill(); ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(headX + 4, headY - headH * 0.8);
      ctx.lineTo(headX + 6 + overrideSquash*0.5, headY - headH * 1.4); // right horn tip
      ctx.lineTo(headX + 6, headY - headH * 0.5);
      ctx.fill(); ctx.stroke();

      const gradHead = ctx.createRadialGradient(headX - 2, headY - 2, 1, headX, headY, headW * 1.5);
      gradHead.addColorStop(0, `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, 1)`); // Orange nose
      gradHead.addColorStop(0.4, `rgb(${targetPalette[5].slice(0,3).join(',')})`); // Light red
      gradHead.addColorStop(1, `rgb(${targetPalette[4].slice(0,3).join(',')})`); // Crimson

      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.beginPath(); ctx.roundRect(headX - headW, headY - headH, headW * 2 + 1.5, headH * 2 + 1.5, 4); ctx.fill();
      ctx.fillStyle = gradHead;
      ctx.beginPath(); ctx.roundRect(headX - headW, headY - headH, headW * 2, headH * 2, 4); ctx.fill();

      // DESSIN DES YEUX (Sur la tête)
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      const eyeSpacing = 4 + (overrideSquash * 0.2);
      const eyeY = headY - 2;
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 2.5, 3.5, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 0.8, 1.5, 0, 0, Math.PI*2); ctx.fill(); // Orange slit pupil
          }
          if (finalEyesStyle === 'happy') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.arc(x, y + 2, 2.5, Math.PI, Math.PI * 2);
             ctx.stroke();
          }
           if (finalEyesStyle === 'closed') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 2, y + 1, 4, 1.5); 
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 3, 2.5, isRight?-0.2:0.2, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#60a5fa';
              ctx.fillRect(x - 1, y + 2, 1.5, 2 + Math.abs(Math.sin(frame*0.05))*1.5);
          }
          if (finalEyesStyle === 'half-closed') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y + 0.5, 2.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'dead') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.font = "bold 8px monospace";
             ctx.fillText('x', x - 2.5, y + 3); 
          }
          if (finalEyesStyle === 'sick') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1;
             ctx.beginPath();
             const turn = frame * 0.05 + (isRight ? 2 : 0); 
             ctx.arc(x, y, 1.5, turn, turn + Math.PI * 1.5);
             ctx.stroke();
          }
          if (finalEyesStyle === 'angry') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x - 2, y - 2); ctx.lineTo(x + 1.5, y); 
             } else {
                 ctx.moveTo(x + 2, y - 2); ctx.lineTo(x - 1.5, y); 
             }
             ctx.stroke();
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x + (isRight?-0.5:0.5), y + 1, 1.2, 1.2, 0, 0, Math.PI*2); ctx.fill();
          }
           if (finalEyesStyle === 'surprised') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x, y - 1, 1.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'squished') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x + 2, y - 2); ctx.lineTo(x - 1, y); ctx.lineTo(x + 2, y + 2);
             } else {
                 ctx.moveTo(x - 2, y - 2); ctx.lineTo(x + 1, y); ctx.lineTo(x - 2, y + 2);
             }
             ctx.stroke();
          }
      };

      drawEye(headX - eyeSpacing, eyeY, false);
      drawEye(headX + eyeSpacing, eyeY, true);

      // --- RENDER SMOKE ---
      ctx.fillStyle = `rgba(100, 116, 139, 0.6)`; // Grey smoke
      for(let i=smokeParticles.length-1; i>=0; i--) {
          const p = smokeParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          const scale = 1 - (p.life / p.maxLife);
          // Only draw if big enough to register on 64x64 grid
          if(scale > 0) {
              const size = 1.5 + (1-scale)*3;
              ctx.beginPath(); ctx.fillRect(p.x, p.y, size, size);
          }
          if(p.life >= p.maxLife) {
             smokeParticles.splice(i, 1);
          }
      }

      return { targetPalette };
  }
};
