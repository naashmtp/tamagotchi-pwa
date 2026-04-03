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

// Poussière d'étoiles dynamique persistante pour la traînée
let sparkles: { x: number, y: number, life: number, maxLife: number, type: 'dot' | 'star' | 'glint' }[] = [];

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
      let wingSpeed = 0.6; // Base flap speed
      let legSwing = Math.cos(frame * 0.05) * 2; // Legs trailing the motion

      switch (mood) {
        case 'happy':
          floatY = Math.sin(frame * 0.15) * 8;  // Very hyper
          floatX = Math.sin(frame * 0.08) * 10; 
          wingSpeed = 0.9;
          eyesStyle = 'happy';
          legSwing = Math.cos(frame * 0.08) * 4;
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 22; // Drop to the floor
          floatY = 0; floatX = 0;
          breath = 0; 
          shapeSquash = 6; 
          wingSpeed = 0;
          legSwing = 0;
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          floatY = Math.sin(frame * 0.02) * 1; // Very weak floating
          floatX = Math.sin(frame * 0.01) * 2;
          shiverX = (Math.random() - 0.5) * 2; 
          breath = Math.sin(frame * 0.3) * 0.5; // frantic shallow breathing
          wingSpeed = 0.2;
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 18; // Resting on the ground
          floatY = Math.sin(frame * 0.02) * 2;
          floatX = 0;
          breath = Math.sin(frame * 0.02) * 1.5; 
          wingSpeed = 0.05; // Wings folded / very slow throb
          break;
        case 'sad':
          emotionYOffset = 8; // Drooping
          eyesStyle = 'watery';
          floatY = Math.sin(frame * 0.03) * 2; 
          floatX = Math.sin(frame * 0.015) * 3;
          breath = Math.sin(frame * 0.02) * 0.5; 
          wingSpeed = 0.15;
          legSwing = 0;
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          emotionYOffset = 4;
          floatY = Math.sin(frame * 0.02) * 2;
          floatX = Math.sin(frame * 0.01) * 2;
          breath = 0.5; 
          wingSpeed = 0.2;
          legSwing = Math.cos(frame * 0.01) * 1;
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
              wingSpeed = 0.8;
          } else if (interactionType === 1) { // Squish
              if (progress < 0.3) {
                  overrideSquash = progress * 10; 
                  wingSpeed = Math.PI/2; // Locked flapping
              } else {
                  const popProgress = (progress - 0.3) / 0.7;
                  overrideSquash = Math.cos(popProgress * Math.PI * 6) * (3 * (1-popProgress));
                  wingSpeed = 1.0; // Frantic flap upon release
              }
              overrideEyes = 'squished';
              legSwing = 6; // kicking legs
          } else if (interactionType === 2) { // Jump -> Zips up fast
              overrideJump = Math.sin(progress * Math.PI) * 35; 
              overrideShiver = Math.sin(progress * Math.PI * 8) * 4;
              overrideEyes = 'surprised';
              wingSpeed = 1.5; // blur wings
              legSwing = 8; // legs dragging straight down
          } else if (interactionType === 3) {
              overrideSquash = Math.sin(progress * Math.PI) * -6; 
              overrideEyes = 'happy';
              wingSpeed = 1.0;
          } else if (interactionType === 4) { // Melt -> Glow tightly
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
          } else if (interactionType === 5) { // Fairy angry is a sharp, aggressive buzzing
              overrideShiver = (Math.random() - 0.5) * 12;
              overrideJump = (Math.random() - 0.5) * 8;
              overrideEyes = 'angry';
              wingSpeed = 2.0; 
              legSwing = 4;
          }
      }

      // Add trail sparkles (magic dust)
      if (mood !== 'dead' && mood !== 'sleeping' && (Math.abs(floatX) > 1 || Math.abs(floatY) > 1 || interactionProgress > 0)) {
           if (frame % 3 === 0) { // Moins fréquent
              const r = Math.random();
              const type = r < 0.1 ? 'star' : (r < 0.3 ? 'glint' : 'dot');
              sparkles.push({
                 // On spawn la poussière plus bas (derrière les jambes / la robe)
                 x: CANVAS_SIZE / 2 + floatX + (Math.random()-0.5)*6,
                 y: CANVAS_SIZE / 2 + 14 + floatY - overrideJump + (Math.random()-0.5)*4,
                 life: 0,
                 maxLife: 10 + Math.random() * 15,
                 type
              });
           }
      }

      // Application des valeurs finales (Centre du sprite = le bassin/ventre)
      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver + floatX;
      const cy = CANVAS_SIZE / 2 + 6 - jumpOffset - overrideJump + emotionYOffset + floatY;
      
      const outlineColor = `rgb(${targetPalette[1].slice(0,3).join(',')})`;

      // Ombre portee
      if (mood !== 'dead') {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.15)'; 
          ctx.beginPath();
          const shadowSize = Math.max(0, 12 * (1 - (cy - CANVAS_SIZE/2)/25));
          ctx.ellipse(CANVAS_SIZE / 2 + floatX*0.5, CANVAS_SIZE / 2 + 22, shadowSize, shadowSize * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
      } else {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 4, 14, 3, 0, 0, Math.PI * 2);
          ctx.fill();
      }

      // --- RENDER SPARKLES (Dessiné en fond, AVANT le corps, pour ne pas cacher le visage) ---
      for(let i=sparkles.length-1; i>=0; i--) {
          const p = sparkles[i];
          p.life++;
          const scale = 1 - (p.life / p.maxLife);
          if(scale > 0) {
              const size = 1 + scale * 1.5; // Plus délicat
              const alpha = scale * 0.8; // Légèrement transparent
              ctx.fillStyle = `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, ${alpha})`; // Gold dust
              
              if (p.type === 'star') {
                 // small 4 point star
                 ctx.beginPath();
                 ctx.moveTo(p.x, p.y - size*1.5);
                 ctx.lineTo(p.x + size*0.4, p.y - size*0.4);
                 ctx.lineTo(p.x + size*1.5, p.y);
                 ctx.lineTo(p.x + size*0.4, p.y + size*0.4);
                 ctx.lineTo(p.x, p.y + size*1.5);
                 ctx.lineTo(p.x - size*0.4, p.y + size*0.4);
                 ctx.lineTo(p.x - size*1.5, p.y);
                 ctx.lineTo(p.x - size*0.4, p.y - size*0.4);
                 ctx.fill();
              } else if (p.type === 'glint') {
                 // diamond
                 ctx.beginPath();
                 ctx.moveTo(p.x, p.y - size);
                 ctx.lineTo(p.x + size, p.y);
                 ctx.lineTo(p.x, p.y + size);
                 ctx.lineTo(p.x - size, p.y);
                 ctx.fill();
              } else {
                 // simple puffs
                 ctx.beginPath(); 
                 ctx.ellipse(p.x, p.y + Math.sin(p.life*0.2), size*0.8, size*0.8, 0, 0, Math.PI*2);
                 ctx.fill();
              }
          }
          if(p.life >= p.maxLife) {
             sparkles.splice(i, 1);
          }
      }

      // --- WINGS ---
      // We draw wings behind and in front. Wait, butterfly wings are normally attached to the back.
      // Easiest is to draw right wing, then body, then left wing for 3/4 perspective, OR both wings behind the body.
      // Both behind is usually cleaner for a tiny sprite.
      const flapScale = mood === 'dead' ? 0.2 : Math.max(0.05, Math.abs(Math.sin(frame * wingSpeed)));
      
      const drawWingBlock = () => {
          ctx.lineWidth = 1.2;
          ctx.lineJoin = 'round';
          
          const drawWingSide = (isRight: boolean) => {
              const dir = isRight ? 1 : -1;
              ctx.save();
              ctx.translate(cx, cy - 4);
              
              // Simulate 3D flapping by scaling X
              // If dead, wings lay flat
              if (mood === 'dead') {
                 ctx.rotate(isRight ? Math.PI/2 : -Math.PI/2);
                 ctx.scale(1, 1);
              } else {
                 // Slightly offset the phase based on side if we want a cool effect, or keep synced
                 ctx.scale(dir * flapScale, 1);
              }
              
              // Upper wing (Dragonfly / Butterfly mix)
              ctx.fillStyle = `rgba(${targetPalette[5][0]}, ${targetPalette[5][1]}, ${targetPalette[5][2]}, 0.8)`; // semi-translucent light pink
              ctx.strokeStyle = `rgb(${targetPalette[2].slice(0,3).join(',')})`; // magenta veins/edge
              
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.bezierCurveTo(4, -10, 16, -18, 22, -12); // Top reaching up and out
              ctx.bezierCurveTo(24, -4, 18, 2, 0, 2); // curving back to body
              ctx.fill(); ctx.stroke();

              // Wing veins (Upper)
              ctx.beginPath();
              ctx.moveTo(0,0); ctx.lineTo(18, -10);
              ctx.moveTo(8, -4); ctx.lineTo(14, -2);
              ctx.moveTo(10, -5); ctx.lineTo(16, -6);
              ctx.strokeStyle = `rgba(${targetPalette[3][0]}, ${targetPalette[3][1]}, ${targetPalette[3][2]}, 0.6)`;
              ctx.stroke();

              // Lower wing
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.bezierCurveTo(4, 6, 12, 16, 16, 10);
              ctx.bezierCurveTo(14, 4, 6, 2, 0, 2);
              ctx.strokeStyle = `rgb(${targetPalette[2].slice(0,3).join(',')})`;
              ctx.fill(); ctx.stroke();
              
              ctx.restore();
          };

          drawWingSide(true);
          drawWingSide(false);
      };

      // Draw wings FIRST so they go behind the sprite
      drawWingBlock();

      // --- LEGS ---
      // Tiny pointed dangling legs
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      
      const drawLeg = (offX: number, sway: number, isBack: boolean) => {
         const legY = mood === 'dead' ? cy + 4 : cy + 4 - shapeSquash*0.3 - overrideSquash*0.3;
         const legEndY = mood === 'dead' ? legY : legY + 6;
         const legEndX = cx + offX - sway;
         
         ctx.beginPath();
         ctx.moveTo(cx + offX*0.5, legY);
         ctx.quadraticCurveTo(cx + offX, legY + 3, legEndX, legEndY);
         ctx.stroke();
         
         // Inner color
         ctx.strokeStyle = isBack ? `rgb(${targetPalette[3].slice(0,3).join(',')})` : `rgb(${targetPalette[4].slice(0,3).join(',')})`;
         ctx.lineWidth = 1;
         ctx.stroke();
      };
      drawLeg(2, legSwing, true); // right leg
      drawLeg(-2, legSwing*0.8, false); // left leg

      // --- BODY (Tiny Torso / Dress) ---
      const torsoY = cy - 2 + emotionYOffset*0.2;
      const torsoH = 8 + shapeSquash*0.4 + overrideSquash*0.4;
      const torsoW = 6 + shapeSquash*0.2 + overrideSquash*0.2;

      const gradBody = ctx.createLinearGradient(cx - torsoW, torsoY, cx + torsoW, torsoY + torsoH);
      gradBody.addColorStop(0, `rgb(${targetPalette[5].slice(0,3).join(',')})`); // Light Pink
      gradBody.addColorStop(1, `rgb(${targetPalette[4].slice(0,3).join(',')})`);

      ctx.fillStyle = gradBody;
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'miter';
      
      // Teardrop / bell-like dress
      ctx.beginPath();
      ctx.moveTo(cx, torsoY - 4); // Neck
      ctx.quadraticCurveTo(cx + torsoW, torsoY, cx + torsoW, torsoY + torsoH - 2); // right skirt
      ctx.lineTo(cx + 2, torsoY + torsoH); // zig zag bottom
      ctx.lineTo(cx, torsoY + torsoH - 1);
      ctx.lineTo(cx - 2, torsoY + torsoH);
      ctx.quadraticCurveTo(cx - torsoW, torsoY, cx, torsoY - 4); // left skirt
      ctx.fill(); ctx.stroke();

      // --- ARMS ---
      // Tiny folded arms on chest or holding chin
      ctx.beginPath();
      ctx.moveTo(cx - 4, torsoY);
      ctx.lineTo(cx - 1, torsoY + 3);
      ctx.lineTo(cx + 1, torsoY + 2);
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // --- HEAD ---
      const headX = cx;
      const headY = torsoY - 6 + breath*0.5 + emotionYOffset*0.3;
      const headW = 7 + overrideSquash * 0.2;
      const headH = 6.5 - overrideSquash * 0.2;

      // Pointy Elven Ears (Behind face)
      const drawEar = (isRight: boolean) => {
         const dir = isRight ? 1 : -1;
         const earDroop = (mood === 'sad' || mood === 'dead' || mood === 'sick') ? 4 : (overrideJump > 2 ? -2 : 0);
         
         ctx.fillStyle = `rgb(${targetPalette[5].slice(0,3).join(',')})`;
         ctx.strokeStyle = outlineColor;
         ctx.lineWidth = 1.5;
         
         ctx.beginPath();
         ctx.moveTo(headX + 4*dir, headY);
         ctx.quadraticCurveTo(headX + 10*dir, headY - 2 + earDroop, headX + 14*dir, headY - 4 + earDroop*2); // tip
         ctx.quadraticCurveTo(headX + 9*dir, headY + 2 + earDroop, headX + 3*dir, headY + 3); // bottom
         ctx.fill(); ctx.stroke();
      };
      drawEar(true); // Right ear
      drawEar(false); // Left ear

      // Face silhouette
      const gradHead = ctx.createRadialGradient(headX - 2, headY - 2, 1, headX, headY, headW * 1.5);
      gradHead.addColorStop(0, `rgb(${targetPalette[6].slice(0,3).join(',')})`); // Yellowish glow
      gradHead.addColorStop(0.5, `rgb(${targetPalette[5].slice(0,3).join(',')})`); // Light Pink
      gradHead.addColorStop(1, `rgb(${targetPalette[4].slice(0,3).join(',')})`);

      ctx.fillStyle = gradHead;
      ctx.beginPath(); 
      ctx.ellipse(headX, headY, headW, headH, 0, 0, Math.PI * 2); 
      ctx.fill(); ctx.stroke();

      // Glowing Cheeks
      if (mood !== 'dead' && mood !== 'sick') {
          ctx.fillStyle = `rgba(${targetPalette[2][0]}, ${targetPalette[2][1]}, ${targetPalette[2][2]}, 0.3)`;
          ctx.beginPath(); ctx.ellipse(headX - 4, headY + 2, 2, 1, -0.2, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(headX + 4, headY + 2, 2, 1, 0.2, 0, Math.PI*2); ctx.fill();
      }

      // --- HAIR / CROWN ---
      // A sweeping tuft of golden/magical hair across the forehead and back
      ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`; // Gold
      ctx.strokeStyle = outlineColor;
      
      // Ahoge (cowlick)
      const ahogeSway = Math.sin(frame * 0.1) * 2;
      ctx.beginPath();
      ctx.moveTo(headX, headY - headH + 1);
      ctx.quadraticCurveTo(headX + 4 + ahogeSway, headY - headH - 6, headX + 8 + ahogeSway, headY - headH - 4);
      ctx.quadraticCurveTo(headX + 2 + ahogeSway, headY - headH - 3, headX + 2, headY - headH + 1);
      ctx.fill(); ctx.stroke();

      // Bangs
      ctx.beginPath();
      ctx.moveTo(headX - headW, headY - 1);
      ctx.quadraticCurveTo(headX - 4, headY - headH - 1, headX + 2, headY - headH);
      ctx.quadraticCurveTo(headX - 2, headY - 3, headX + 6, headY - 1); // sweep right
      ctx.quadraticCurveTo(headX + headW, headY - headH, headX + headW, headY - 2);
      ctx.quadraticCurveTo(headX, headY - headH - 4, headX - headW, headY - 1);
      ctx.fill(); ctx.stroke();

      // DESSIN DES YEUX (Grands Yeux style chibi magical)
      ctx.fillStyle = outlineColor;
      const eyeSpacing = 3;
      const eyeY = headY + 0.5;
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              ctx.fillStyle = outlineColor;
              ctx.beginPath(); ctx.ellipse(x, y, 1.8, 2.5, 0, 0, Math.PI*2); ctx.fill();
              // Magic highlight
              ctx.fillStyle = `rgb(${targetPalette[7].slice(0,3).join(',')})`; // white
              ctx.beginPath(); ctx.ellipse(x - 0.5, y - 0.5, 0.6, 0.8, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'happy') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             ctx.arc(x, y + 1, 1.5, Math.PI, Math.PI * 2);
             ctx.stroke();
          }
           if (finalEyesStyle === 'closed') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             ctx.moveTo(x - 1.5, y + 1);
             ctx.lineTo(x + 1.5, y + 1);
             ctx.stroke();
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = outlineColor;
              ctx.beginPath(); ctx.ellipse(x, y, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#60a5fa'; // Blue tear
              ctx.fillRect(x - 1, y + 1, 2, 1.5 + Math.abs(Math.sin(frame*0.05))*1.5);
              ctx.fillStyle = `rgb(${targetPalette[7].slice(0,3).join(',')})`; // white
              ctx.beginPath(); ctx.ellipse(x - 0.5, y - 0.5, 0.6, 0.8, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'half-closed') {
              ctx.fillStyle = outlineColor;
              ctx.beginPath(); ctx.ellipse(x, y + 1, 1.8, 1.5, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`; // eyelid
              ctx.fillRect(x - 2, y - 2, 4, 3);
          }
          if (finalEyesStyle === 'dead') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             ctx.moveTo(x - 1.5, y - 1); ctx.lineTo(x + 1.5, y + 2);
             ctx.moveTo(x + 1.5, y - 1); ctx.lineTo(x - 1.5, y + 2);
             ctx.stroke();
          }
          if (finalEyesStyle === 'sick') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             const turn = frame * 0.05 + (isRight ? 2 : 0); 
             ctx.arc(x, y, 1.5, turn, turn + Math.PI * 1.5);
             ctx.stroke();
          }
          if (finalEyesStyle === 'angry') {
             // Frowning eyes
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x - 2, y - 2); ctx.lineTo(x + 1.5, y - 0.5); 
             } else {
                 ctx.moveTo(x + 2, y - 2); ctx.lineTo(x - 1.5, y - 0.5); 
             }
             ctx.stroke();
             ctx.fillStyle = outlineColor;
             ctx.beginPath(); ctx.ellipse(x, y + 1, 1.2, 1.2, 0, 0, Math.PI*2); ctx.fill();
          }
           if (finalEyesStyle === 'surprised') {
             ctx.fillStyle = outlineColor;
             ctx.beginPath(); ctx.ellipse(x, y - 1.5, 1.2, 1.8, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'squished') {
             ctx.strokeStyle = outlineColor;
             ctx.lineWidth = 1.5;
             ctx.lineJoin = 'round';
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x + 1.5, y - 1); ctx.lineTo(x - 1, y); ctx.lineTo(x + 1.5, y + 1.5);
             } else {
                 ctx.moveTo(x - 1.5, y - 1); ctx.lineTo(x + 1, y); ctx.lineTo(x - 1.5, y + 1.5);
             }
             ctx.stroke();
          }
      };

      drawEye(headX - eyeSpacing, eyeY, false);
      drawEye(headX + eyeSpacing, eyeY, true);

      return { targetPalette };
  }
};
