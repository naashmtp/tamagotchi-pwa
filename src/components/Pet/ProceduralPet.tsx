import React, { useEffect, useRef } from 'react';
import type { Mood } from '../../core/pet';
import type { ProceduralRenderer } from './renderers/types';

interface ProceduralPetProps {
  mood: Mood;
  size?: number;
  renderer: ProceduralRenderer;
}

const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
};

export const ProceduralPet: React.FC<ProceduralPetProps> = ({ size = 256, mood, renderer }) => {
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
        // Seulement s'il n'est pas mort / déjà en anim
        if (interactionFrame <= 0 && mood !== 'dead') {
            interactionFrame = 90; // durée de l'interaction (1.5s à 60fps)
            interactionType = Math.floor(Math.random() * 6); // 6 animations
        }
    };
    canvas.addEventListener('mousedown', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasClick, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const interactionProgress = interactionFrame > 0 ? (1 - (interactionFrame / 90)) : 0;

      // 1. DESSIN PAR LE RENDERER DE L'ESPECE
      const result = renderer.draw({
          ctx,
          frame,
          mood,
          interactionProgress,
          interactionType,
          CANVAS_SIZE
      });

      const targetPalette = result.targetPalette;

      if (interactionFrame > 0) {
          interactionFrame--;
      }

      // 2. PASSE DE POST-TRAITEMENT STRICT PIXEL ART (QUANTIFICATION)
      const imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 10) continue; 

        // Gestion de l'ombre portée translucide ditherée
        if (data[i] <= 10 && data[i+1] <= 10 && data[i+2] <= 30 && data[i+3] > 0 && data[i+3] < 200) {
            const px = (i / 4) % CANVAS_SIZE;
            const py = Math.floor((i / 4) / CANVAS_SIZE);
            if ((px + py) % 2 === 0) {
                // Utilise la couleur 1 de la palette comme base d'ombre
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
        const isBlueLiquid = (targetPalette[0] && r < 100 && g > 150 && b > 200); // Larmes

        if (!isBlueLiquid) {
            let closestColor = targetPalette[1];
            let minDistance = Infinity;
            // On skip le 0 (transparent) mais cherche sur tout le reste
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
  }, [mood, renderer]);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
       <div style={{
          position: 'absolute',
          top: '50%', left: '50%', width: size * 0.8, height: size * 0.8,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${renderer.getHaloColor(mood)} 0%, transparent 70%)`,
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
