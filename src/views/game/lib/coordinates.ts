/**
 * HexCoordinate class represents a coordinate in an axial coordinate system.
 */
export class HexCoordinate {
    readonly q: number;
    readonly r: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }

    add(other: HexCoordinate): HexCoordinate {
        return new HexCoordinate(this.q + other.q, this.r + other.r);
    }

    sub(other: HexCoordinate): HexCoordinate {
        return new HexCoordinate(this.q - other.q, this.r - other.r);
    }

    next(direction: HexDirection): HexCoordinate {
        const offset = DirectionOffsets[direction];
        return this.add(offset);
    }

    equals(other: HexCoordinate): boolean {
        return this.q === other.q && this.r === other.r;
    }

    toString(): string {
        return `(${this.q}, ${this.r})`;
    }
}

export const enum HexDirection {
    QPlus = 0,
    RPlus = 1,
    QMinus = 2,
    RMinus = 3,
    SPlus = 4,
    SMinus = 5,
}

const DirectionOffsets: Record<HexDirection, HexCoordinate> = {
    [HexDirection.QPlus]: new HexCoordinate(1, 0),
    [HexDirection.RPlus]: new HexCoordinate(0, 1),
    [HexDirection.QMinus]: new HexCoordinate(-1, 0),
    [HexDirection.RMinus]: new HexCoordinate(0, -1),
    [HexDirection.SPlus]: new HexCoordinate(1, -1),
    [HexDirection.SMinus]: new HexCoordinate(-1, 1),
};
