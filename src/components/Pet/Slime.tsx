import React, { useEffect, useRef } from 'react';
import type { Mood } from '../../core/pet';

// Palette stricte de 8 couleurs (Dark Fantasy Slime)
const PALETTE = [
  [0, 0, 0, 0],         // 0: Transparent
  [2, 6, 23, 255],      // 1: Outline / Dark background (#020617)
  [6, 78, 59, 255],     // 2: Deep shadow green (#064e3b)
  [21, 128, 61, 255],   // 3: Dark green (#15803d)
  [34, 197, 94, 255],   // 4: Base green (#22c55e)
  [74, 222, 128, 255],  // 5: Light green (#4ade80)
  [134, 239, 172, 255], // 6: Highlight green (#86efac)
  [255, 255, 255, 255]  // 7: Pure white (specular)
];

const DEAD_PALETTE = [
  [0, 0, 0, 0],
  [2, 6, 23, 255],
  [31, 41, 55, 255],   
  [55, 65, 81, 255],   
  [75, 85, 99, 255],   
  [156, 163, 175, 255], 
  [209, 213, 219, 255], 
  [255, 255, 255, 255]
];

const SICK_PALETTE = [
  [0, 0, 0, 0],
  [2, 6, 23, 255],
  [20, 83, 45, 255],    
  [6, 95, 70, 255],     
  [5, 150, 105, 255],   
  [163, 230, 53, 255],  
  [217, 249, 157, 255], 
  [255, 255, 255, 255]
];

const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
};

