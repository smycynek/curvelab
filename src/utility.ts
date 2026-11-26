import { Matrix, MathNumericType, subset, index, range, transpose } from 'mathjs';
import { Point } from './Point';

export function getMousePos(canvas: HTMLCanvasElement, mouseEvent: MouseEvent): Point {
  const canvasRect: DOMRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / canvasRect.width; // scale because of bitmapping
  const scaleY = canvas.height / canvasRect.height;
  return new Point(
    (mouseEvent.clientX - canvasRect.left) * scaleX,
    (mouseEvent.clientY - canvasRect.top) * scaleY
  );
}

export function getTouchPos(canvas: HTMLCanvasElement, touch: Touch): Point {
  const canvasRect: DOMRect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / canvasRect.width; // scale because of bitmapping
  const scaleY = canvas.height / canvasRect.height;
  return new Point(
    (touch.clientX - canvasRect.left) * scaleX,
    (touch.clientY - canvasRect.top) * scaleY
  );
}

export function round2(v: number): number {
  return (Math.round(v * 100) / 100).toFixed(2) as unknown as number;
}

export function round2f(v: number | undefined): string {
  if (v === undefined) {
    return '';
  }
  const r = round2(v);
  const absString = String(Math.abs(r).toFixed(2)).padStart(3, '0');
  if (r >= 0) {
    return '+' + absString;
  }
  return '-' + absString;
}

export function near(p1: Point, p2: Point): boolean {
  return Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2)) < 1;
}

export const matrixToColumnArrays = (matrix: Matrix<MathNumericType>): number[][] => {
  const basisColumn0 = subset(matrix, index(range(0, 4), 0)).toArray() as number[];
  const basisColumn1 = subset(matrix, index(range(0, 4), 1)).toArray() as number[];
  const basisColumn2 = subset(matrix, index(range(0, 4), 2)).toArray() as number[];
  const basisColumn3 = subset(matrix, index(range(0, 4), 3)).toArray() as number[];
  return [basisColumn0, basisColumn1, basisColumn2, basisColumn3];
};

export const matrixToRowArrays = (matrix: Matrix<MathNumericType>): number[][] => {
  return matrixToColumnArrays(transpose(matrix));
};
