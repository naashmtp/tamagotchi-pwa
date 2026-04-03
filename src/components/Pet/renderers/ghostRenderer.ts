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
      // Tail wave speed
      let waveSpeed = 0.08;

      switch (mood) {
        case 'happy':
          floatY = Math.sin(frame * 0.06) * 5; 
          waveSpeed = 0.15;
          eyesStyle = 'happy';
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 5; 
          floatY = 0; 
          breath = -2;
          waveSpeed = 0;
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          floatY = Math.sin(frame * 0.02) * 1.5;
          shiverX = (Math.random() - 0.5) * 1.5;
          breath = 0;
          waveSpeed = 0.05;
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 1;
          floatY = Math.sin(frame * 0.015) * 1.5;
          breath = Math.sin(frame * 0.01) * 2; 
          waveSpeed = 0.04;
          break;
        case 'sad':
          emotionYOffset = 2; 
          eyesStyle = 'watery';
          floatY = Math.sin(frame * 0.015) * 1; 
          breath = -1;
          waveSpeed = 0.04;
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
      let auraExpand = 0;

      if (interactionProgress > 0) {
          const progress = interactionProgress;
          if (interactionType === 0) { // Wobble
              overrideSquash = Math.sin(progress * Math.PI * 6) * (2 * (1-progress)); 
              overrideShiver = Math.cos(progress * Math.PI * 8) * (8 * (1-progress));
              overrideEyes = 'surprised'; 
              waveSpeed = 0.3;
          } else if (interactionType === 1) { // Squish
              if (progress < 0.3) {
                  overrideSquash = progress * 15; 
                  overrideJump = - (progress * 2); 
              } else {
                  const popProgress = (progress - 0.3) / 0.7;
                  overrideSquash = Math.cos(popProgress * Math.PI * 5) * (4 * (1-popProgress));
              }
              overrideEyes = 'squished';
              auraExpand = Math.sin(progress * Math.PI) * 10;
          } else if (interactionType === 2) { // Jump
              overrideJump = Math.sin(progress * Math.PI) * 25; // High ghost jump
              overrideSquash = Math.sin(progress * Math.PI) * -6; // Stretches going up
              overrideEyes = 'surprised';
          } else if (interactionType === 3) { // Stretch
              overrideSquash = Math.sin(progress * Math.PI) * -12; 
              overrideJump = Math.sin(progress * Math.PI) * 8;
              overrideEyes = 'happy';
          } else if (interactionType === 4) { // Melt
              if (progress < 0.2) {
                  overrideSquash = (progress / 0.2) * 8; 
                  overrideEyes = 'closed';
              } else if (progress < 0.8) {
                  overrideSquash = 8 + Math.sin(progress * Math.PI * 8) * 2; 
                  overrideEyes = 'half-closed';
              } else {
                  overrideSquash = ((1 - progress) / 0.2) * 8; 
                  overrideEyes = 'surprised';
              }
              waveSpeed = 0.5;
          } else if (interactionType === 5) { // Shake/Angry
              overrideShiver = (Math.random() - 0.5) * 5;
              overrideSquash = -3; 
              auraExpand = 5;
              overrideEyes = 'angry';
          }
      }

      // Application des valeurs finales
      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver;
      // Ghost is naturally a bit higher
      const cy = CANVAS_SIZE / 2 + 6 - jumpOffset - overrideJump + emotionYOffset + floatY;
      const w = 18 + breath + shapeSquash + overrideSquash; 
      const h = 24 - shapeSquash - overrideSquash/2; 

      // Ombre portee
      if (mood !== 'dead') {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
          ctx.beginPath();
          // Shadow size scales inversely with floatY
          const shadowSize = Math.max(0, (18 + shapeSquash + overrideSquash) * (1 - Math.max(0, floatY + overrideJump + jumpOffset) / 30));
          ctx.ellipse(CANVAS_SIZE / 2 + overrideShiver * 0.2, CANVAS_SIZE / 2 + 22, shadowSize, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
      } else {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
          ctx.beginPath();
          ctx.ellipse(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 22, (18 + shapeSquash) * 0.9, 3, 0, 0, Math.PI * 2);
          ctx.fill();
      }

      // Helper function to draw organic ghost body
      const drawGhostPath = (offsetX: number, offsetY: number, scaleW: number, scaleH: number) => {
          ctx.beginPath();
          // Top dome
          ctx.moveTo(cx + offsetX, cy + offsetY - h * scaleH);
          ctx.bezierCurveTo(
              cx + offsetX + w * scaleW, cy + offsetY - h * scaleH, 
              cx + offsetX + w * scaleW, cy + offsetY + h * scaleH * 0.2, 
              cx + offsetX + w * scaleW * 0.8, cy + offsetY + h * scaleH
          );
          
          // Wavy bottom edge - more organic
          const waveCount = 4;
          const waveWidth = (w * scaleW * 1.6) / waveCount;
          for (let i = 0; i < waveCount; i++) {
              const wx = cx + offsetX + w * scaleW * 0.8 - (i * waveWidth);
              // Animated waves with different offsets for a ragged look
              const waveAnim = mood === 'dead' ? 0 : Math.sin(frame * waveSpeed + i * 1.5) * 3;
              const dip = (i % 2 === 0) ? (3 * scaleH) : (-2 * scaleH);
              
              ctx.quadraticCurveTo(
                  wx - waveWidth / 2, 
                  cy + offsetY + h * scaleH + dip + waveAnim + (overrideJump * 0.1), // tail drags slightly when jumping
                  wx - waveWidth, 
                  cy + offsetY + h * scaleH + waveAnim * 0.5
              );
          }

          // Left side back up
          ctx.bezierCurveTo(
              cx + offsetX - w * scaleW, cy + offsetY + h * scaleH * 0.2, 
              cx + offsetX - w * scaleW, cy + offsetY - h * scaleH, 
              cx + offsetX, cy + offsetY - h * scaleH
          );
          ctx.closePath();
      };

      // --- FLOATING ORBS (Wisps) ---
      if (mood !== 'dead') {
          for (let i = 0; i < 3; i++) {
              const orbAngle = frame * 0.02 + i * ((Math.PI * 2) / 3);
              const orbRadius = 24 + auraExpand + Math.sin(frame * 0.05 + i) * 4;
              const orbX = cx + Math.cos(orbAngle) * orbRadius;
              const orbY = cy + Math.sin(orbAngle * 1.5) * (orbRadius * 0.5) + floatY; // Orbs float around
              
              // Wisp aura
              ctx.fillStyle = `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, 0.3)`;
              ctx.beginPath();
              ctx.arc(orbX, orbY, 3, 0, Math.PI * 2);
              ctx.fill();
              
              // Wisp core
              ctx.fillStyle = `rgb(${targetPalette[7].slice(0,3).join(',')})`;
              ctx.beginPath();
              ctx.arc(orbX, orbY, 1.5, 0, Math.PI * 2);
              ctx.fill();
          }
      }

      // --- ARMS ---
      // Tiny cute teardrop arms floating detached from the body
      const armFloat1 = Math.sin(frame * 0.04) * 2;
      const armFloat2 = Math.cos(frame * 0.04) * 2;
      const armExpand = overrideSquash * 0.5;

      const drawArm = (isLeft: boolean) => {
          const dir = isLeft ? -1 : 1;
          const ax = cx + (w * 0.8 + armExpand) * dir;
          const ay = cy + (isLeft ? armFloat1 : armFloat2) + emotionYOffset;
          
          ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`; // Outline color
          ctx.beginPath();
          ctx.ellipse(ax, ay, 4, 2.5, isLeft ? -0.2 : 0.2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = `rgb(${targetPalette[5].slice(0,3).join(',')})`; // Fill
          ctx.beginPath();
          ctx.ellipse(ax - 0.5*dir, ay - 0.5, 3, 1.5, isLeft ? -0.2 : 0.2, 0, Math.PI * 2);
          ctx.fill();
      };

      if (mood !== 'dead') {
          drawArm(true);
          drawArm(false);
      }

      // --- MAIN BODY OUTLINE ---
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      drawGhostPath(0, 0, 1.1, 1.05);
      ctx.fill();

      // --- MAIN BODY BASE (Translucent edge effect) ---
      const baseGrad = ctx.createLinearGradient(cx, cy - h, cx, cy + h);
      baseGrad.addColorStop(0, `rgb(${targetPalette[4].slice(0,3).join(',')})`);
      baseGrad.addColorStop(1, `rgb(${targetPalette[2].slice(0,3).join(',')})`);
      ctx.fillStyle = baseGrad;
      drawGhostPath(0, 0, 1.0, 1.0);
      ctx.fill();
      
      // Top highlight for glass-like roundness
      ctx.fillStyle = `rgba(${targetPalette[7][0]}, ${targetPalette[7][1]}, ${targetPalette[7][2]}, 0.4)`;
      ctx.beginPath();
      ctx.ellipse(cx - w*0.2, cy - h*0.6, w*0.3, h*0.15, -0.2, 0, Math.PI*2);
      ctx.fill();

      // --- DESSIN DES YEUX (Ghosts have big hollow expressive eyes) ---
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      const eyeSpacing = 7 + (overrideSquash * 0.2);
      const eyeY = cy - 6 + emotionYOffset;
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              // Deep socket
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 3.5, 5.5, isRight?0.1:-0.1, 0, Math.PI*2); ctx.fill();
              // Glowing bright pupil inside
              ctx.fillStyle = `rgb(${targetPalette[7].slice(0,3).join(',')})`; 
              ctx.beginPath(); ctx.ellipse(x, y - 1, 1.5, 2, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'happy') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2.5;
             ctx.lineCap = 'round';
             ctx.beginPath();
             ctx.arc(x, y + 2, 3.5, Math.PI * 1.1, Math.PI * 1.9); // Beautiful happy curve
             ctx.stroke();
          }
           if (finalEyesStyle === 'closed') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 3, y + 2, 6, 2); 
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 4, 4.5, isRight?-0.2:0.2, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#60a5fa'; // Blue tear
              ctx.fillRect(x - 1, y + 2, 2.5, 4 + Math.abs(Math.sin(frame*0.05))*2);
          }
          if (finalEyesStyle === 'half-closed') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y + 1, 3.5, 3.5, 0, 0, Math.PI*2); ctx.fill();
              // Eyelid blocking top half
              ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`; 
              ctx.fillRect(x - 4, y - 5, 8, 5); 
          }
          if (finalEyesStyle === 'dead') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(x - 3, y - 1); ctx.lineTo(x + 3, y + 5);
             ctx.moveTo(x + 3, y - 1); ctx.lineTo(x - 3, y + 5);
             ctx.stroke();
          }
          if (finalEyesStyle === 'sick') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2;
             ctx.beginPath();
             const turn = frame * 0.05 + (isRight ? 2 : 0); 
             ctx.arc(x, y, 2.5, turn, turn + Math.PI * 1.5);
             ctx.stroke();
          }
          if (finalEyesStyle === 'angry') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2;
             ctx.lineCap = 'round';
             ctx.lineJoin = 'round';
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 2, y + 1); 
             } else {
                 ctx.moveTo(x + 3, y - 2); ctx.lineTo(x - 2, y + 1); 
             }
             ctx.stroke();
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x + (isRight?-0.5:0.5), y + 2.5, 2, 2, 0, 0, Math.PI*2); ctx.fill();
          }
           if (finalEyesStyle === 'surprised') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x, y - 1, 2.5, 4, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'squished') {
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2.5;
             ctx.lineJoin = 'round';
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x + 3, y - 2); ctx.lineTo(x - 1, y); ctx.lineTo(x + 3, y + 2);
             } else {
                 ctx.moveTo(x - 3, y - 2); ctx.lineTo(x + 1, y); ctx.lineTo(x - 3, y + 2);
             }
             ctx.stroke();
          }
      };

      drawEye(cx - eyeSpacing, eyeY, false);
      drawEye(cx + eyeSpacing, eyeY, true);

      return { targetPalette };
  }
};
