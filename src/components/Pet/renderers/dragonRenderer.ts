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
  [249, 115, 22, 255],  // 6: Flame orange highlight / Belly
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
      let breath = Math.sin(frame * 0.04) * 1.5; 
      let wingAngle = Math.sin(frame * 0.1) * 0.3; // Slow majestic flap
      let tailWag = Math.cos(frame * 0.05) * 2;

      switch (mood) {
        case 'happy':
          jumpOffset = Math.abs(Math.sin(frame * 0.08) * 6); // Fast jump
          if (jumpOffset < 2) shapeSquash = Math.abs(jumpOffset - 2) * 2; 
          eyesStyle = 'happy';
          wingAngle = Math.sin(frame * 0.4) * 0.8; // Happy fast flapping
          tailWag = Math.cos(frame * 0.15) * 4;
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 8; // Collapsed
          breath = 0; 
          shapeSquash = 8; 
          wingAngle = Math.PI / 2; // Wings down
          tailWag = 0;
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          emotionYOffset = 2; 
          shiverX = (Math.random() - 0.5) * 2; // Heavy shivering
          breath = Math.sin(frame * 0.1) * 1; 
          shapeSquash = 2;
          wingAngle = Math.PI / 4 + Math.sin(frame * 0.05) * 0.1; // Drooping wings
          tailWag = 0;
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 4;
          breath = Math.sin(frame * 0.02) * 2.5; // Very deep breath
          shapeSquash = 4;
          wingAngle = Math.PI / 3;
          tailWag = Math.cos(frame * 0.01) * 1; // Slow dormant twitch
          break;
        case 'sad':
          emotionYOffset = 3; 
          eyesStyle = 'watery';
          shapeSquash = 3; 
          breath = Math.sin(frame * 0.02) * 0.5; 
          wingAngle = Math.PI / 3;
          tailWag = -2; // Drooped tail
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          const sigh = Math.max(0, Math.sin(frame * 0.02)) * 3; 
          emotionYOffset = 2 + sigh;
          shapeSquash = 2 + sigh;
          breath = 0; 
          wingAngle = 0.2;
          tailWag = Math.cos(frame * 0.02) * 1;
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
      let spitFire = false;

      if (interactionProgress > 0) {
          const progress = interactionProgress;
          if (interactionType === 0) { // Wobble
              overrideSquash = Math.sin(progress * Math.PI * 6) * (3 * (1-progress)); 
              overrideShiver = Math.cos(progress * Math.PI * 8) * (4 * (1-progress));
              overrideEyes = 'surprised'; 
              wingAngle = -0.5; // Wings up in surprise
          } else if (interactionType === 1) { // Squish
              if (progress < 0.3) {
                  overrideSquash = progress * 15; 
                  overrideJump = - (progress * 2); 
                  wingAngle = Math.PI / 2;
              } else {
                  const popProgress = (progress - 0.3) / 0.7;
                  overrideSquash = Math.cos(popProgress * Math.PI * 5) * (4 * (1-popProgress));
              }
              overrideEyes = 'squished';
              tailWag = 0;
          } else if (interactionType === 2) { // Jump
              overrideJump = Math.sin(progress * Math.PI) * 18; 
              overrideEyes = 'surprised';
              wingAngle = Math.sin(progress * Math.PI * 4) * 1.0; // frantic flapping
              if (progress > 0.1 && progress < 0.9) overrideSquash = -4; // Stretch while flying
          } else if (interactionType === 3) { // Stretch
              overrideSquash = Math.sin(progress * Math.PI) * -10; 
              overrideEyes = 'happy';
              wingAngle = -0.8; // Wings fully extended
              tailWag = 5;
          } else if (interactionType === 4) { // Melt
              if (progress < 0.2) {
                  overrideSquash = (progress / 0.2) * 8; 
                  overrideEyes = 'closed';
              } else if (progress < 0.8) {
                  overrideSquash = 8 + Math.sin(progress * Math.PI * 10); 
                  overrideEyes = 'half-closed';
              } else {
                  overrideSquash = ((1 - progress) / 0.2) * 8; 
                  overrideEyes = 'surprised';
              }
              wingAngle = Math.PI / 2.5;
          } else if (interactionType === 5) { // Angry / Shake
              overrideShiver = (Math.random() - 0.5) * 6;
              overrideSquash = -2; 
              overrideEyes = 'angry';
              wingAngle = Math.sin(progress * Math.PI * 8) * 0.5; // Angry flutter
              tailWag = Math.cos(progress * Math.PI * 10) * 4; // Whip tail
              spitFire = true;
          }
      }

      // Application des valeurs finales
      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver;
      const cy = CANVAS_SIZE / 2 + 10 - jumpOffset - overrideJump + emotionYOffset;
      const w = 18 + breath * 0.5 + shapeSquash + overrideSquash; 
      const h = 18 - breath - shapeSquash*0.8 - overrideSquash/2; 

      // Ombre portee
      if (mood !== 'dead') {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
          ctx.beginPath();
          const shadowSize = Math.max(0, (22 + shapeSquash + overrideSquash) * (1 - (overrideJump + jumpOffset) / 30));
          ctx.ellipse(CANVAS_SIZE / 2 + overrideShiver * 0.5, CANVAS_SIZE / 2 + 20, shadowSize, 3, 0, 0, Math.PI * 2);
          ctx.fill();
      }

      // Helper properties for scales and placement
      const outlineColor = `rgb(${targetPalette[1].slice(0,3).join(',')})`; // Obsidian

      // --- WINGS (drawn behind) ---
      const wingOriginX = cx + 6;
      const wingOriginY = cy - h * 0.3;
      ctx.fillStyle = `rgb(${targetPalette[3].slice(0,3).join(',')})`; // Darker red for wings behind
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      
      const drawWing = (x: number, y: number, isRight: boolean) => {
         ctx.save();
         ctx.translate(x, y);
         const angle = isRight ? wingAngle : -wingAngle;
         ctx.rotate(angle);
         ctx.beginPath();
         // Leathery dragong wing with ribbed arcs
         ctx.moveTo(0, 0);
         const dir = isRight ? 1 : -1;
         
         ctx.quadraticCurveTo(8*dir, -12, 16*dir, -16); // Top muscular arm
         ctx.lineTo(20*dir, -8); // Outer point 1
         ctx.quadraticCurveTo(14*dir, -4, 18*dir, 2); // Outer point 2
         ctx.quadraticCurveTo(12*dir, 4, 10*dir, 10); // Outer point 3
         ctx.quadraticCurveTo(6*dir, 6, 0, 0); // Bottom connect

         ctx.fill();
         ctx.stroke();

         // Wing rib lines
         ctx.beginPath();
         ctx.moveTo(12*dir, -14); ctx.lineTo(14*dir, -4);
         ctx.moveTo(8*dir, -8); ctx.lineTo(10*dir, 4);
         ctx.strokeStyle = `rgba(${targetPalette[2][0]}, ${targetPalette[2][1]}, ${targetPalette[2][2]}, 0.5)`;
         ctx.stroke();

         ctx.restore();
      };
      
      if (mood !== 'dead') drawWing(wingOriginX, wingOriginY, true); // Right wing (far)
      if (mood !== 'dead') drawWing(cx + 2, wingOriginY, false); // Left wing (near)
      if (mood === 'dead') {
          // Wrapped around body
          drawWing(wingOriginX - 8, wingOriginY + 8, false);
      }

      // --- TAIL ---
      // A thick tail that sweeps to the left side
      ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`;
      ctx.strokeStyle = outlineColor;
      ctx.beginPath();
      // Start from back lower body
      const tailRootX = cx + 8;
      const tailRootY = cy + h * 0.8;
      
      ctx.moveTo(tailRootX, tailRootY);
      const tailEndX = cx + 20 + tailWag;
      const tailEndY = cy + h * 1.2 - tailWag*0.5;
      
      ctx.quadraticCurveTo(cx + 24, cy + h, tailEndX, tailEndY);
      ctx.quadraticCurveTo(cx + 18, cy + h + 6, cx + 4, cy + h);
      ctx.fill(); ctx.stroke();

      // Tail spade / spike
      ctx.fillStyle = `rgb(${targetPalette[3].slice(0,3).join(',')})`;
      ctx.beginPath();
      ctx.moveTo(tailEndX, tailEndY);
      ctx.lineTo(tailEndX + 4, tailEndY - 4);
      ctx.lineTo(tailEndX + 6, tailEndY + 2);
      ctx.lineTo(tailEndX - 2, tailEndY + 4);
      ctx.fill(); ctx.stroke();

      // --- SPIKES ON BACK ---
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`; // Obsidian spikes
      for (let i = 0; i < 3; i++) {
          const spX = cx + 6 + (i * 3);
          const spY = cy - h*0.5 + (i * 6) + emotionYOffset;
          ctx.beginPath();
          ctx.moveTo(spX, spY);
          ctx.lineTo(spX + 6, spY - 2 + (overrideSquash*0.2));
          ctx.lineTo(spX + 2, spY + 6);
          ctx.fill();
      }

      // --- MAIN BODY (Pear-shaped chunky dino) ---
      const gradBody = ctx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, w * 1.2);
      gradBody.addColorStop(0, `rgb(${targetPalette[5].slice(0,3).join(',')})`); // Light Red
      gradBody.addColorStop(0.6, `rgb(${targetPalette[4].slice(0,3).join(',')})`); // Base Crimson
      gradBody.addColorStop(1, `rgb(${targetPalette[2].slice(0,3).join(',')})`); // Deep shadow

      ctx.fillStyle = gradBody;
      ctx.strokeStyle = outlineColor;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - h * 0.8);
      // Back curve
      ctx.quadraticCurveTo(cx + w, cy - h * 0.5, cx + w * 0.8, cy + h * 0.9);
      // Bottom flat
      ctx.quadraticCurveTo(cx, cy + h, cx - w * 0.7, cy + h * 0.9);
      // Belly curve up
      ctx.quadraticCurveTo(cx - w * 0.9, cy, cx - 6, cy - h * 0.8);
      ctx.fill(); ctx.stroke();

      // --- LIGHTER BELLY LAYER ---
      const gradBelly = ctx.createLinearGradient(cx - w * 0.2, cy - h * 0.3, cx - w * 0.8, cy + h * 0.8);
      gradBelly.addColorStop(0, `rgb(${targetPalette[7].slice(0,3).join(',')})`); // Super bright orange
      gradBelly.addColorStop(1, `rgb(${targetPalette[6].slice(0,3).join(',')})`);    // Flame orange

      ctx.fillStyle = gradBelly;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - h * 0.5);
      ctx.quadraticCurveTo(cx + 2, cy + 2, cx, cy + h * 0.8);
      ctx.quadraticCurveTo(cx - w * 0.5, cy + h * 0.9, cx - w * 0.6, cy + h * 0.6);
      ctx.quadraticCurveTo(cx - w * 0.8, cy + 2, cx - 4, cy - h * 0.5);
      ctx.fill();

      // Belly ridges (draconic plates)
      ctx.strokeStyle = `rgba(${targetPalette[4][0]}, ${targetPalette[4][1]}, ${targetPalette[4][2]}, 0.8)`; // Crimson lines
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - h * 0.2); ctx.quadraticCurveTo(cx - 2, cy, cx - w * 0.7, cy + 2);
      ctx.moveTo(cx - 3, cy + h * 0.2); ctx.quadraticCurveTo(cx, cy + h * 0.4, cx - w * 0.6, cy + h * 0.4);
      ctx.moveTo(cx - 1, cy + h * 0.6); ctx.quadraticCurveTo(cx + 2, cy + h * 0.7, cx - w * 0.4, cy + h * 0.7);
      ctx.stroke();

      // --- DRAW FEET ---
      ctx.fillStyle = `rgb(${targetPalette[2].slice(0,3).join(',')})`;
      // Left foot
      ctx.beginPath(); ctx.ellipse(cx - 8, cy + h, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Right foot
      ctx.beginPath(); ctx.ellipse(cx + 6, cy + h - 1, 6, 3, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();


      // --- BIG CHUBBY HEAD ---
      const headX = cx - 10 + shiverX;
      const headY = cy - h * 0.7 + (emotionYOffset*0.5);
      const headW = 12 + overrideSquash * 0.3;
      const headH = 10 - overrideSquash * 0.3;

      // Draw Horns (behind head)
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`; // Obsidian horns
      const drawHorn = (offX: number, offY: number, angle: number) => {
          ctx.save();
          ctx.translate(headX + offX, headY + offY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(4, -8, 12, -14); // Curving back
          ctx.quadraticCurveTo(2, -12, -4, -4); // Inner edge
          ctx.fill();
          ctx.restore();
      };
      drawHorn(4, -6, 0.2); // Right horn
      drawHorn(-4, -6, -0.1); // Left horn

      // Head shape (Rounded front, squarish back)
      const gradHead = ctx.createRadialGradient(headX - 4, headY - 2, 2, headX, headY, headW * 1.5);
      gradHead.addColorStop(0, `rgb(${targetPalette[5].slice(0,3).join(',')})`); // Light Red
      gradHead.addColorStop(0.7, `rgb(${targetPalette[4].slice(0,3).join(',')})`); // Base Crimson
      gradHead.addColorStop(1, `rgb(${targetPalette[3].slice(0,3).join(',')})`); // Dark red

      ctx.fillStyle = gradHead;
      ctx.strokeStyle = outlineColor;
      ctx.beginPath();
      ctx.moveTo(headX + headW * 0.5, headY - headH);
      ctx.quadraticCurveTo(headX - headW, headY - headH, headX - headW - 2, headY); // Snout
      ctx.quadraticCurveTo(headX - headW, headY + headH * 1.2, headX, headY + headH); // Chin
      ctx.quadraticCurveTo(headX + headW, headY + headH, headX + headW, headY); // Back of head
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      
      // Snout highlight
      ctx.fillStyle = `rgba(${targetPalette[7][0]}, ${targetPalette[7][1]}, ${targetPalette[7][2]}, 0.4)`;
      ctx.beginPath(); ctx.ellipse(headX - headW * 0.4, headY - headH * 0.5, 4, 2, -0.2, 0, Math.PI*2); ctx.fill();

      // Nostril
      ctx.fillStyle = outlineColor;
      ctx.beginPath(); ctx.ellipse(headX - headW + 2, headY - 2, 1, 1.5, -0.2, 0, Math.PI*2); ctx.fill();


      // --- EYES ---
      ctx.fillStyle = outlineColor;
      const eyeSpacing = 4 + (overrideSquash * 0.2);
      const eyeY = headY - 2;
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              ctx.fillStyle = outlineColor;
              ctx.beginPath(); ctx.ellipse(x, y, 2.5, 3.5, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 0.8, 2, 0, 0, Math.PI*2); ctx.fill(); // Orange slit pupil
          }
          if (finalEyesStyle === 'happy') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 2.5;
             ctx.lineCap = 'round';
             ctx.beginPath();
             ctx.arc(x, y + 2, 3, Math.PI * 1.1, Math.PI * 1.9);
             ctx.stroke();
          }
           if (finalEyesStyle === 'closed') {
             ctx.fillStyle = outlineColor;
             ctx.fillRect(x - 2.5, y + 1, 5, 2); 
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = outlineColor;
              ctx.beginPath(); ctx.ellipse(x, y, 3, 3.5, isRight?-0.2:0.2, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#60a5fa'; // Blue tear
              ctx.fillRect(x - 1, y + 2, 2, 3 + Math.abs(Math.sin(frame*0.05))*2);
          }
          if (finalEyesStyle === 'half-closed') {
              ctx.fillStyle = outlineColor;
              ctx.beginPath(); ctx.ellipse(x, y + 0.5, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`; // Eyelid matches red crimson
              ctx.fillRect(x - 3, y - 4, 6, 4.5); 
          }
          if (finalEyesStyle === 'dead') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(x - 2.5, y - 1); ctx.lineTo(x + 2.5, y + 4);
             ctx.moveTo(x + 2.5, y - 1); ctx.lineTo(x - 2.5, y + 4);
             ctx.stroke();
          }
          if (finalEyesStyle === 'sick') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 2;
             ctx.beginPath();
             const turn = frame * 0.05 + (isRight ? 2 : 0); 
             ctx.arc(x, y, 2, turn, turn + Math.PI * 1.5);
             ctx.stroke();
          }
          if (finalEyesStyle === 'angry') {
             // Deep sharp V curve
             ctx.strokeStyle = outlineColor;
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
             ctx.fillStyle = outlineColor;
             ctx.beginPath(); ctx.ellipse(x + (isRight?-0.5:0.5), y + 1.5, 1.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
          }
           if (finalEyesStyle === 'surprised') {
             ctx.fillStyle = outlineColor;
             ctx.beginPath(); ctx.ellipse(x, y - 1, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'squished') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 2;
             ctx.lineJoin = 'round';
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x + 2.5, y - 2); ctx.lineTo(x - 1, y); ctx.lineTo(x + 2.5, y + 2.5);
             } else {
                 ctx.moveTo(x - 2.5, y - 2); ctx.lineTo(x + 1, y); ctx.lineTo(x - 2.5, y + 2.5);
             }
             ctx.stroke();
          }
      };

      // Draw eyes on the front of the rounded head
      drawEye(headX - 6 + eyeSpacing, eyeY, false);
      drawEye(headX + eyeSpacing, eyeY, true);

      // --- PROCEDURAL ANGRY FIRE/SMOKE (Stateless) ---
      if (spitFire) {
         // Determine progress of interaction
         const timeT = (1 - interactionProgress); // 0.0 to 1.0
         if (timeT > 0.1 && timeT < 0.9) {
             const flameCount = 12;
             for (let i = 0; i < flameCount; i++) {
                 // Deterministic pseudorandom based on i
                 const pseudoRandom = ((i * 137) % 100) / 100; // 0 to 1
                 const startDelay = pseudoRandom * 0.4;
                 
                 // Local particle progress (0.0 to 1.0)
                 let pT = (timeT - startDelay) / 0.6;
                 if (pT > 0 && pT < 1) {
                     // ease out
                     pT = 1 - Math.pow(1 - pT, 2);
                     
                     const angle = Math.PI + (pseudoRandom - 0.5) * 1.5; // Shoot leftwards and slightly randomized Y
                     const dist = pT * (30 + pseudoRandom * 20); // They fly outwards
                     
                     const fx = headX - headW + 2 + Math.cos(angle) * dist;
                     const fy = headY + 2 + Math.sin(angle) * dist;
                     
                     const size = (1 - pT) * (6 + pseudoRandom * 4); // Shrinks as it goes
                     
                     // Color: Yellow -> Orange -> Crimson -> Grey Smoke based on life (pT)
                     if (pT < 0.3) {
                         ctx.fillStyle = `rgb(${targetPalette[7].slice(0,3).join(',')})`; // Bright yellow
                     } else if (pT < 0.6) {
                         ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`; // Orange flame
                     } else if (pT < 0.8) {
                         ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`; // Crimson edge
                     } else {
                         ctx.fillStyle = `rgba(100, 116, 139, ${1 - ((pT-0.8)/0.2)})`; // fading smoke
                     }
                     
                     ctx.beginPath();
                     ctx.arc(fx, fy, size, 0, Math.PI * 2);
                     ctx.fill();
                 }
             }
         }
      }

      return { targetPalette };
  }
};
