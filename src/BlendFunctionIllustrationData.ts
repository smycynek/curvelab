import { Point } from './Point';

/*
A simple container for data.

Shows blending functions, intermediate calculations, and a
point evaluated at u.
*/
export class BlendFunctionIllustrationData {
  constructor(
    public h00?: string,
    public h01?: string,
    public h10?: string,
    public h11?: string,
    public uSample?: number,
    public h00Sample?: number,
    public h01Sample?: number,
    public h10Sample?: number,
    public h11Sample?: number,

    public h00PointXSample?: number,
    public h01PointXSample?: number,
    public h10PointXSample?: number,
    public h11PointXSample?: number,

    public h00PointYSample?: number,
    public h01PointYSample?: number,
    public h10PointYSample?: number,
    public h11PointYSample?: number,

    public evalAtU?: Point
  ) {}
}
