import { Canvas, useCanvasRef } from '@duxapp/react-native-canvas';
import { useEffect } from 'react';

import { createBenchmarkLoop } from './lib/canvasBenchmark';

export default function HomeScreen() {
  const ref = useCanvasRef();

  useEffect(() => {
    let active = true;
    let frameId = 0;

    ref.current?.getCanvas().then(({ canvas, size }) => {
      if (!active) {
        return;
      }

      const ctx = canvas.getContext('2d');
      const drawFrame = createBenchmarkLoop({
        ctx,
        getSize: () => ({ width: size.width, height: size.height }),
      });

      const render = (now: number) => {
        if (!active) {
          return;
        }

        drawFrame(now);
        frameId = requestAnimationFrame(render);
      };

      frameId = requestAnimationFrame(render);
    });

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [ref]);

  return <Canvas ref={ref} picture style={{ flex: 1 }} />;
}
