import type { SolverIndex } from './solve';

/**
 * The solving techniques the grader knows about, ordered from easiest to hardest.
 *
 * A puzzle is graded by which of these it forces the solver to reach for, so the order matters:
 * the grader always applies the cheapest technique that makes progress.
 */
export const enum Technique {
    /** A cell has only one candidate left. */
    NakedSingle = 0,
    /** Within a unit, a digit has only one cell it can go in. */
    HiddenSingle = 1,
    /** A digit's candidates in one unit all fall inside another unit, so it leaves that one. */
    LockedCandidate = 2,
    /** N cells in a unit share exactly N candidates between them, which no other cell can use. */
    NakedSubset = 3,
    /** N digits in a unit are confined to exactly N cells, which can hold nothing else. */
    HiddenSubset = 4,
}

/**
 * The largest subset size the grader looks for, i.e. pairs and triples.
 *
 * Larger subsets are possible in principle but are not worth searching for: a subset of size N in
 * a unit of 7 implies a complementary subset of size 7 - N, so anything bigger is already covered
 * from the other side.
 */
const LargestSubsetSize = 3;

/**
 * What it took to solve a puzzle by logic alone.
 */
export interface SolveProfile {
    /** How many cells the techniques managed to fill in, out of the whole board. */
    readonly solvedCells: number;

    /**
     * Whether the whole board was solved. If this is false the puzzle still has a single
     * solution, but finding it needs something beyond the techniques above, such as a forcing
     * chain or trial and error.
     */
    readonly isSolved: boolean;

    /**
     * How many times the solver had to reach past singles. This is the difficulty signal: it
     * counts the moments a player has to do more than scan for a cell or digit that is already
     * pinned down.
     */
    readonly hardSteps: number;

    /** The hardest technique the puzzle required, or null if no technique applied at all. */
    readonly hardestTechnique: Technique | null;

    /**
     * How far the techniques got, keyed by the cells of the index. Cells the solver could not
     * work out are left `null`.
     */
    readonly values: readonly (number | null)[];
}

/**
 * Pairs of full units that overlap in enough cells for locked candidate reasoning to apply.
 *
 * This only depends on the shape of the board, so it is derived once per index and cached.
 */
interface UnitIntersection {
    readonly a: readonly number[];
    readonly b: readonly number[];
    readonly shared: readonly number[];
}

const intersectionCache = new WeakMap<SolverIndex, readonly UnitIntersection[]>();

function getIntersections(index: SolverIndex): readonly UnitIntersection[] {
    const cached = intersectionCache.get(index);
    if (cached) {
        return cached;
    }

    const intersections: UnitIntersection[] = [];
    const { fullUnits } = index;

    for (let i = 0; i < fullUnits.length; i++) {
        for (let j = i + 1; j < fullUnits.length; j++) {
            const b = new Set(fullUnits[j]);
            const shared = fullUnits[i].filter((cell) => b.has(cell));

            // One shared cell tells us nothing new: it is already a peer of everything in both units
            if (shared.length >= 2) {
                intersections.push({ a: fullUnits[i], b: fullUnits[j], shared });
            }
        }
    }

    intersectionCache.set(index, intersections);
    return intersections;
}

/**
 * The mutable working state of a logical solve.
 */
interface SolveState {
    readonly index: SolverIndex;
    readonly values: (number | null)[];
    /** Per cell, a bitmask of the digits still possible, where digit d occupies bit d - 1. */
    readonly candidates: number[];
}

/**
 * Solves a puzzle using only the techniques above, and reports what it took.
 *
 * This deliberately never guesses. A puzzle that cannot be finished this way is one that needs
 * techniques beyond pairs and triples, which is the signal that it is too hard to be fair.
 *
 * @param index The constraint structure of the board, from buildSolverIndex.
 * @param puzzle The starting puzzle, keyed by index.cells. `null` marks a cell to be solved.
 */
export function profilePuzzle(index: SolverIndex, puzzle: readonly (number | null)[]): SolveProfile {
    const { digitCount, peers } = index;
    const cellCount = index.cells.length;

    if (puzzle.length !== cellCount) {
        throw new Error('Assertion: puzzle must have one entry per cell');
    }

    const state: SolveState = {
        index,
        values: [...puzzle],
        candidates: new Array<number>(cellCount).fill((1 << digitCount) - 1),
    };

    for (let i = 0; i < cellCount; i++) {
        const value = state.values[i];
        if (value === null) {
            continue;
        }

        const bit = 1 << (value - 1);
        for (const peer of peers[i]) {
            if (state.values[peer] === null) {
                state.candidates[peer] &= ~bit;
            }
        }
    }

    const intersections = getIntersections(index);
    let hardSteps = 0;
    let hardestTechnique: Technique | null = null;

    const record = (technique: Technique): void => {
        if (hardestTechnique === null || technique > hardestTechnique) {
            hardestTechnique = technique;
        }
        if (technique > Technique.HiddenSingle) {
            ++hardSteps;
        }
    };

    for (;;) {
        if (state.values.every((value) => value !== null)) {
            break;
        }

        if (applyNakedSingle(state)) {
            record(Technique.NakedSingle);
            continue;
        }
        if (applyHiddenSingle(state)) {
            record(Technique.HiddenSingle);
            continue;
        }
        if (applyLockedCandidate(state, intersections)) {
            record(Technique.LockedCandidate);
            continue;
        }
        if (applyNakedSubset(state)) {
            record(Technique.NakedSubset);
            continue;
        }
        if (applyHiddenSubset(state)) {
            record(Technique.HiddenSubset);
            continue;
        }

        break;
    }

    const solvedCells = state.values.reduce((count: number, value) => (value === null ? count : count + 1), 0);

    return {
        solvedCells,
        isSolved: solvedCells === cellCount,
        hardSteps,
        hardestTechnique,
        values: state.values,
    };
}

