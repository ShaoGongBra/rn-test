import {
  BlurStyle,
  matchFont,
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkFont,
  type SkMaskFilter,
  type SkPaint,
  type SkPathEffect,
  type SkPicture,
  type SkPictureRecorder,
} from '@shopify/react-native-skia';

import { drawBenchmarkFrame, updateFps } from './canvasBenchmark';

type Size = {
  width: number;
  height: number;
};

type FontState = {
  family: string;
  size: number;
  weight: 'normal' | 'bold';
};

type DrawState = {
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  globalAlpha: number;
  font: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  lineDash: number[];
};

const DEFAULT_STATE: DrawState = {
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  globalAlpha: 1,
  font: '10px sans-serif',
  shadowColor: 'rgba(0,0,0,0)',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  lineDash: [],
};

const transparentColor = 'rgba(0,0,0,0)';
const fontCache = new Map<string, SkFont>();
const colorCache = new Map<string, ReturnType<typeof Skia.Color>>();

const cloneState = (state: DrawState): DrawState => ({
  ...state,
  lineDash: [...state.lineDash],
});

const parseFont = (font: string): FontState => {
  const tokens = font.trim().split(/\s+/);
  const sizeToken = tokens.find((token) => token.endsWith('px')) ?? '10px';
  const size = Number.parseFloat(sizeToken.replace('px', '')) || 10;

  return {
    family: tokens[tokens.length - 1] ?? 'sans-serif',
    size,
    weight: tokens.includes('bold') ? 'bold' : 'normal',
  };
};

const getFont = (font: string) => {
  const cached = fontCache.get(font);
  if (cached) {
    return cached;
  }

  const parsed = parseFont(font);
  const value = matchFont({
    fontFamily: parsed.family,
    fontSize: parsed.size,
    fontStyle: 'normal',
    fontWeight: parsed.weight,
  });
  fontCache.set(font, value);
  return value;
};

const normalizeColor = (color: string, alpha: number) => {
  const trimmed = color.trim();

  if (trimmed.startsWith('rgba(')) {
    const match = trimmed.match(/rgba\(([^)]+)\)/i);
    if (!match) {
      return trimmed;
    }
    const [r = '0', g = '0', b = '0', a = '1'] = match[1].split(',').map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, Number.parseFloat(a) * alpha))})`;
  }

  if (trimmed.startsWith('rgb(')) {
    const match = trimmed.match(/rgb\(([^)]+)\)/i);
    if (!match) {
      return trimmed;
    }
    const [r = '0', g = '0', b = '0'] = match[1].split(',').map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const [r, g, b] = hex.split('');
      return `rgba(${parseInt(r + r, 16)}, ${parseInt(g + g, 16)}, ${parseInt(b + b, 16)}, ${alpha})`;
    }
    if (hex.length === 6) {
      return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}, ${alpha})`;
    }
  }

  return trimmed;
};

const getSkColor = (color: string, alpha: number) => {
  const normalized = normalizeColor(color, alpha);
  const cached = colorCache.get(normalized);
  if (cached) {
    return cached;
  }
  const value = Skia.Color(normalized);
  colorCache.set(normalized, value);
  return value;
};

class SkiaBenchmarkContext {
  private recorder: SkPictureRecorder | null = null;
  private canvas: SkCanvas | null = null;
  private currentPath = Skia.Path.Make();
  private state: DrawState = cloneState(DEFAULT_STATE);
  private readonly stack: DrawState[] = [];
  private readonly fillPaint = Skia.Paint();
  private readonly strokePaint = Skia.Paint();
  private readonly shadowFillPaint = Skia.Paint();
  private readonly shadowStrokePaint = Skia.Paint();
  private currentFillKey = '';
  private currentStrokeKey = '';
  private currentDashPatternKey = '';
  private currentShadowMaskKey = '';
  private currentShadowStrokeMaskKey = '';
  private currentShadowColorKey = '';
  private currentShadowStrokeColorKey = '';
  private dashEffect: SkPathEffect | null = null;
  private shadowMask: SkMaskFilter | null = null;
  private shadowStrokeMask: SkMaskFilter | null = null;

