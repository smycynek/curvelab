import { matrix, inv, multiply, flatten } from 'mathjs';
import { Point } from './Point';
import { Vector } from './Vector';
import { PowerAscendingPolynomial } from './PowerAscendingPolynomial';
import { MatrixIllustrationData } from './MatrixIllustrationData';
import { BlendFunctionIllustrationData } from './BlendFunctionIllustrationData';
import { matrixToColumnArrays } from './utility';

// h0 // a + bx + cx^2 + dx^3

// h1 // 0 + b + 2cx + 3dx^2

export const hermiteConstraint4x4 = matrix([
  [1, 0, 0, 0], // h00 or p(0), u = 0, so only the constant
  [1, 1, 1, 1], // h01 or p(1), u = 1, so all terms contribute
  [0, 1, 0, 0], // h10 or pu(0), only the linear term contributes, as the derivative of all other terms go to zero at u = 0
  [0, 1, 2, 3], // h11 or pu(1), all terms contribute, but the constant term is zero, so only the derivatives of the linear, quadratic, and cubic terms contribute at u = 1
]);

export const hermiteBasis4x4 = inv(hermiteConstraint4x4);
const basisColumns = matrixToColumnArrays(hermiteBasis4x4);

export function blendSolve(
  p0: Point,
  p1: Point,
  pu0: Vector,
  pu1: Vector,
  uSample: number
): [Point[], BlendFunctionIllustrationData] {
  const results: Point[] = [];

  const blendingFunction_h00 = new PowerAscendingPolynomial(basisColumns[0]);
  const blendingFunction_h01 = new PowerAscendingPolynomial(basisColumns[1]);
  const blendingFunction_h10 = new PowerAscendingPolynomial(basisColumns[2]);
  const blendingFunction_h11 = new PowerAscendingPolynomial(basisColumns[3]);

  let h00Sample, h01Sample, h10Sample, h11Sample;
  let h00PointXSample = 0,
    h01PointXSample = 0,
    h10PointXSample = 0,
    h11PointXSample = 0;

  let h00PointYSample = 0,
    h01PointYSample = 0,
    h10PointYSample = 0,
    h11PointYSample = 0;

  let evalAt: Point = new Point(0, 0);
  let sampleFound = false;
  const totalSteps = 100;
  const sampleStep = Math.round(uSample * totalSteps);
  for (let step = 0; step <= totalSteps; step++) {
    const u = step / totalSteps;
    const h00 = blendingFunction_h00.evaluate(u);
    const h01 = blendingFunction_h01.evaluate(u);
    const h10 = blendingFunction_h10.evaluate(u);
    const h11 = blendingFunction_h11.evaluate(u);
    const h00PointX = h00 * p0.x;
    const h01PointX = h01 * p1.x;
    const h10PointX = h10 * pu0.x;
    const h11PointX = h11 * pu1.x;

    const h00PointY = h00 * p0.y;
    const h01PointY = h01 * p1.y;
    const h10PointY = h10 * pu0.y;
    const h11PointY = h11 * pu1.y;

    const currentPoint = new Point(
      h00PointX + h01PointX + h10PointX + h11PointX,
      h00PointY + h01PointY + h10PointY + h11PointY
    );

    if (!sampleFound && step === sampleStep) {
      sampleFound = true;
      h00Sample = h00;
      h01Sample = h01;
      h10Sample = h10;
      h11Sample = h11;
      h00PointXSample = h00PointX;
      h01PointXSample = h01PointX;
      h10PointXSample = h10PointX;
      h11PointXSample = h11PointX;

      h00PointYSample = h00PointY;
      h01PointYSample = h01PointY;
      h10PointYSample = h10PointY;
      h11PointYSample = h11PointY;

      evalAt = currentPoint;
    }
    results.push(currentPoint);
  }
  return [
    results,
    new BlendFunctionIllustrationData(
      blendingFunction_h00.toString(),
      blendingFunction_h01.toString(),
      blendingFunction_h10.toString(),
      blendingFunction_h11.toString(),
      uSample,
      h00Sample,
      h01Sample,
      h10Sample,
      h11Sample,
      h00PointXSample,
      h01PointXSample,
      h10PointXSample,
      h11PointXSample,
      h00PointYSample,
      h01PointYSample,
      h10PointYSample,
      h11PointYSample,
      evalAt
    ),
  ];
}

export function matrixSolve(
  p0: Point,
  p1: Point,
  pu0: Vector,
  pu1: Vector,
  uSample: number
): [Point[], MatrixIllustrationData] {
  const results = [];
  const geometricConstraintsX = matrix([p0.x, p1.x, pu0.x, pu1.x]);
  const aX = multiply(hermiteBasis4x4, geometricConstraintsX); // basis matrix * geometric constraints = algebraic coefficients
  const geometricConstraintsY = matrix([p0.y, p1.y, pu0.y, pu1.y]);
  const aY = multiply(hermiteBasis4x4, geometricConstraintsY);
  const xCoefficients = flatten(aX).toArray() as number[];
  const yCoefficients = flatten(aY).toArray() as number[];
  const pX = new PowerAscendingPolynomial(xCoefficients);
  const pY = new PowerAscendingPolynomial(yCoefficients);
  let evalPoint = new Point(0, 0);
  let sampleFound = false;
  const totalSteps = 100;
  const sampleStep = Math.round(uSample * totalSteps);
  for (let step = 0; step <= totalSteps; step++) {
    const u = step / totalSteps;
    const x = pX.evaluate(u);
    const y = pY.evaluate(u);
    const currentPoint = new Point(x, y);
    if (!sampleFound && step === sampleStep) {
      sampleFound = true;
      evalPoint = currentPoint;
    }
    results.push(currentPoint);
  }
  return [results, new MatrixIllustrationData(pX.toString(), pY.toString(), uSample, evalPoint)];
}
