/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Color } from './color';
import { Constants } from './constants';
import { Logger } from './Logger';
import { Point } from './Point';

interface DrawConfig {
  color: Color;
  scale: number;
  offset: Point;
  canvas: HTMLCanvasElement;
  width: number;
  solid: boolean;
}

export const getDrawConfig = (
  color: Color,
  width: number,
  offset: Point = new Point(0, 0)
): DrawConfig => {
  return {
    color: color,
    canvas: getCanvas(),
    scale: getScale(),
    offset: offset,
    width: width,
    solid: true,
  };
};

export const getCanvas = () => document.getElementById('main-canvas')! as HTMLCanvasElement;
export const getContext = () => getCanvas()?.getContext('2d');
export const getScale = () => getCanvas().width / Constants.range;
export const cartesianAdjust = (pt: Point): Point => {
  const scale = getScale();
  const adjustedX = (-getCanvas().width / 2 + pt.x) / scale;
  const adjustedY = (getCanvas().height / 2 - pt.y) / scale;
  return new Point(adjustedX, adjustedY);
};

const drawPoint = (
  x: number, // note, screen coords
  y: number,
  color: Color,
  transparent: boolean = false,
  radius: number = 2,
  lineWidth: number = 1
) => {
  const ctx = getContext();
  if (!ctx) {
    Logger.warn('No drawing context');
    return;
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = transparent ? Color.transparent : color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

const drawControlPoint = (x: number, y: number, color: Color) => {
  drawPoint(x, y, color, true, 5, 3);
};

const drawEndPoint = (x: number, y: number) => {
  drawPoint(x, y, Color.black, true, 5, 3);
};

export const drawSamplePoint = (x: number, y: number) => {
  const scale = getScale();
  const canvas = getCanvas();
  drawPoint(canvas.width / 2 + x * scale, canvas.height / 2 - y * scale, Color.red, false, 4, 2);
};

const drawLine = (p1: Point, p2: Point, config: DrawConfig) => {
  const ctx = getContext();
  if (!ctx) {
    Logger.warn('No drawing context');
    return;
  }
  ctx.strokeStyle = config.color;
  ctx.lineWidth = config.width;
  if (!config.solid) {
    ctx.setLineDash([5, 10]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.beginPath();
  ctx.moveTo(
    (p1.x + config.offset.x) * config.scale + getCanvas().width / 2 + config.offset.x,
    (-p1.y - config.offset.y) * config.scale + getCanvas().height / 2 + config.offset.y
  );
  ctx.lineTo(
    (p2.x + config.offset.x) * config.scale + getCanvas().width / 2 + config.offset.x,
    (-p2.y - config.offset.y) * config.scale + getCanvas().height / 2 + config.offset.y
  );
  ctx.stroke();
};

const drawGridPoint = (x: number, y: number) => {
  drawPoint(x, y, Color.black, true, 0.25);
};

export const drawCurvePointCartSegments = (points: Point[], config: DrawConfig) => {
  for (let i = 0; i < points.length - 1; i++) {
    drawLine(points[i], points[i + 1], config);
  }
};

export const drawGridAndAxes = () => {
  const scale = getScale();
  const canvas = getCanvas();
  const halfRangeX = Math.floor(canvas.width / 2 / scale);
  const halfRangeY = Math.floor(canvas.height / 2 / scale);
  for (let unitX = -halfRangeX; unitX <= halfRangeX; unitX++) {
    for (let unitY = -halfRangeY; unitY <= halfRangeY; unitY++) {
      const pixelX = canvas.width / 2 + unitX * scale;
      const pixelY = canvas.height / 2 - unitY * scale;
      drawGridPoint(pixelX, pixelY);
    }
  }
  drawCurvePointCartSegments(
    [new Point(0, -100), new Point(0, 100)],
    getDrawConfig(Color.black, 1)
  );
  drawCurvePointCartSegments(
    [new Point(-100, 0), new Point(100, 0)],
    getDrawConfig(Color.black, 1)
  );
};

export const drawControlPoints = (points: Point[]) => {
  const canvas = getCanvas();
  const scale = getScale();

  drawEndPoint(canvas.width / 2 + points[0].x * scale, canvas.height / 2 - points[0].y * scale);
  drawEndPoint(canvas.width / 2 + points[1].x * scale, canvas.height / 2 - points[1].y * scale);
  drawControlPoint(
    canvas.width / 2 + points[2].x * scale,
    canvas.height / 2 - points[2].y * scale,
    Color.darkgreen
  );
  drawControlPoint(
    canvas.width / 2 + points[3].x * scale,
    canvas.height / 2 - points[3].y * scale,
    Color.blue
  );
};