export const Slime: React.FC<{ size?: number, mood: Mood }> = ({ size = 256, mood }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let frame = 0;
    let animationFrameId: number;
    const CANVAS_SIZE = 64;

    // --- Variables d'interaction au clic ---
    let interactionFrame = 0;
    let interactionType = 0;

    const handleCanvasClick = () => {
        // Seulement s'il n'est pas déjà en train de faire l'anim, et pas mort
        if (interactionFrame <= 0 && mood !== 'dead') {
            interactionFrame = 90; // durée de l'interaction augmentée (1.5 secondes)
            interactionType = Math.floor(Math.random() * 6); // 6 animations possibles
        }
    };
    canvas.addEventListener('mousedown', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      let eyesStyle = 'normal';
      let emotionYOffset = 0;
      let targetPalette = PALETTE;
      
      let jumpOffset = 0;
      let shapeSquash = 0;
      let shiverX = 0;
      
      let breath = Math.sin(frame * 0.02) * 0.8; 
      
      switch (mood) {
        case 'happy':
          jumpOffset = Math.abs(Math.sin(frame * 0.04) * 8); // Rebond 2x plus lent
          if (jumpOffset < 2) shapeSquash = Math.abs(jumpOffset - 2) * 2; 
          eyesStyle = 'happy';
          break;
        case 'dead':
          targetPalette = DEAD_PALETTE;
          eyesStyle = 'dead';
          emotionYOffset = 5; 
          breath = 0; 
          shapeSquash = 4; 
          break;
        case 'sick':
          targetPalette = SICK_PALETTE;
          eyesStyle = 'sick';
          emotionYOffset = 2; 
          shiverX = (Math.random() - 0.5) * 1.5;
          breath = Math.sin(frame * 0.05) * 0.8; // Fievre 2x plus lente
          shapeSquash = 2;
          break;
        case 'sleeping':
          eyesStyle = 'closed';
          emotionYOffset = 3;
          breath = Math.sin(frame * 0.015) * 2; 
          shapeSquash = 3;
          break;
        case 'sad':
          emotionYOffset = 3; 
          eyesStyle = 'watery';
          shapeSquash = 4; 
          breath = Math.sin(frame * 0.01) * 0.5; 
          break;
        case 'bored':
          eyesStyle = 'half-closed';
          const sigh = Math.max(0, Math.sin(frame * 0.02)) * 3; 
          emotionYOffset = 2 + sigh;
          shapeSquash = 2 + sigh;
          breath = 0; 
          break;
        case 'neutral':
        default:
          break;
      }

      // --- LOGIQUE D'INTERACTION ---
      let overrideEyes = null;
      let overrideSquash = 0;
      let overrideJump = 0;
      let overrideShiver = 0;

      if (interactionFrame > 0) {
          const progress = 1 - (interactionFrame / 90); // de 0 à 1, calculé sur 90 frames
          
          if (interactionType === 0) {
              // 1. Wobble = Secousse Gélatineuse ultra rapide
              overrideSquash = Math.sin(progress * Math.PI * 6) * (4 * (1-progress)); 
              overrideShiver = Math.cos(progress * Math.PI * 8) * (5 * (1-progress));
              overrideEyes = 'surprised'; // O O
          } else if (interactionType === 1) {
              // 2. Squish violent (comme si on appuyait dessus) > <
              if (progress < 0.3) {
                  overrideSquash = progress * 20; // s'écrase rapidement vers 6
                  overrideJump = - (progress * 5); // va un peu vers le bas
              } else {
                  // Remonte élastiquement
                  const popProgress = (progress - 0.3) / 0.7;
                  overrideSquash = Math.cos(popProgress * Math.PI * 5) * (6 * (1-popProgress));
              }
              overrideEyes = 'squished';
          } else if (interactionType === 2) {
              // 3. Petit saut surpris
              overrideJump = Math.sin(progress * Math.PI) * 16; 
              overrideEyes = 'surprised';
              // Rétracte son corps en sautant
              if (progress > 0.1 && progress < 0.9) overrideSquash = -3;
          } else if (interactionType === 3) {
              // 4. Super Stretch (s'étire tout en hauteur)
              overrideSquash = Math.sin(progress * Math.PI) * -12; // Largeur très fine, Hauteur immense
              overrideEyes = 'happy';
          } else if (interactionType === 4) {
              // 5. Melt / Flaque fondue transitoire
              if (progress < 0.2) {
                  overrideSquash = (progress / 0.2) * 8; 
                  overrideEyes = 'closed';
              } else if (progress < 0.8) {
                  overrideSquash = 8 + Math.sin(progress * Math.PI * 10); // frétille à plat
                  overrideEyes = 'half-closed';
              } else {
                  overrideSquash = ((1 - progress) / 0.2) * 8; // se reforme
                  overrideEyes = 'surprised';
              }
          } else if (interactionType === 5) {
              // 6. Angry growl (vibrait de colère)
              overrideShiver = (Math.random() - 0.5) * 4;
              overrideJump = (Math.random() - 0.5) * 2;
              overrideSquash = -2; // Se ramasse légèrement
              overrideEyes = 'angry';
          }
          
          interactionFrame--;
      }

      // Application des valeurs finales
      const cx = CANVAS_SIZE / 2 + shiverX + overrideShiver;
      const cy = CANVAS_SIZE / 2 + 16 - jumpOffset - overrideJump + emotionYOffset;
      const w = 18 + breath + shapeSquash + overrideSquash; 
      const h = 18 - breath/2 - shapeSquash - overrideSquash/2; 

      // Ombre portee
      ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
      ctx.beginPath();
      // L'ombre bouge avec les shakes mais pas les sauts
      ctx.ellipse(CANVAS_SIZE / 2 + overrideShiver * 0.5, CANVAS_SIZE / 2 + 20, (18 + shapeSquash + overrideSquash) * 0.9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      const drawOrganicBody = (x: number, y: number, width: number, height: number) => {
          ctx.beginPath();
          ctx.moveTo(x - width*0.8, y + height*0.6);
          ctx.bezierCurveTo(x - width*0.4, y + height*0.8, x + width*0.4, y + height*0.8, x + width*0.8, y + height*0.6); 
          ctx.bezierCurveTo(x + width*1.1, y + height*0.1, x + width*0.8, y - height, x, y - height*1.1); 
          ctx.bezierCurveTo(x - width*0.8, y - height, x - width*1.1, y + height*0.1, x - width*0.8, y + height*0.6); 
          ctx.closePath();
      };

      const grad = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, w * 1.5);
      grad.addColorStop(0, `rgba(${targetPalette[6][0]}, ${targetPalette[6][1]}, ${targetPalette[6][2]}, 1)`); 
      grad.addColorStop(0.3, `rgb(${targetPalette[5].slice(0,3).join(',')})`);
      grad.addColorStop(0.7, `rgb(${targetPalette[4].slice(0,3).join(',')})`);
      grad.addColorStop(1, `rgb(${targetPalette[2].slice(0,3).join(',')})`);

      // Outline
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      drawOrganicBody(cx, cy, w + 1.5, h + 1.5);
      ctx.fill();

      // Interieur
      ctx.fillStyle = grad;
      drawOrganicBody(cx, cy, w, h);
      ctx.fill();
      
      // Magic core
      ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`;
      ctx.beginPath();
      if (mood !== 'dead') {
         ctx.ellipse(cx - w*0.35, cy - h*0.4, w * 0.25, h * 0.15, -0.6, 0, Math.PI * 2);
         ctx.fill();
      } else {
         ctx.ellipse(cx - w*0.35, cy - h*0.4, w * 0.1, h * 0.05, -0.6, 0, Math.PI * 2);
         ctx.fill();
      }

      // DESSIN DES YEUX
      ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
      const eyeSpacing = 8 + (breath * 0.5) + (overrideSquash * 0.3); // Les yeux s'écartent pendant le squish!
      const eyeY = (mood === 'sad' || mood === 'dead') ? (cy + 2) : (cy - 1);
      
      const finalEyesStyle = overrideEyes || eyesStyle;

      const drawEye = (x: number, y: number, isRight: boolean) => {
          if (finalEyesStyle === 'normal') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = 'white';
              ctx.beginPath(); ctx.ellipse(x - 1, y - 2, 1.5, 2, 0, 0, Math.PI*2); ctx.fill();
              ctx.beginPath(); ctx.ellipse(x + 1, y + 3, 0.8, 1, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'happy') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2.5;
             ctx.beginPath();
             ctx.arc(x, y + 3, 4, Math.PI, Math.PI * 2);
             ctx.stroke();
          }
          if (finalEyesStyle === 'closed') {
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.fillRect(x - 3, y + 2, 6, 2); 
             if (!isRight && frame % 120 < 60 && !overrideEyes) {
                 ctx.fillStyle = `rgb(${targetPalette[6].slice(0,3).join(',')})`;
                 ctx.font = "bold 8px monospace";
                 ctx.fillText('z', x + 12, y - 14 - Math.floor((frame % 60)/3));
             }
          }
          if (finalEyesStyle === 'watery') {
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x, y, 4.5, 3.5, isRight?-0.2:0.2, 0, Math.PI*2); ctx.fill();
              
              ctx.fillStyle = 'white';
              ctx.beginPath(); ctx.ellipse(x - 1, y + 1.5, 1.5, 1, 0, 0, Math.PI*2); ctx.fill();
              
              ctx.fillStyle = '#60a5fa';
              ctx.fillRect(x - 2, y + 3, 2, 3 + Math.abs(Math.sin(frame*0.05))*2);
              if(isRight && frame % 80 > 60) {
                ctx.fillRect(x - 2, y + 6 + (frame%80 - 60), 2, 2);
              }
          }
          if (finalEyesStyle === 'half-closed') {
              const lookDirX = Math.sin(frame * 0.02) * 1.5;
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.beginPath(); ctx.ellipse(x + lookDirX, y + 1, 3.5, 3.5, 0, 0, Math.PI*2); ctx.fill();
              
              ctx.fillStyle = 'white';
              ctx.beginPath(); ctx.ellipse(x + lookDirX - 1, y, 1, 0.8, 0, 0, Math.PI*2); ctx.fill();

              ctx.fillStyle = `rgb(${targetPalette[4].slice(0,3).join(',')})`; 
              ctx.fillRect(x - 5, y - 5, 10, 5); 
              
              ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
              ctx.fillRect(x - 3.5, y - 1, 7, 1.5);
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
             ctx.arc(x, y, 1.5, turn, turn + Math.PI * 1.5);
             ctx.stroke();
             ctx.beginPath();
             ctx.arc(x, y, 3, turn + Math.PI, turn + Math.PI * 2.5);
             ctx.stroke();
             
             if (!isRight && frame % 90 < 45) {
                 ctx.fillStyle = '#60a5fa'; 
                 const sweatY = (frame % 45) * 0.3; 
                 ctx.beginPath(); ctx.ellipse(cx - w*0.8, cy - h*0.3 + sweatY, 1.5, 2.5, -0.2, 0, Math.PI*2); ctx.fill();
             }
          }
          // -- NOUVEAUX YEUX D'INTERACTION --
          if (finalEyesStyle === 'angry') {
             // > < fâchés \ /
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 1.5;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x - 2.5, y - 2); ctx.lineTo(x + 2, y + 0.5); 
             } else {
                 ctx.moveTo(x + 2.5, y - 2); ctx.lineTo(x - 2, y + 0.5); 
             }
             ctx.stroke();
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x + (isRight?-0.5:0.5), y + 1.5, 1.5, 1.5, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'surprised') {
             // O_O Petits yeux ronds dilatés au milieu
             ctx.fillStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.beginPath(); ctx.ellipse(x, y - 2, 2.5, 2.5, 0, 0, Math.PI*2); ctx.fill();
          }
          if (finalEyesStyle === 'squished') {
             // > < Yeux fermés fort
             ctx.strokeStyle = `rgb(${targetPalette[1].slice(0,3).join(',')})`;
             ctx.lineWidth = 2;
             ctx.beginPath();
             if (!isRight) {
                 ctx.moveTo(x + 3, y - 3); ctx.lineTo(x - 1, y); ctx.lineTo(x + 3, y + 3);
             } else {
                 ctx.moveTo(x - 3, y - 3); ctx.lineTo(x + 1, y); ctx.lineTo(x - 3, y + 3);
             }
             ctx.stroke();
          }
      };

      drawEye(cx - eyeSpacing - 2, eyeY, false);
      drawEye(cx + eyeSpacing + 2, eyeY, true);

      // PASSE DE POST-TRAITEMENT STRICT PIXEL ART
      const imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 10) continue; 

        if (data[i] <= 10 && data[i+1] <= 10 && data[i+2] <= 30 && data[i+3] > 0 && data[i+3] < 200) {
            const px = (i / 4) % CANVAS_SIZE;
            const py = Math.floor((i / 4) / CANVAS_SIZE);
            if ((px + py) % 2 === 0) {
                data[i] = targetPalette[1][0]; 
                data[i+1] = targetPalette[1][1]; 
                data[i+2] = targetPalette[1][2]; 
                data[i+3] = 100;
            } else {
                data[i+3] = 0;
            }
            continue;
        }

        data[i + 3] = 255; 

        const r = data[i]; const g = data[i+1]; const b = data[i+2];
        const isBlueLiquid = (r < 100 && g > 150 && b > 200); 

        if (!isBlueLiquid) {
            let closestColor = targetPalette[1];
            let minDistance = Infinity;
            for (let j = 1; j < targetPalette.length; j++) {
              const palC = targetPalette[j];
              const dist = colorDistance(r, g, b, palC[0], palC[1], palC[2]);
              if (dist < minDistance) {
                minDistance = dist;
                closestColor = palC;
              }
            }
            data[i] = closestColor[0];
            data[i+1] = closestColor[1];
            data[i+2] = closestColor[2];
        }
      }

      ctx.putImageData(imgData, 0, 0);

      frame++;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
        cancelAnimationFrame(animationFrameId);
        canvas.removeEventListener('mousedown', handleCanvasClick);
        canvas.removeEventListener('touchstart', handleCanvasClick);
    }
  }, [mood]);

  let haloColor = 'rgba(34,197,94,0.15)'; 
  if (mood === 'dead') haloColor = 'rgba(156,163,175,0.15)'; 
  if (mood === 'sick') haloColor = 'rgba(163,230,53,0.15)'; 
  if (mood === 'sad') haloColor = 'rgba(59,130,246,0.1)'; 

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
       <div style={{
          position: 'absolute',
          top: '50%', left: '50%', width: size * 0.8, height: size * 0.8,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${haloColor} 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none'
       }} />
       
       <canvas
          ref={canvasRef}
          width={64}
          height={64}
          style={{
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            imageRendering: 'pixelated', 
            cursor: mood === 'dead' ? 'default' : 'pointer',
          }}
        />
    </div>
  );
};
