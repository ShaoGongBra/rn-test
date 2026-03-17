import { Skia, matchFont, type SkPicture } from '@shopify/react-native-skia';
import { Platform } from 'react-native';

export const TOTAL_SHAPES = 4000;

export type Size = {
  width: number;
  height: number;
};

type ShapeBase = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  phase: number;
};

type CircleShape = ShapeBase & {
  kind: 'circle';
  radius: number;
};

type RectShape = ShapeBase & {
  kind: 'rect';
  width: number;
  height: number;
};

type LineShape = ShapeBase & {
  kind: 'line';
  length: number;
  angle: number;
  lineWidth: number;
};

type Shape = CircleShape | RectShape | LineShape;

type FpsState = {
  fps: number;
  frameCount: number;
  lastTime: number;
};

const palette = ['#0f766e', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];
const background = '#f8fafc';
const fpsBg = '#0f172a';
const fpsText = '#f8fafc';

let fpsFontCache: ReturnType<typeof matchFont> | null = null;

const getFpsFont = () => {
  if (fpsFontCache) {
    return fpsFontCache;
  }

  const fpsFontFamily = Platform.select({
    android: 'sans-serif',
    ios: 'System',
    default: 'System',
  });

  fpsFontCache = matchFont({
    fontFamily: fpsFontFamily,
    fontSize: 18,
    fontWeight: 'bold',
  });

  return fpsFontCache;
};

const createRandom = (seed: number) => {
  let current = seed;
  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

const random = createRandom(20260317);

const shapes: Shape[] = Array.from({ length: TOTAL_SHAPES }, (_, index) => {
  const pick = index % 3;
  const base: ShapeBase = {
    x: random(),
    y: random(),
    dx: random() * 2 - 1,
    dy: random() * 2 - 1,
    color: palette[index % palette.length],
    phase: random() * Math.PI * 2,
  };

  if (pick === 0) {
    return {
      ...base,
      kind: 'circle',
      radius: 8 + random() * 18,
    };
  }

  if (pick === 1) {
    return {
      ...base,
      kind: 'rect',
      width: 16 + random() * 34,
      height: 16 + random() * 34,
    };
  }

  return {
    ...base,
    kind: 'line',
    length: 20 + random() * 44,
    angle: random() * Math.PI * 2,
    lineWidth: 1 + random() * 4,
  };
});

const getOffset = (time: number, speed: number, phase: number) => Math.sin(time * speed + phase);

const resolvePoint = (shape: ShapeBase, size: Size, time: number) => {
  const driftX = getOffset(time, 0.0012, shape.phase) * 28 * shape.dx;
  const driftY = getOffset(time, 0.0016, shape.phase + 1.7) * 28 * shape.dy;

  return {
    x: shape.x * size.width + driftX,
    y: shape.y * size.height + driftY,
  };
};

export const updateFps = (state: FpsState, now: number): FpsState => {
  const frameCount = state.frameCount + 1;

  if (state.lastTime === 0) {
    return {
      fps: state.fps,
      frameCount,
      lastTime: now,
    };
  }

  const elapsed = now - state.lastTime;
  if (elapsed < 500) {
    return {
      fps: state.fps,
      frameCount,
      lastTime: state.lastTime,
    };
  }

  return {
    fps: Math.round((frameCount * 1000) / elapsed),
    frameCount: 0,
    lastTime: now,
  };
};

const drawCanvasFps = (ctx: CanvasRenderingContext2D, fps: number) => {
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = fpsBg;
  ctx.fillRect(16, 16, 92, 36);
  ctx.globalAlpha = 1;
  ctx.fillStyle = fpsText;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`FPS ${fps}`, 28, 40);
};

export const drawCanvasFrame = (
  ctx: CanvasRenderingContext2D,
  size: Size,
  time: number,
  fps: number,
  dpr = 1
) => {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size.width, size.height);

  for (const shape of shapes) {
    const point = resolvePoint(shape, size, time);
    ctx.globalAlpha = 0.78;

    if (shape.kind === 'circle') {
      ctx.beginPath();
      ctx.fillStyle = shape.color;
      ctx.arc(point.x, point.y, shape.radius, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    if (shape.kind === 'rect') {
      ctx.fillStyle = shape.color;
      ctx.fillRect(point.x - shape.width / 2, point.y - shape.height / 2, shape.width, shape.height);
      continue;
    }

    const angle = shape.angle + time * 0.0012 + shape.phase;
    const half = shape.length / 2;
    const x1 = point.x - Math.cos(angle) * half;
    const y1 = point.y - Math.sin(angle) * half;
    const x2 = point.x + Math.cos(angle) * half;
    const y2 = point.y + Math.sin(angle) * half;

    ctx.beginPath();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.lineWidth;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  drawCanvasFps(ctx, fps);
};

export const createSkiaFrame = (size: Size, time: number, fps: number): SkPicture =>
  (() => {
    const recorder = Skia.PictureRecorder();
    const bounds = Skia.XYWHRect(0, 0, size.width, size.height);
    const canvas = recorder.beginRecording(bounds);
    const fillPaint = Skia.Paint();
    fillPaint.setAntiAlias(true);
    fillPaint.setColor(Skia.Color(background));
    canvas.drawRect(Skia.XYWHRect(0, 0, size.width, size.height), fillPaint);

    const strokePaint = Skia.Paint();
    strokePaint.setAntiAlias(true);
    strokePaint.setStyle(1);

    for (const shape of shapes) {
      const point = resolvePoint(shape, size, time);
      const color = Skia.Color(shape.color);

      if (shape.kind === 'circle') {
        fillPaint.setColor(color);
        fillPaint.setAlphaf(0.78);
        canvas.drawCircle(point.x, point.y, shape.radius, fillPaint);
        continue;
      }

      if (shape.kind === 'rect') {
        fillPaint.setColor(color);
        fillPaint.setAlphaf(0.78);
        canvas.drawRect(
          Skia.XYWHRect(point.x - shape.width / 2, point.y - shape.height / 2, shape.width, shape.height),
          fillPaint
        );
        continue;
      }

      const angle = shape.angle + time * 0.0012 + shape.phase;
      const half = shape.length / 2;
      const x1 = point.x - Math.cos(angle) * half;
      const y1 = point.y - Math.sin(angle) * half;
      const x2 = point.x + Math.cos(angle) * half;
      const y2 = point.y + Math.sin(angle) * half;

      strokePaint.setColor(color);
      strokePaint.setAlphaf(0.78);
      strokePaint.setStrokeWidth(shape.lineWidth);
      canvas.drawLine(x1, y1, x2, y2, strokePaint);
    }

    const fpsBoxPaint = Skia.Paint();
    fpsBoxPaint.setAntiAlias(true);
    fpsBoxPaint.setColor(Skia.Color(fpsBg));
    fpsBoxPaint.setAlphaf(0.92);
    canvas.drawRect(Skia.XYWHRect(16, 16, 92, 36), fpsBoxPaint);

    const textPaint = Skia.Paint();
    textPaint.setAntiAlias(true);
    textPaint.setColor(Skia.Color(fpsText));
    textPaint.setAlphaf(1);
    const fpsBlob = Skia.TextBlob.MakeFromText(`FPS ${fps}`, getFpsFont());
    canvas.drawTextBlob(fpsBlob, 28, 40, textPaint);

    const picture = recorder.finishRecordingAsPicture();
    bounds.dispose?.();
    fillPaint.dispose?.();
    strokePaint.dispose?.();
    fpsBoxPaint.dispose?.();
    textPaint.dispose?.();
    fpsBlob.dispose?.();
    return picture;
  })();