function place(state: SolveState, cell: number, digit: number): void {
    const bit = 1 << (digit - 1);
    state.values[cell] = digit;
    state.candidates[cell] = bit;

    for (const peer of state.index.peers[cell]) {
        if (state.values[peer] === null) {
            state.candidates[peer] &= ~bit;
        }
    }
}

function applyNakedSingle(state: SolveState): boolean {
    for (let cell = 0; cell < state.values.length; cell++) {
        if (state.values[cell] === null && countBits(state.candidates[cell]) === 1) {
            // The mask holds a single bit, and digit d sits at bit d - 1
            place(state, cell, 32 - Math.clz32(state.candidates[cell]));
            return true;
        }
    }
    return false;
}

function applyHiddenSingle(state: SolveState): boolean {
    for (const unit of state.index.fullUnits) {
        for (let digit = 1; digit <= state.index.digitCount; digit++) {
            if (unit.some((cell) => state.values[cell] === digit)) {
                continue;
            }

            const bit = 1 << (digit - 1);
            const spots = unit.filter((cell) => state.values[cell] === null && (state.candidates[cell] & bit) !== 0);

            if (spots.length === 1) {
                place(state, spots[0], digit);
                return true;
            }
        }
    }
    return false;
}

function applyLockedCandidate(state: SolveState, intersections: readonly UnitIntersection[]): boolean {
    for (const { a, b, shared } of intersections) {
        for (let digit = 1; digit <= state.index.digitCount; digit++) {
            const bit = 1 << (digit - 1);

            if (a.some((cell) => state.values[cell] === digit) || b.some((cell) => state.values[cell] === digit)) {
                continue;
            }

            // The digit has to appear in both units, so if one unit can only place it inside the
            // overlap then the other unit cannot place it anywhere else
            for (const [source, target] of [
                [a, b],
                [b, a],
            ]) {
                const spots = source.filter(
                    (cell) => state.values[cell] === null && (state.candidates[cell] & bit) !== 0,
                );

                if (spots.length === 0 || spots.some((cell) => !shared.includes(cell))) {
                    continue;
                }

                let eliminated = false;
                for (const cell of target) {
                    if (shared.includes(cell) || state.values[cell] !== null) {
                        continue;
                    }
                    if ((state.candidates[cell] & bit) !== 0) {
                        state.candidates[cell] &= ~bit;
                        eliminated = true;
                    }
                }

                if (eliminated) {
                    return true;
                }
            }
        }
    }
    return false;
}

function applyNakedSubset(state: SolveState): boolean {
    // Eliminating within a unit needs no assumption about which digits the unit holds, so this
    // is valid on the short edge units too
    for (const unit of state.index.units) {
        const open = unit.filter((cell) => state.values[cell] === null);

        for (let size = 2; size <= LargestSubsetSize; size++) {
            if (open.length <= size) {
                continue;
            }

            const found = forEachCombination(open, size, (combination) => {
                let combined = 0;
                for (const cell of combination) {
                    combined |= state.candidates[cell];
                }

                if (countBits(combined) !== size) {
                    return false;
                }

                let eliminated = false;
                for (const cell of open) {
                    if (combination.includes(cell)) {
                        continue;
                    }
                    if ((state.candidates[cell] & combined) !== 0) {
                        state.candidates[cell] &= ~combined;
                        eliminated = true;
                    }
                }

                return eliminated;
            });

            if (found) {
                return true;
            }
        }
    }
    return false;
}

function applyHiddenSubset(state: SolveState): boolean {
    for (const unit of state.index.fullUnits) {
        const open = unit.filter((cell) => state.values[cell] === null);

        const missing: number[] = [];
        for (let digit = 1; digit <= state.index.digitCount; digit++) {
            if (!unit.some((cell) => state.values[cell] === digit)) {
                missing.push(digit);
            }
        }

        for (let size = 2; size <= LargestSubsetSize; size++) {
            if (open.length <= size) {
                continue;
            }

            const found = forEachCombination(missing, size, (combination) => {
                let combined = 0;
                const spots = new Set<number>();

                for (const digit of combination) {
                    const bit = 1 << (digit - 1);
                    combined |= bit;

                    for (const cell of open) {
                        if ((state.candidates[cell] & bit) !== 0) {
                            spots.add(cell);
                        }
                    }
                }

                if (spots.size !== size) {
                    return false;
                }

                let eliminated = false;
                for (const cell of spots) {
                    if ((state.candidates[cell] & ~combined) !== 0) {
                        state.candidates[cell] &= combined;
                        eliminated = true;
                    }
                }

                return eliminated;
            });

            if (found) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Calls `visit` with every combination of `size` items, stopping as soon as one returns true.
 *
 * @returns Whether any call to `visit` returned true.
 */
function forEachCombination<T>(items: readonly T[], size: number, visit: (combination: T[]) => boolean): boolean {
    const combination: T[] = [];

    const walk = (start: number): boolean => {
        if (combination.length === size) {
            return visit(combination);
        }

        for (let i = start; i < items.length; i++) {
            combination.push(items[i]);
            if (walk(i + 1)) {
                return true;
            }
            combination.pop();
        }

        return false;
    };

    return walk(0);
}

function countBits(mask: number): number {
    let count = 0;
    while (mask !== 0) {
        mask &= mask - 1;
        ++count;
    }
    return count;
}
