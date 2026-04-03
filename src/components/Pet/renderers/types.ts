import type { Mood } from '../../../core/pet';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  frame: number;
  mood: Mood;
  interactionProgress: number; // 0 to 1
  interactionType: number; // 0 t 5
  CANVAS_SIZE: number;
}

export interface RenderResult {
  targetPalette: number[][];
}

export interface ProceduralRenderer {
  draw(context: RenderContext): RenderResult;
  getHaloColor(mood: Mood): string;
}
