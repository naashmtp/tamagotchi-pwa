import type { Mood } from '../../../core/pet';
import type { ProceduralRenderer, RenderContext, RenderResult } from './types';

// Palette Fairy (Fuchsia / Magenta / Gold)
const PALETTE = [
  [0, 0, 0, 0],         // 0: Transparent
  [67, 20, 7, 255],     // 1: Dark brown/fuchsia outline
  [131, 24, 67, 255],   // 2: Deep shadow magenta
  [190, 24, 93, 255],   // 3: Dark pink
  [219, 39, 119, 255],  // 4: Base pink
  [244, 114, 182, 255], // 5: Light pink
  [253, 224, 71, 255],  // 6: Gold highlight
  [255, 255, 255, 255]  // 7: Pure white (specular)
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
  [134, 239, 172, 255], // Sickly pale green replacing base pink
  [187, 247, 208, 255], 
  [220, 252, 231, 255],  
  [255, 255, 255, 255]
];

// Gold sparkle trails logic
let sparkles: { x: number, y: number, life: number, maxLife: number }[] = [];

export const fairyRenderer: ProceduralRenderer = {
  getHaloColor: (mood: Mood) => {
    if (mood === 'dead') return 'rgba(148,163,184,0.15)'; 
    if (mood === 'sick') return 'rgba(134,239,172,0.15)'; 
    if (mood === 'sad') return 'rgba(190,24,93,0.1)'; 
    return 'rgba(219,39,119,0.25)'; // Pink glow
  },

  draw: ({ ctx, frame, mood, interactionProgress, interactionType, CANVAS_SIZE }: RenderContext): RenderResult => {
      let eyesStyle = 'normal';
      let emotionYOffset = 0;
      let targetPalette = PALETTE;
      
      let jumpOffset = 0;
      let shapeSquash = 0;
      let shiverX = 0;
      
      // Fairy motion is a fast figure 8
      let floatY = Math.sin(frame * 0.1) * 4; 
      let floatX = Math.sin(frame * 0.05) * 6; // Wide swing
      let breath = Math.sin(frame * 0.2) * 1; 

      switch (mood) {
        case 'happy':
          floatY = Math.sin(frame * 0.2) * 6;  // Very hyper
          floatX = Math.sin(frame * 0.1) * 8; 
          eyesStyle = 'happy';
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 18; // Drop to the floor
          floatY = 0; floatX = 0;
          breath = 0; 
          shapeSquash = 6; 
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          floatY = Math.sin(frame * 0.02) * 1; // Very weak floating
          floatX = Math.sin(frame * 0.01) * 2;
          shiverX = (Math.random() - 0.5) * 2; 
          breath = Math.sin(frame * 0.3) * 0.5; // frantic shallow breathing
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 12; // Resting on the ground somewhat
          floatY = Math.sin(frame * 0.02) * 2;
          floatX = 0;
          breath = Math.sin(frame * 0.02) * 1.5; 
          break;
        case 'sad':
          emotionYOffset = 8; // Drooping
          eyesStyle = 'watery';
          floatY = Math.sin(frame * 0.03) * 2; 
          floatX = Math.sin(frame * 0.015) * 3;
          breath = Math.sin(frame * 0.02) * 0.5; 
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          emotionYOffset = 2;
          floatY = Math.sin(frame * 0.02) * 2;
          floatX = Math.sin(frame * 0.01) * 2;
          breath = 0.5; 
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
              overrideSquash = Math.sin(progress * Math.PI * 8) * (2 * (1-progress)); 
              overrideShiver = Math.cos(progress * Math.PI * 10) * (3 * (1-progress));
              overrideEyes = 'surprised'; 
          } else if (interactionType === 1) {
              if (progress < 0.3) {
                  overrideSquash = progress * 10; 
              } else {
                  const popProgress = (progress - 0.3) / 0.7;
                  overrideSquash = Math.cos(popProgress * Math.PI * 6) * (3 * (1-popProgress));
              }
              overrideEyes = 'squished';
          } else if (interactionType === 2) {
               // Darts up and around fast
              overrideJump = Math.sin(progress * Math.PI) * 25; 
              overrideShiver = Math.sin(progress * Math.PI * 8) * 4;
              overrideEyes = 'surprised';
          } else if (interactionType === 3) {
              overrideSquash = Math.sin(progress * Math.PI) * -6; 
              overrideEyes = 'happy';
          } else if (interactionType === 4) {
              if (progress < 0.2) {
                  overrideSquash = (progress / 0.2) * 5; 
                  overrideEyes = 'closed';
              } else if (progress < 0.8) {
                  overrideSquash = 5 + Math.sin(progress * Math.PI * 12); 
                  overrideEyes = 'half-closed';
              } else {
                  overrideSquash = ((1 - progress) / 0.2) * 5; 
                  overrideEyes = 'surprised';
              }
          } else if (interactionType === 5) { // Fairy angry is a static buzzing
              overrideShiver = (Math.random() - 0.5) * 8;
              overrideJump = (Math.random() - 0.5) * 8;
              overrideEyes = 'angry';
          }
      }

      // Add trail sparkles
      if (mood !== 'dead' && mood !== 'sleeping' && (Math.abs(floatX) > 2 || Math.abs(floatY) > 2 || interactionProgress > 0)) {
           if (frame % 3 === 0) {
              sparkles.push({
                 x: CANVAS_SIZE / 2 + floatX,
                 y: CANVAS_SIZE / 2 + 8 + floatY - overrideJump,
                 life: 0,
                 maxLife: 15 + Math.random() * 10
              });
           }
      }

      // Application des valeurs finales
      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver + floatX;
      const cy = CANVAS_SIZE / 2 + 8 - jumpOffset - overrideJump + emotionYOffset + floatY;
      const coreR = 6 + breath + shapeSquash*0.5 + overrideSquash*0.5;

      // Ombre portee
      if (mood !== 'dead') {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.15)'; // Very light shadow
          ctx.beginPath();
          const shadowSize = Math.max(0, 10 * (1 - (cy - CANVAS_SIZE/2)/20));
          ctx.ellipse(cx, CANVAS_SIZE / 2 + 20, shadowSize, shadowSize * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
      } else {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 4, 12, 2, 0, 0, Math.PI * 2);
          ctx.fill();
      }

      // --- WINGS (Butterfly style) ---
      ctx.fillStyle = `rgb(${targetPalette[5].slice(0,3).join(',')})`; // Light pink
      ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.lineWidth = 1.5;
      
      const wingFlap = Math.sin(frame * 0.4) * 6; // Wings flap fast

      const drawFairyWing = (x: number, y: number, isRight: boolean) => {
         const dir = isRight ? 1 : -1;
         const flapTarget = isRight ? -wingFlap : wingFlap;
         
         ctx.beginPath();
         ctx.moveTo(x, y);
         // Upper wing
         ctx.bezierCurveTo(x + 12*dir + flapTarget, y - 16, x + 24*dir + flapTarget, y - 8, x + 18*dir + flapTarget, y + 4);
         ctx.lineTo(x, y + 2);
         // Lower wing
         ctx.bezierCurveTo(x + 12*dir + flapTarget, y + 16, x + 6*dir + flapTarget, y + 18, x, y + 8);
         ctx.fill();
         ctx.stroke();
         
         // Inner pattern
         ctx.fillStyle = `rgb(${targetPalette[3].slice(0,3).join(',')})`;
         ctx.beginPath();
         ctx.ellipse(x + 10*dir + flapTarget*0.5, y - 6, 3, 5, isRight ? 0.5 : -0.5, 0, Math.PI*2);
         ctx.fill();
      };
      
      if (mood !== 'dead') {
          drawFairyWing(cx, cy, true);
          drawFairyWing(cx, cy, false);
      }

      // --- CORE BODY ---
      const gradBody = ctx.createRadialGradient(cx, cy, 1, cx, cy, coreR * 1.5);
      gradBody.addColorStop(0, `rgb(${targetPalette[6].slice(0,3).join(',')})`); // Gold inner
      gradBody.addColorStop(0.5, `rgb(${targetPalette[5].slice(0,3).join(',')})`); // Light Pink
      gradBody.addColorStop(1, `rgb(${targetPalette[4].slice(0,3).join(',')})`);

      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.beginPath(); ctx.ellipse(cx, cy, coreR+1.5, coreR*1.2+1.5, 0, 0, Math.PI * 2); ctx.fill(); // Outline 
      ctx.fillStyle = gradBody;
      ctx.beginPath(); ctx.ellipse(cx, cy, coreR, coreR*1.2, 0, 0, Math.PI * 2); ctx.fill();

      // DESSIN DES YEUX (Fairy has tiny dot eyes)
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      const eyeSpacing = 2.5 + (overrideSquash * 0.1);
      const eyeY = cy - 1;
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 1.5, 2, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'happy') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             ctx.arc(x, y + 1, 1.5, Math.PI, Math.PI * 2);
             ctx.stroke();
          }
           if (finalEyesStyle === 'closed') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 1.5, y + 1, 3, 1); 
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 2, 1.5, isRight?-0.2:0.2, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#60a5fa';
              ctx.fillRect(x - 0.5, y + 1, 1, 1.5 + Math.abs(Math.sin(frame*0.05))*1);
          }
          if (finalEyesStyle === 'half-closed') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y + 0.5, 1.5, 1, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'dead') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.font = "bold 7px monospace";
             ctx.fillText('x', x - 2, y + 2.5); 
          }
          if (finalEyesStyle === 'sick') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1;
             ctx.beginPath();
             ctx.arc(x, y, 1, 0, Math.PI * 2);
             ctx.stroke();
          }
          if (finalEyesStyle === 'angry') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x - 1.5, y - 1); ctx.lineTo(x + 1, y); 
             } else {
                 ctx.moveTo(x + 1.5, y - 1); ctx.lineTo(x - 1, y); 
             }
             ctx.stroke();
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x, y + 0.5, 1, 1, 0, 0, Math.PI*2); ctx.fill();
          }
           if (finalEyesStyle === 'surprised') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x, y - 1, 1, 1, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'squished') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x + 1.5, y - 1.5); ctx.lineTo(x - 1, y); ctx.lineTo(x + 1.5, y + 1.5);
             } else {
                 ctx.moveTo(x - 1.5, y - 1.5); ctx.lineTo(x + 1, y); ctx.lineTo(x - 1.5, y + 1.5);
             }
             ctx.stroke();
          }
      };

      drawEye(cx - eyeSpacing, eyeY, false);
      drawEye(cx + eyeSpacing, eyeY, true);

      // --- RENDER SPARKLES ---
      ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`; // Gold
      for(let i=sparkles.length-1; i>=0; i--) {
          const p = sparkles[i];
          p.life++;
          const scale = 1 - (p.life / p.maxLife);
          if(scale > 0) {
              const size = 1 + scale; // Tiny 1-2px dots
              ctx.beginPath(); ctx.fillRect(p.x, p.y + Math.sin(p.life*0.5), size, size);
          }
          if(p.life >= p.maxLife) {
             sparkles.splice(i, 1);
          }
      }

      return { targetPalette };
  }
};
