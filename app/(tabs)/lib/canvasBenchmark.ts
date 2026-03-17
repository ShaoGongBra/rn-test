export const SHAPE_COUNT = 500;

const palette = ['#0f766e', '#dc2626', '#2563eb', '#d97706', '#7c3aed', '#059669'];

type BenchmarkContext = {
  clearRect: (x: number, y: number, width: number, height: number) => void;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  strokeRect: (x: number, y: number, width: number, height: number) => void;
  beginPath: () => void;
  closePath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => void;
  bezierCurveTo: (
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ) => void;
  stroke: () => void;
  arc: (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ) => void;
  fill: () => void;
  fillText: (text: string, x: number, y: number, maxWidth?: number) => void;
  save: () => void;
  restore: () => void;
  translate: (x: number, y: number) => void;
  rotate: (angle: number) => void;
  scale: (x: number, y: number) => void;
  setLineDash: (segments: number[]) => void;
  fillStyle: unknown;
  strokeStyle: unknown;
  lineWidth: number;
  globalAlpha: number;
  font: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
};

type BenchmarkLoopOptions = {
  ctx: BenchmarkContext;
  getSize: () => { width: number; height: number };
  beforeDraw?: () => void;
};

const createRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

const pickColor = (random: () => number) => palette[Math.floor(random() * palette.length)];

const drawRoundedRect = (
  ctx: BenchmarkContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawCard = (
  ctx: BenchmarkContext,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  subtitle: string
) => {
  ctx.save();
  ctx.shadowColor = 'rgba(15,23,42,0.18)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, x, y, width, height, 26);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#dbe4f0';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, width, height, 26);
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title, x + 20, y + 34);
  ctx.fillStyle = '#64748b';
  ctx.font = '14px sans-serif';
  ctx.fillText(subtitle, x + 20, y + 56);
  ctx.restore();
};

const drawFlowPanel = (ctx: BenchmarkContext, x: number, y: number, width: number, height: number, tick: number) => {
  drawCard(ctx, x, y, width, height, 'Flow Network', 'curves + more lines + shadows');

  const nodes = [
    { x: x + width * 0.2, y: y + height * 0.32 },
    { x: x + width * 0.5, y: y + height * 0.26 },
    { x: x + width * 0.78, y: y + height * 0.4 },
    { x: x + width * 0.34, y: y + height * 0.74 },
    { x: x + width * 0.68, y: y + height * 0.72 },
  ];

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineWidth = 4;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const bend = ((i + j + tick) % 2 === 0 ? 1 : -1) * 24;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo(
        a.x + (b.x - a.x) * 0.33,
        a.y + bend,
        a.x + (b.x - a.x) * 0.66,
        b.y - bend,
        b.x,
        b.y
      );
      ctx.strokeStyle = palette[(i + j) % palette.length];
      ctx.globalAlpha = 0.32;
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 30, y + height - 36);
  ctx.lineTo(x + width - 30, y + height - 36);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    ctx.save();
    ctx.shadowColor = 'rgba(37,99,235,0.35)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.arc(node.x, node.y, 16 + ((tick + i) % 3) * 2, 0, Math.PI * 2);
    ctx.fillStyle = palette[i % palette.length];
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

const drawCityPanel = (ctx: BenchmarkContext, x: number, y: number, width: number, height: number, tick: number) => {
  drawCard(ctx, x, y, width, height, 'City Layers', 'rects + windows + road curves');

  const baseY = y + height - 34;
  const sunX = x + width - 74;
  const sunY = y + 80;

  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.globalAlpha = 0.28;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#fb7185';
  ctx.globalAlpha = 0.78;
  ctx.fill();
  ctx.globalAlpha = 1;

  for (let i = 0; i < 12; i += 1) {
    const buildingWidth = 20 + (i % 3) * 10;
    const buildingHeight = 70 + ((i * 23 + tick * 3) % 90);
    const bx = x + 22 + i * ((width - 44) / 12);
    const by = baseY - buildingHeight;
    ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#334155';
    ctx.fillRect(bx, by, buildingWidth, buildingHeight);

    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        ctx.fillStyle = (row + col + i + tick) % 3 === 0 ? '#f8fafc' : '#fbbf24';
        ctx.globalAlpha = 0.76;
        ctx.fillRect(bx + 4 + col * 8, by + 8 + row * 12, 4, 6);
      }
    }
    ctx.globalAlpha = 1;
  }

  ctx.beginPath();
  ctx.moveTo(x + 24, baseY - 10);
  ctx.bezierCurveTo(x + width * 0.28, baseY - 56, x + width * 0.58, baseY + 22, x + width - 24, baseY - 44);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.moveTo(x + 20, baseY);
  ctx.quadraticCurveTo(x + width * 0.5, baseY - 70, x + width - 20, baseY - 10);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 18;
  ctx.stroke();

  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.moveTo(x + 38, baseY - 8);
  ctx.quadraticCurveTo(x + width * 0.5, baseY - 60, x + width - 38, baseY - 18);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