  constructor() {
    this.fillPaint.setAntiAlias(true);
    this.fillPaint.setStyle(PaintStyle.Fill);
    this.strokePaint.setAntiAlias(true);
    this.strokePaint.setStyle(PaintStyle.Stroke);
    this.shadowFillPaint.setAntiAlias(true);
    this.shadowFillPaint.setStyle(PaintStyle.Fill);
    this.shadowStrokePaint.setAntiAlias(true);
    this.shadowStrokePaint.setStyle(PaintStyle.Stroke);
    this.currentPath.setIsVolatile(true);
  }

  beginFrame(width: number, height: number) {
    this.recorder = Skia.PictureRecorder();
    this.canvas = this.recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
  }

  finishFrame() {
    if (!this.recorder) {
      return null;
    }
    const picture = this.recorder.finishRecordingAsPicture();
    this.recorder = null;
    this.canvas = null;
    this.stack.length = 0;
    return picture;
  }

  get fillStyle() {
    return this.state.fillStyle;
  }

  set fillStyle(value: unknown) {
    this.state.fillStyle = String(value);
  }

  get strokeStyle() {
    return this.state.strokeStyle;
  }

  set strokeStyle(value: unknown) {
    this.state.strokeStyle = String(value);
  }

  get lineWidth() {
    return this.state.lineWidth;
  }

  set lineWidth(value: number) {
    this.state.lineWidth = value;
  }

  get globalAlpha() {
    return this.state.globalAlpha;
  }

  set globalAlpha(value: number) {
    this.state.globalAlpha = value;
  }

  get font() {
    return this.state.font;
  }

  set font(value: string) {
    this.state.font = value;
  }

  get shadowColor() {
    return this.state.shadowColor;
  }

  set shadowColor(value: string) {
    this.state.shadowColor = value;
  }

  get shadowBlur() {
    return this.state.shadowBlur;
  }

  set shadowBlur(value: number) {
    this.state.shadowBlur = value;
  }

  get shadowOffsetX() {
    return this.state.shadowOffsetX;
  }

  set shadowOffsetX(value: number) {
    this.state.shadowOffsetX = value;
  }

  get shadowOffsetY() {
    return this.state.shadowOffsetY;
  }

  set shadowOffsetY(value: number) {
    this.state.shadowOffsetY = value;
  }

  clearRect() {
    // Each frame records into a fresh picture.
  }

  fillRect(x: number, y: number, width: number, height: number) {
    const canvas = this.requireCanvas();
    const rect = Skia.XYWHRect(x, y, width, height);
    this.drawShadow((paint) => {
      canvas.drawRect(rect, paint);
    }, false);
    canvas.drawRect(rect, this.getFillPaint());
    rect.dispose?.();
  }

  strokeRect(x: number, y: number, width: number, height: number) {
    const canvas = this.requireCanvas();
    const rect = Skia.XYWHRect(x, y, width, height);
    const strokePaint = this.getStrokePaint();
    this.drawShadow((paint) => {
      canvas.drawRect(rect, paint);
    }, true);
    canvas.drawRect(rect, strokePaint);
    rect.dispose?.();
  }

  beginPath() {
    this.currentPath.rewind();
  }

  closePath() {
    this.currentPath.close();
  }

  moveTo(x: number, y: number) {
    this.currentPath.moveTo(x, y);
  }

