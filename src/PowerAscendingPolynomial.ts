import { round2f } from './utility';

export class PowerAscendingPolynomial {
  public coefficients: number[];
  constructor(ascendingCoefficients: number[]) {
    this.coefficients = ascendingCoefficients;
  }
  public evaluate(t: number): number {
    let y = 0;
    for (let idx = 0; idx < this.coefficients.length; idx++) {
      y += this.coefficients[idx] * Math.pow(t, idx);
    }
    return y;
  }

  // Create unicode chars for exponent superscripts
  private toUnicode(num: number): string {
    if (num === 2) {
      return '\u00B2';
    }
    if (num === 3) {
      return '\u00B3';
    } else return num.toString();
  }

  public toString(): string {
    const build = (coeff: number, idx: number) => {
      if (idx === 0) {
        return round2f(coeff);
      } else if (idx === 1) {
        return ' ' + round2f(coeff) + 't';
      } else {
        return ' ' + round2f(coeff) + 't' + this.toUnicode(idx);
      }
    };

    let polyString = '';

    for (let idx = 0; idx < this.coefficients.length; idx++) {
      const coeff = this.coefficients[idx];
      if (coeff === 0) {
        continue;
      }
      polyString += build(coeff, idx);
    }
    return polyString;
  }
}