const drawTransformPanel = (ctx: BenchmarkContext, x: number, y: number, width: number, height: number, tick: number) => {
  drawCard(ctx, x, y, width, height, 'Transform Stack', 'save/restore + rotate + scale');

  const centerX = x + width * 0.5;
  const centerY = y + height * 0.58;

  ctx.save();
  ctx.translate(centerX, centerY);
  for (let i = 0; i < 12; i += 1) {
    ctx.save();
    ctx.rotate((Math.PI / 6) * i + tick * 0.015);
    ctx.scale(1 + (i % 3) * 0.12, 1 + ((i + 1) % 3) * 0.08);
    ctx.fillStyle = palette[i % palette.length];
    ctx.globalAlpha = 0.16 + i * 0.04;
    ctx.fillRect(34, -12, 74, 24);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  for (let i = 0; i < 6; i += 1) {
    ctx.save();
    ctx.rotate(-tick * 0.022 - i * (Math.PI / 3));
    ctx.strokeStyle = palette[(i + 2) % palette.length];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -80);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -96, 14, 0, Math.PI * 2);
    ctx.fillStyle = palette[(i + 2) % palette.length];
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.globalAlpha = 1;
};

const drawWavePanel = (ctx: BenchmarkContext, x: number, y: number, width: number, height: number, tick: number) => {
  drawCard(ctx, x, y, width, height, 'Signal Board', 'curves + highlights + readable demo');

  ctx.save();
  for (let row = 0; row < 5; row += 1) {
    const rowY = y + 86 + row * 34;
    ctx.beginPath();
    ctx.moveTo(x + 24, rowY);
    for (let col = 0; col < 4; col += 1) {
      const startX = x + 24 + col * ((width - 48) / 4);
      const endX = x + 24 + (col + 1) * ((width - 48) / 4);
      const offset = Math.sin((tick + row * 9 + col * 13) * 0.08) * 16;
      ctx.bezierCurveTo(
        startX + 32,
        rowY - 24 - offset,
        endX - 32,
        rowY + 24 + offset,
        endX,
        rowY
      );
    }
    ctx.strokeStyle = palette[row % palette.length];
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  for (let i = 0; i < 18; i += 1) {
    const px = x + 34 + (i % 6) * 52;
    const py = y + 94 + Math.floor(i / 6) * 70 + ((i + tick) % 2) * 8;
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,0.14)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#e2e8f0';
    drawRoundedRect(ctx, px, py, 34, 18, 8);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

const drawScatterOverlay = (ctx: BenchmarkContext, width: number, height: number, tick: number) => {
  const random = createRandom(tick * 7919);

  for (let i = 0; i < SHAPE_COUNT; i += 1) {
    ctx.beginPath();
    ctx.moveTo(random() * width, random() * height);
    ctx.lineTo(random() * width, random() * height);
    ctx.strokeStyle = pickColor(random);
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 1 + random() * 2;
    ctx.stroke();
  }

  for (let i = 0; i < Math.round(SHAPE_COUNT * 0.45); i += 1) {
    ctx.fillStyle = pickColor(random);
    ctx.globalAlpha = 0.05;
    ctx.fillRect(
      random() * Math.max(width - 40, 1),
      random() * Math.max(height - 40, 1),
      10 + random() * 24,
      10 + random() * 24
    );
  }

  for (let i = 0; i < Math.round(SHAPE_COUNT * 0.35); i += 1) {
    ctx.beginPath();
    ctx.arc(random() * width, random() * height, 3 + random() * 10, 0, Math.PI * 2);
    ctx.fillStyle = pickColor(random);
    ctx.globalAlpha = 0.08;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
};

const drawFps = (ctx: BenchmarkContext, fps: number) => {
  ctx.save();
  ctx.shadowColor = 'rgba(15,23,42,0.18)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#111827';
  drawRoundedRect(ctx, 12, 12, 108, 40, 12);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`FPS ${fps}`, 26, 38);
};

export const drawBenchmarkFrame = (
  ctx: BenchmarkContext,
  width: number,
  height: number,
  tick: number,
  fps: number
) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#edf4ff';
  ctx.fillRect(0, 0, width, height);

  const gap = 18;
  const panelWidth = (width - gap * 3) / 2;
  const panelHeight = (height - gap * 3) / 2;

  drawScatterOverlay(ctx, width, height, tick);
  drawFlowPanel(ctx, gap, gap, panelWidth, panelHeight, tick);
  drawCityPanel(ctx, gap * 2 + panelWidth, gap, panelWidth, panelHeight, tick);
  drawTransformPanel(ctx, gap, gap * 2 + panelHeight, panelWidth, panelHeight, tick);
  drawWavePanel(ctx, gap * 2 + panelWidth, gap * 2 + panelHeight, panelWidth, panelHeight, tick);
  drawFps(ctx, fps);
};

export const updateFps = (
  now: number,
  frameCount: number,
  lastFpsTime: number
): { fps: number; frameCount: number; lastFpsTime: number } => {
  if (lastFpsTime === 0) {
    return {
      fps: 0,
      frameCount,
      lastFpsTime: now,
    };
  }

  if (now - lastFpsTime < 500) {
    return {
      fps: 0,
      frameCount,
      lastFpsTime,
    };
  }

  return {
    fps: Math.round((frameCount * 1000) / (now - lastFpsTime)),
    frameCount: 0,
    lastFpsTime: now,
  };
};

export const createBenchmarkLoop = ({
  ctx,
  getSize,
  beforeDraw,
}: BenchmarkLoopOptions) => {
  let tick = 1;
  let frameCount = 0;
  let lastFpsTime = 0;
  let currentFps = 0;

  return (now: number) => {
    beforeDraw?.();

    frameCount += 1;
    const nextFps = updateFps(now, frameCount, lastFpsTime);
    lastFpsTime = nextFps.lastFpsTime;
    frameCount = nextFps.frameCount;

    if (nextFps.fps !== 0) {
      currentFps = nextFps.fps;
    }

    const { width, height } = getSize();
    drawBenchmarkFrame(ctx, width, height, tick, currentFps);
    tick += 1;
  };
};
