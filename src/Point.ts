import { Triple } from './Triple';
import { round2f } from './utility';

/*
This class is simple enough that we barely need it, and we could enhance it further,
but it's mostly just to conveniently accept, display, and extract point data.
*/
export class Point extends Triple {
  public toString(): string {
    return `(${round2f(this.x)}, ${round2f(this.y)})`;
  }

  public distanceTo(other: Triple): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
