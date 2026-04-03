import type { Mood } from '../../../core/pet';
import type { ProceduralRenderer, RenderContext, RenderResult } from './types';

// Palette Golem (Granite / Slate / Azure Chrome)
const PALETTE = [
  [0, 0, 0, 0],         // 0: Transparent
  [15, 23, 42, 255],    // 1: Very dark slate outline
  [30, 41, 59, 255],    // 2: Deep shadow grey
  [51, 65, 85, 255],    // 3: Dark slate
  [71, 85, 105, 255],   // 4: Base slate grey
  [100, 116, 139, 255], // 5: Light slate
  [56, 189, 248, 255],  // 6: Azure core (Bright Blue)
  [255, 255, 255, 255]  // 7: Pure white (specular)
];

const DEAD_PALETTE = [
  ...PALETTE.slice(0, 6),
  [71, 85, 105, 255],   // Dead core (matches base slate, lost its magic entirely)
  [100, 116, 139, 255]
];

const SICK_PALETTE = [
  ...PALETTE.slice(0, 6),
  [20, 184, 166, 255], // Sick core (Teal)
  [94, 234, 212, 255]
];

export const golemRenderer: ProceduralRenderer = {
  getHaloColor: (mood: Mood) => {
    if (mood === 'dead') return 'rgba(0,0,0,0)'; // Dead golem has no aura
    if (mood === 'sick') return 'rgba(20,184,166,0.1)'; 
    if (mood === 'sad') return 'rgba(56,189,248,0.05)'; 
    return 'rgba(56,189,248,0.15)'; // Azure blue glow
  },

  draw: ({ ctx, frame, mood, interactionProgress, interactionType, CANVAS_SIZE }: RenderContext): RenderResult => {
      let eyesStyle = 'normal';
      let emotionYOffset = 0;
      let targetPalette = PALETTE;
      
      let jumpOffset = 0;
      let shiverX = 0;
      
      // Golem is extremely rigid. Breathing is just a slow pulse of the core and a 1px shift every very long frame.
      let breathY = 0;
      if (frame % 240 < 120 && mood !== 'dead') {
          breathY = 1; // Chest heaves 1 pixel up very slowly
      }

      switch (mood) {
        case 'happy':
          eyesStyle = 'happy';
          if (frame % 60 < 10) jumpOffset = 2; // Tiny hop
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 8; // Crumbled
          breathY = 0;
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          shiverX = (Math.random() - 0.5) * 1; 
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 4; // Hunched
          if (frame % 400 < 200) breathY = 1; 
          break;
        case 'sad':
          emotionYOffset = 3; 
          eyesStyle = 'watery';
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          emotionYOffset = 1;
          break;
        case 'neutral':
        default:
          break;
      }

      // --- LOGIQUE D'INTERACTION ---
      let overrideEyes: string | null = null;
      let overrideJump = 0;
      let overrideShiver = 0;
      let armRaise = 0;

      if (interactionProgress > 0) {
          const progress = interactionProgress;
          if (interactionType === 0) {
              // Wobble => Earthquake shake instead of squash
              overrideShiver = Math.cos(progress * Math.PI * 12) * (2 * (1-progress));
              overrideEyes = 'surprised'; 
          } else if (interactionType === 1) {
              // Squish => Braces for impact, sinks down slightly
              if (progress < 0.3) {
                  overrideJump = -1;
                  armRaise = 4;
              } else {
                  armRaise = 4 * (1 - (progress - 0.3) / 0.7);
              }
               overrideEyes = 'squished';
          } else if (interactionType === 2) {
              // Jump => Very heavy slow jump
              overrideJump = Math.sin(progress * Math.PI) * 8; 
              overrideEyes = 'surprised';
              armRaise = Math.sin(progress * Math.PI) * 6; // Throws arms up to jump
          } else if (interactionType === 3) {
              // Stretch => Grows slightly by separating rocks
              overrideJump = Math.sin(progress * Math.PI) * 4; 
              emotionYOffset = Math.sin(progress * Math.PI) * -4; // Head goes up
              overrideEyes = 'happy';
              armRaise = Math.sin(progress * Math.PI) * 10;
          } else if (interactionType === 4) {
              // Melt => Crumbles down
              if (progress < 0.2) {
                  emotionYOffset = (progress / 0.2) * 5; 
                  overrideEyes = 'closed';
              } else if (progress < 0.8) {
                  emotionYOffset = 5; 
                  overrideEyes = 'half-closed';
              } else {
                  emotionYOffset = ((1 - progress) / 0.2) * 5; 
                  overrideEyes = 'surprised';
              }
          } else if (interactionType === 5) {
              overrideShiver = (Math.random() - 0.5) * 3;
              armRaise = 8; // Arms raised menacingly
              overrideEyes = 'angry';
          }
      }

      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver;
      const cy = CANVAS_SIZE / 2 + 16 - jumpOffset - overrideJump;

      // Ombre portee (Harder, squarer shadow)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
      ctx.beginPath();
      // If jumping, shadow doesn't get bigger, it gets smaller and lighter
      const shadowW = 18 - overrideJump*0.5;
      ctx.roundRect(CANVAS_SIZE / 2 - shadowW, CANVAS_SIZE / 2 + 20, shadowW * 2, 4, 1);
      ctx.fill();

      // RENDER GOLEM (Draw order: Arms, Body, Head)
      // All done with sharp lines (lineTo)

      // --- ARMS ---
      const armW = 8;
      const armH = 14;
      const drawArm = (isLeft: boolean) => {
          const dir = isLeft ? -1 : 1;
          const armX = cx + 12 * dir;
          const armY = cy - 6 + emotionYOffset + breathY;
          const raise = isLeft ? -armRaise : -armRaise;
          
          ctx.fillStyle = `rgb(${targetPalette[3].slice(0,3).join(',')})`; // Dark slate
          ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(armX, armY);
          // Blocky arm
          ctx.lineTo(armX + armW*dir, armY + 2 + raise*0.5);
          ctx.lineTo(armX + armW*dir, armY + armH + raise);
          ctx.lineTo(armX - 2*dir, armY + armH + raise);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
      };
      
      if (mood !== 'dead') {
          drawArm(true);
          drawArm(false);
      }

      // --- BODY ---
      const bodyW = 12;
      const bodyTopW = 16;
      const bodyH = 16;
      const baseCy = cy + breathY + emotionYOffset;
      
      const gradBody = ctx.createLinearGradient(cx, baseCy - bodyH, cx, baseCy);
      gradBody.addColorStop(0, `rgb(${targetPalette[5].slice(0,3).join(',')})`); // Light slate top
      gradBody.addColorStop(1, `rgb(${targetPalette[4].slice(0,3).join(',')})`); // Base slate bottom

      ctx.fillStyle = gradBody;
      ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      // Trapezoid body
      ctx.moveTo(cx - bodyW, baseCy);
      ctx.lineTo(cx + bodyW, baseCy);
      ctx.lineTo(cx + bodyTopW, baseCy - bodyH);
      ctx.lineTo(cx - bodyTopW, baseCy - bodyH);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // Texture cracks / stones on body
      ctx.strokeStyle = `rgb(${targetPalette[2].slice(0,3).join(',')})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 8, baseCy - 4); ctx.lineTo(cx - 12, baseCy - 8);
      ctx.moveTo(cx + 10, baseCy - 2); ctx.lineTo(cx + 6, baseCy - 10);
      ctx.stroke();

      // --- MAGIC CORE (Chest) ---
      const coreY = baseCy - bodyH*0.6;
      ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`;
      ctx.beginPath();
      // Diamond shape
      ctx.moveTo(cx, coreY - 4);
      ctx.lineTo(cx + 3, coreY);
      ctx.lineTo(cx, coreY + 4);
      ctx.lineTo(cx - 3, coreY);
      ctx.closePath();
      ctx.fill();

      // --- HEAD ---
      const headW = 10;
      const headH = 8;
      const headY = baseCy - bodyH - headH + (emotionYOffset*0.5) - (breathY*0.5); // Head moves opposite to body breathing for rigidity

      ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`;
      ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - headW, headY, headW*2, headH);
      ctx.fill(); ctx.stroke();
      
      // Optional: blocky jaw
      ctx.fillRect(cx - headW*0.6, headY + headH, headW*1.2, 2);

      // DESSIN DES YEUX (Sur la tête rectangulaire)
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      const eyeSpacing = 4;
      const eyeYLoc = headY + 3;
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.fillRect(x - 1, y, 2, 3);
              ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`;
              ctx.fillRect(x - 0.5, y + 0.5, 1, 1);
          }
          if (finalEyesStyle === 'happy') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 1.5, y, 3, 1);
          }
           if (finalEyesStyle === 'closed') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 1.5, y + 1, 3, 1.5); 
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.fillRect(x - 1, y, 2, 3 - (frame%20>10?1:0)); 
              ctx.fillStyle = '#60a5fa';
              ctx.fillRect(x - 0.5, y + 3, 1, 2); // Tiny tear block
          }
          if (finalEyesStyle === 'half-closed') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.fillRect(x - 1, y + 1, 2, 2);
          }
          if (finalEyesStyle === 'dead') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.font = "bold 8px monospace";
             ctx.fillText('x', x - 2.5, y + 3); 
          }
          if (finalEyesStyle === 'sick') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 1, y, 2, 2);
          }
          if (finalEyesStyle === 'angry') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x - 2, y - 1); ctx.lineTo(x + 1, y + 2); ctx.lineTo(x - 1, y + 2);
             } else {
                 ctx.moveTo(x + 2, y - 1); ctx.lineTo(x - 1, y + 2); ctx.lineTo(x + 1, y + 2);
             }
             ctx.fill();
          }
           if (finalEyesStyle === 'surprised') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 1.5, y - 1, 3, 3);
          }
          if (finalEyesStyle === 'squished') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 2, y + 1, 4, 1);
          }
      };

      drawEye(cx - eyeSpacing, eyeYLoc, false);
      drawEye(cx + eyeSpacing, eyeYLoc, true);

      return { targetPalette };
  }
};
