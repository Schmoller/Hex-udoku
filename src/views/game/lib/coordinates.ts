/**
 * HexCoordinate class represents a coordinate in an axial coordinate system.
 * It is immutable and ensures that the same coordinate values always return the same instance.
 * This makes it usable as a key in maps or sets.
 */
export class HexCoordinate {
    private static instances = new Map<number, HexCoordinate>();

    readonly q: number;
    readonly r: number;

    /**
     * Gets a unique instance of HexCoordinate for the given q and r values.
     *
     * Coordinates using the same q and r values will return the same instance,
     * @param q The q coordinate as an integer.
     * @param r The r coordinate as an integer.
     * @returns A HexCoordinate instance for the given q and r values.
     *
     * @note There is an implicit limit that q and r must exist within the range of a 16-bit signed integer.
     */
    static of(q: number, r: number): HexCoordinate {
        const key = ((q & 0xffff) << 16) | (r & 0xffff);

        if (this.instances.has(key)) {
            return this.instances.get(key)!;
        }

        const instance = new HexCoordinate(q, r);
        this.instances.set(key, instance);

        return instance;
    }

    private constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }

    add(other: HexCoordinate): HexCoordinate {
        return HexCoordinate.of(this.q + other.q, this.r + other.r);
    }

    sub(other: HexCoordinate): HexCoordinate {
        return HexCoordinate.of(this.q - other.q, this.r - other.r);
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
    SPlus = 1,
    RPlus = 2,
    QMinus = 3,
    SMinus = 4,
    RMinus = 5,
}

export const AllHexDirections: HexDirection[] = [
    HexDirection.QPlus,
    HexDirection.SPlus,
    HexDirection.RPlus,
    HexDirection.QMinus,
    HexDirection.SMinus,
    HexDirection.RMinus,
];

const DirectionOffsets: Record<HexDirection, HexCoordinate> = {
    [HexDirection.QPlus]: HexCoordinate.of(1, 0),
    [HexDirection.RPlus]: HexCoordinate.of(0, 1),
    [HexDirection.QMinus]: HexCoordinate.of(-1, 0),
    [HexDirection.RMinus]: HexCoordinate.of(0, -1),
    [HexDirection.SPlus]: HexCoordinate.of(1, -1),
    [HexDirection.SMinus]: HexCoordinate.of(-1, 1),
};
