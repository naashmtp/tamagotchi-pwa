import type { Mood } from '../../../core/pet';
import type { ProceduralRenderer, RenderContext, RenderResult } from './types';

// Palette Ghost (Indigo / Violet / Cyan)
const PALETTE = [
  [0, 0, 0, 0],         // 0: Transparent
  [23, 10, 48, 255],    // 1: Dark Indigo Outline
  [39, 15, 84, 255],    // 2: Deep shadow purple
  [68, 25, 148, 255],   // 3: Dark purple
  [109, 40, 217, 255],  // 4: Base Violet
  [124, 58, 237, 255],  // 5: Light Violet
  [167, 139, 250, 255], // 6: Highlight Lilac
  [216, 180, 254, 255]  // 7: Very bright highlight (specular)
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
  [14, 116, 144, 255],  // Cyan sick base
  [6, 182, 212, 255],   // Light cyan
  [103, 232, 249, 255], // Highlight sick
  [207, 250, 254, 255]
];

export const ghostRenderer: ProceduralRenderer = {
  getHaloColor: (mood: Mood) => {
    if (mood === 'dead') return 'rgba(148,163,184,0.15)'; 
    if (mood === 'sick') return 'rgba(6,182,212,0.15)'; 
    if (mood === 'sad') return 'rgba(56,189,248,0.15)'; 
    return 'rgba(139,92,246,0.2)'; // Base violet halo
  },

  draw: ({ ctx, frame, mood, interactionProgress, interactionType, CANVAS_SIZE }: RenderContext): RenderResult => {
      let eyesStyle = 'normal';
      let emotionYOffset = 0;
      let targetPalette = PALETTE;
      
      let jumpOffset = 0;
      let shapeSquash = 0;
      let shiverX = 0;
      
      // Floating animation specific to ghost
      let floatY = Math.sin(frame * 0.03) * 3; 
      // Ghost breath is very subtle pulsing width
      let breath = Math.sin(frame * 0.02) * 1.5; 

      switch (mood) {
        case 'happy':
          floatY = Math.sin(frame * 0.06) * 5; 
          eyesStyle = 'happy';
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 5; 
          floatY = 0; 
          breath = -2;
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          floatY = Math.sin(frame * 0.02) * 1.5;
          shiverX = (Math.random() - 0.5) * 1.5;
          breath = 0;
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 1;
          floatY = Math.sin(frame * 0.015) * 1.5;
          breath = Math.sin(frame * 0.01) * 2; 
          break;
        case 'sad':
          emotionYOffset = 2; 
          eyesStyle = 'watery';
          floatY = Math.sin(frame * 0.015) * 1; 
          breath = -1;
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          const sigh = Math.max(0, Math.sin(frame * 0.02)) * 2; 
          emotionYOffset = 1 + sigh;
          floatY = Math.sin(frame * 0.01) * 2;
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
              overrideSquash = Math.sin(progress * Math.PI * 6) * (2 * (1-progress)); 
              overrideShiver = Math.cos(progress * Math.PI * 8) * (8 * (1-progress));
              overrideEyes = 'surprised'; 
          } else if (interactionType === 1) {
              if (progress < 0.3) {
                  overrideSquash = progress * 15; 
                  overrideJump = - (progress * 2); 
              } else {
                  const popProgress = (progress - 0.3) / 0.7;
                  overrideSquash = Math.cos(popProgress * Math.PI * 5) * (4 * (1-popProgress));
              }
              overrideEyes = 'squished';
          } else if (interactionType === 2) {
              overrideJump = Math.sin(progress * Math.PI) * 20; // High ghost jump
              overrideEyes = 'surprised';
          } else if (interactionType === 3) {
              overrideSquash = Math.sin(progress * Math.PI) * -8; 
              overrideJump = Math.sin(progress * Math.PI) * 4;
              overrideEyes = 'happy';
          } else if (interactionType === 4) {
              if (progress < 0.2) {
                  overrideSquash = (progress / 0.2) * 5; 
                  overrideEyes = 'closed';
              } else if (progress < 0.8) {
                  overrideSquash = 5 + Math.sin(progress * Math.PI * 8) * 2; 
                  overrideEyes = 'half-closed';
              } else {
                  overrideSquash = ((1 - progress) / 0.2) * 5; 
                  overrideEyes = 'surprised';
              }
          } else if (interactionType === 5) {
              overrideShiver = (Math.random() - 0.5) * 5;
              overrideSquash = -3; 
              overrideEyes = 'angry';
          }
      }

      // Application des valeurs finales
      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver;
      // Ghost is naturally a bit higher
      const cy = CANVAS_SIZE / 2 + 8 - jumpOffset - overrideJump + emotionYOffset + floatY;
      const w = 15 + breath + shapeSquash + overrideSquash; 
      const h = 22 - shapeSquash - overrideSquash/2; 

      // Ombre portee (Ghost shadow is smaller/softer, except when dead)
      if (mood !== 'dead') {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
          ctx.beginPath();
          // Shadow size scales inversely with floatY (higher = smaller shadow)
          const shadowSize = Math.max(0, (15 + shapeSquash + overrideSquash) * (1 - (floatY + overrideJump + jumpOffset) / 30));
          ctx.ellipse(CANVAS_SIZE / 2 + overrideShiver * 0.2, CANVAS_SIZE / 2 + 20, shadowSize, 2, 0, 0, Math.PI * 2);
          ctx.fill();
      } else {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
          ctx.beginPath();
          ctx.ellipse(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20, (15 + shapeSquash) * 0.9, 3, 0, 0, Math.PI * 2);
          ctx.fill();
      }

      // Draw Ghost Shape
      const drawGhostBody = (x: number, y: number, width: number, height: number) => {
          ctx.beginPath();
          ctx.moveTo(x, y - height);
          ctx.bezierCurveTo(x + width, y - height, x + width, y + height * 0.5, x + width * 0.8, y + height);
          
          // Wavy bottom edge
          const waveCount = 3;
          const waveWidth = (width * 1.6) / waveCount;
          for (let i = 0; i < waveCount; i++) {
              const wx = x + width * 0.8 - (i * waveWidth);
              const isUp = i % 2 !== 0;
              // Animated waves
              const waveAnim = Math.sin(frame * 0.1 + i) * 2;
              ctx.quadraticCurveTo(
                  wx - waveWidth / 2, 
                  y + height + (isUp ? 4 : -2) + waveAnim,
                  wx - waveWidth, 
                  y + height + waveAnim * 0.5
              );
          }

          ctx.bezierCurveTo(x - width, y + height * 0.5, x - width, y - height, x, y - height);
          ctx.closePath();
      };

      const grad = ctx.createRadialGradient(cx - 4, cy - 6, 2, cx, cy + 4, w * 1.5);
      grad.addColorStop(0, `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, 1)`); 
      grad.addColorStop(0.3, `rgb(${targetPalette[5].slice(0,3).join(',')})`);
      grad.addColorStop(0.7, `rgb(${targetPalette[4].slice(0,3).join(',')})`);
      grad.addColorStop(1, `rgb(${targetPalette[2].slice(0,3).join(',')})`);

      // Outline
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      drawGhostBody(cx, cy, w + 1.5, h + 1.5);
      ctx.fill();

      // Interieur
      ctx.fillStyle = grad;
      drawGhostBody(cx, cy, w, h);
      ctx.fill();
      
      // Magic core / Soul gem (smaller for ghost)
      ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`;
      ctx.beginPath();
      if (mood !== 'dead') {
         ctx.ellipse(cx, cy + h*0.2, w * 0.15, h * 0.1, 0, 0, Math.PI * 2);
         ctx.fill();
      }

      // DESSIN DES YEUX (Ghosts have big hollow eyes usually)
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      const eyeSpacing = 6 + (overrideSquash * 0.2);
      const eyeY = cy - 4 + emotionYOffset;
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 3, 5, isRight?0.1:-0.1, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`; // Glowing pupil
              ctx.beginPath(); ctx.ellipse(x, y - 1, 1, 1.5, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'happy') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2.5;
             ctx.beginPath();
             ctx.arc(x, y + 2, 3, Math.PI, Math.PI * 2);
             ctx.stroke();
          }
          if (finalEyesStyle === 'closed') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 2.5, y + 2, 5, 2); 
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 3.5, 4, isRight?-0.2:0.2, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#60a5fa'; // Blue tear
              ctx.fillRect(x - 1, y + 2, 2, 3 + Math.abs(Math.sin(frame*0.05))*2);
          }
          if (finalEyesStyle === 'half-closed') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y + 1, 3, 3, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`; 
              ctx.fillRect(x - 4, y - 4, 8, 5); 
          }
          if (finalEyesStyle === 'dead') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.font = "bold 9px monospace";
             ctx.fillText('x', x - 3, y + 3); 
          }
          if (finalEyesStyle === 'sick') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             const turn = frame * 0.05 + (isRight ? 2 : 0); 
             ctx.arc(x, y, 2, turn, turn + Math.PI * 1.5);
             ctx.stroke();
          }
          if (finalEyesStyle === 'angry') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x - 2, y - 2); ctx.lineTo(x + 1.5, y + 0.5); 
             } else {
                 ctx.moveTo(x + 2, y - 2); ctx.lineTo(x - 1.5, y + 0.5); 
             }
             ctx.stroke();
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x + (isRight?-0.5:0.5), y + 1.5, 1.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'surprised') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x, y - 1, 2, 3, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'squished') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x + 2, y - 2); ctx.lineTo(x - 1, y); ctx.lineTo(x + 2, y + 2);
             } else {
                 ctx.moveTo(x - 2, y - 2); ctx.lineTo(x + 1, y); ctx.lineTo(x - 2, y + 2);
             }
             ctx.stroke();
          }
      };

      drawEye(cx - eyeSpacing, eyeY, false);
      drawEye(cx + eyeSpacing, eyeY, true);

      return { targetPalette };
  }
};
