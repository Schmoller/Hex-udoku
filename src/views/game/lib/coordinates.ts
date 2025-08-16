/**
 * HexCoordinate class represents a coordinate in an axial coordinate system.
 * It is immutable and ensures that the same coordinate values always return the same instance.
 * This makes it usable as a key in maps or sets.
 */
export class HexCoordinate {
    private static instances = new Map<number, HexCoordinate>();

    readonly q: number;
    readonly r: number;

    get s(): number {
        return -this.q - this.r;
    }

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
        q = Math.floor(q);
        r = Math.floor(r);

        const key = ((q & 0xffff) << 16) | (r & 0xffff);

        if (this.instances.has(key)) {
            return this.instances.get(key)!;
        }

        const instance = new HexCoordinate(q, r);
        this.instances.set(key, instance);

        return instance;
    }

    /**
     * Gets a unique instance of HexCoordinate for the given q and r values, rounding the coordinate to the nearest axial coordinate.
     * @param q The q coordinate as a floating-point number.
     * @param r The r coordinate as a floating-point number.
     *
     * @returns A HexCoordinate instance for the rounded q and r values.
     * @note This method is useful for handling fractional coordinates that need to be snapped to the nearest hexagonal grid point.
     */
    static ofRounded(q: number, r: number): HexCoordinate {
        const s = -q - r;

        let outputQ = Math.round(q);
        let outputR = Math.round(r);
        let outputS = Math.round(s);

        // Maintain q + r + s = 0
        const diffQ = Math.abs(outputQ - q);
        const diffR = Math.abs(outputR - r);
        const diffS = Math.abs(outputS - s);

        if (diffQ > diffR && diffQ > diffS) {
            outputQ = -outputR - outputS;
        } else if (diffR > diffS) {
            outputR = -outputQ - outputS;
        } else {
            outputS = -outputQ - outputR;
        }

        return HexCoordinate.of(outputQ, outputR);
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
    Up = 0,
    UpRight = 1,
    DownRight = 2,
    Down = 3,
    DownLeft = 4,
    UpLeft = 5,
}

export const AllHexDirections: HexDirection[] = [
    HexDirection.Up,
    HexDirection.UpRight,
    HexDirection.DownRight,
    HexDirection.Down,
    HexDirection.DownLeft,
    HexDirection.UpLeft,
];

const DirectionOffsets: Record<HexDirection, HexCoordinate> = {
    [HexDirection.Up]: HexCoordinate.of(0, -1),
    [HexDirection.UpRight]: HexCoordinate.of(1, -1),
    [HexDirection.DownRight]: HexCoordinate.of(1, 0),
    [HexDirection.Down]: HexCoordinate.of(0, 1),
    [HexDirection.DownLeft]: HexCoordinate.of(-1, 1),
    [HexDirection.UpLeft]: HexCoordinate.of(-1, 0),
};