  lineTo(x: number, y: number) {
    this.currentPath.lineTo(x, y);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
    this.currentPath.quadTo(cpx, cpy, x, y);
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
    this.currentPath.cubicTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  stroke() {
    const canvas = this.requireCanvas();
    const strokePaint = this.getStrokePaint();
    this.drawShadow((paint) => {
      canvas.drawPath(this.currentPath, paint);
    }, true);
    canvas.drawPath(this.currentPath, strokePaint);
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise = false) {
    const oval = Skia.XYWHRect(x - radius, y - radius, radius * 2, radius * 2);
    const fullCircle = Math.abs(endAngle - startAngle) >= Math.PI * 2 - 0.0001;

    if (fullCircle) {
      this.currentPath.addOval(oval);
      return;
    }

    let sweep = endAngle - startAngle;
    if (!anticlockwise && sweep < 0) {
      sweep += Math.PI * 2;
    } else if (anticlockwise && sweep > 0) {
      sweep -= Math.PI * 2;
    }

    this.currentPath.arcToOval(
      oval,
      (startAngle * 180) / Math.PI,
      (sweep * 180) / Math.PI,
      this.currentPath.countPoints() === 0
    );
  }

  fill() {
    const canvas = this.requireCanvas();
    this.drawShadow((paint) => {
      canvas.drawPath(this.currentPath, paint);
    }, false);
    canvas.drawPath(this.currentPath, this.getFillPaint());
  }

  fillText(text: string, x: number, y: number) {
    const canvas = this.requireCanvas();
    const font = getFont(this.state.font);
    this.drawShadow((paint) => {
      canvas.drawText(text, x, y, paint, font);
    }, false);
    canvas.drawText(text, x, y, this.getFillPaint(), font);
  }

  save() {
    this.stack.push(cloneState(this.state));
    this.requireCanvas().save();
  }

  restore() {
    const nextState = this.stack.pop();
    if (nextState) {
      this.state = nextState;
    }
    this.requireCanvas().restore();
  }

  translate(x: number, y: number) {
    this.requireCanvas().translate(x, y);
  }

  rotate(angle: number) {
    this.requireCanvas().rotate((angle * 180) / Math.PI, 0, 0);
  }

  scale(x: number, y: number) {
    this.requireCanvas().scale(x, y);
  }

  setLineDash(segments: number[]) {
    this.state.lineDash = [...segments];
  }

  dispose() {
    this.currentPath.dispose?.();
    this.fillPaint.dispose?.();
    this.strokePaint.dispose?.();
    this.shadowFillPaint.dispose?.();
    this.shadowStrokePaint.dispose?.();
    this.dashEffect?.dispose?.();
    this.shadowMask?.dispose?.();
    this.shadowStrokeMask?.dispose?.();
  }

  private requireCanvas() {
    if (!this.canvas) {
      throw new Error('Skia benchmark frame has not started');
    }
    return this.canvas;
  }

  private getFillPaint() {
    const fillKey = `${this.state.fillStyle}|${this.state.globalAlpha}`;
    if (fillKey !== this.currentFillKey) {
      this.fillPaint.setColor(getSkColor(this.state.fillStyle, this.state.globalAlpha));
      this.currentFillKey = fillKey;
    }
    return this.fillPaint;
  }

  private getStrokePaint() {
    const strokeKey = `${this.state.strokeStyle}|${this.state.globalAlpha}|${this.state.lineWidth}|${this.state.lineDash.join(',')}`;
    if (strokeKey !== this.currentStrokeKey) {
      this.strokePaint.setColor(getSkColor(this.state.strokeStyle, this.state.globalAlpha));
      this.strokePaint.setStrokeWidth(this.state.lineWidth);

      const nextDashPatternKey = this.state.lineDash.join(',');
      if (nextDashPatternKey) {
        if (nextDashPatternKey !== this.currentDashPatternKey) {
          this.dashEffect?.dispose?.();
          this.dashEffect = Skia.PathEffect.MakeDash(this.state.lineDash, 0);
          this.currentDashPatternKey = nextDashPatternKey;
        }
        this.strokePaint.setPathEffect(this.dashEffect);
      } else {
        this.strokePaint.setPathEffect(null);
        this.currentDashPatternKey = '';
      }

      this.currentStrokeKey = strokeKey;
    }
    return this.strokePaint;
  }

  private getShadowPaint(stroke: boolean) {
    const paint = stroke ? this.shadowStrokePaint : this.shadowFillPaint;
    const color = stroke ? this.state.strokeStyle : this.state.fillStyle;
    const shadowColor = this.state.shadowColor === transparentColor ? color : this.state.shadowColor;
    const colorKey = `${shadowColor}|${this.state.globalAlpha}`;
    const maskKey = `${this.state.shadowBlur}`;

    if (stroke) {
      paint.setStrokeWidth(this.state.lineWidth);
      const dash = this.state.lineDash.join(',');
      paint.setPathEffect(dash ? this.dashEffect : null);
      if (colorKey !== this.currentShadowStrokeColorKey) {
        paint.setColor(getSkColor(shadowColor, this.state.globalAlpha));
        this.currentShadowStrokeColorKey = colorKey;
      }
      if (maskKey !== this.currentShadowStrokeMaskKey) {
        this.shadowStrokeMask?.dispose?.();
        this.shadowStrokeMask = this.state.shadowBlur > 0
          ? Skia.MaskFilter.MakeBlur(BlurStyle.Normal, this.state.shadowBlur / 2, true)
          : null;
        paint.setMaskFilter(this.shadowStrokeMask);
        this.currentShadowStrokeMaskKey = maskKey;
      }
      return paint;
    }

    if (colorKey !== this.currentShadowColorKey) {
      paint.setColor(getSkColor(shadowColor, this.state.globalAlpha));
      this.currentShadowColorKey = colorKey;
    }
    if (maskKey !== this.currentShadowMaskKey) {
      this.shadowMask?.dispose?.();
      this.shadowMask = this.state.shadowBlur > 0
        ? Skia.MaskFilter.MakeBlur(BlurStyle.Normal, this.state.shadowBlur / 2, true)
        : null;
      paint.setMaskFilter(this.shadowMask);
      this.currentShadowMaskKey = maskKey;
    }
    return paint;
  }

  private drawShadow(draw: (paint: SkPaint) => void, stroke: boolean) {
    if (
      this.state.shadowColor === transparentColor ||
      (this.state.shadowBlur <= 0 && this.state.shadowOffsetX === 0 && this.state.shadowOffsetY === 0)
    ) {
      return;
    }

    const canvas = this.requireCanvas();
    const paint = this.getShadowPaint(stroke);
    canvas.save();
    canvas.translate(this.state.shadowOffsetX, this.state.shadowOffsetY);
    draw(paint);
    canvas.restore();
  }
}

export class SkiaBenchmarkRenderer {
  private readonly ctx = new SkiaBenchmarkContext();
  private tick = 1;
  private frameCount = 0;
  private lastFpsTime = 0;
  private currentFps = 0;

  render(size: Size, now: number): SkPicture {
    this.frameCount += 1;
    const nextFps = updateFps(now, this.frameCount, this.lastFpsTime);
    this.lastFpsTime = nextFps.lastFpsTime;
    this.frameCount = nextFps.frameCount;

    if (nextFps.fps !== 0) {
      this.currentFps = nextFps.fps;
    }

    this.ctx.beginFrame(size.width, size.height);
    drawBenchmarkFrame(this.ctx, size.width, size.height, this.tick, this.currentFps);
    const picture = this.ctx.finishFrame();
    this.tick += 1;

    if (!picture) {
      throw new Error('Failed to finish Skia benchmark picture');
    }

    return picture;
  }

  dispose() {
    this.ctx.dispose();
  }
}

export const createBenchmarkPicture = (width: number, height: number, tick: number, fps: number): SkPicture => {
  const ctx = new SkiaBenchmarkContext();
  ctx.beginFrame(width, height);
  drawBenchmarkFrame(ctx, width, height, tick, fps);
  const picture = ctx.finishFrame();
  ctx.dispose();

  if (!picture) {
    throw new Error('Failed to create initial Skia benchmark picture');
  }

  return picture;
};
