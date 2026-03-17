import { useEffect, useRef } from 'react';

import { createBenchmarkLoop } from './lib/canvasBenchmark';

export default function WebCanvasBenchmark() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    let frameId = 0;

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const updateCanvasSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    updateCanvasSize();

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const drawFrame = createBenchmarkLoop({
      ctx,
      getSize: () => ({
        width: canvas.width / window.devicePixelRatio,
        height: canvas.height / window.devicePixelRatio,
      }),
      beforeDraw: () => {
        ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      },
    });

    const render = (now: number) => {
      if (!active) {
        return;
      }

      drawFrame(now);
      frameId = requestAnimationFrame(render);
    };

    const onResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', onResize);
    frameId = requestAnimationFrame(render);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'block',
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
