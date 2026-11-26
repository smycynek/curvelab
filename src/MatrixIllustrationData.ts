import { Point } from './Point';

/*
A simple container for data.

Shows parametric equations derived from a matrix solve and
point evaluated at u.
*/
export class MatrixIllustrationData {
  constructor(
    public xPolynomial?: string,
    public yPolynomial?: string,
    public uSample?: number,
    public evalAtU?: Point
  ) {}
}
