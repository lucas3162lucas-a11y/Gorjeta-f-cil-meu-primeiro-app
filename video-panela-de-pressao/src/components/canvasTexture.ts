import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

// Textura desenhada num <canvas> 2D (textos nítidos em objetos 3D: conta, holerite, placas).
// A chave `key` define quando redesenhar; o desenho é função pura do conteúdo.

export const useCanvasTexture = (key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) =>
  useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    draw(ctx, width, height);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, width, height]);

export const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
