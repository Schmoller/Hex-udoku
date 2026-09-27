import { AllUnitTypes, getUnit, type GameBoardState } from '../board';
import type { CellState } from '../cell';

/**
 * A precomputed view of a board's constraint structure, used to count solutions quickly.
 *
 * Building this is relatively expensive (it walks every unit of every cell), so it should be
 * built once per board and reused across many solve attempts.
 *
 * @see buildSolverIndex
 */
export interface SolverIndex {
    /**
     * Every cell on the board, in a stable order. All other arrays in this index are keyed by
     * a cell's position in this array.
     */
    readonly cells: readonly CellState[];

    /**
     * For each cell, the indices of every other cell that shares at least one unit with it.
     * Two peers may never hold the same digit.
     */
    readonly peers: readonly (readonly number[])[];

    /**
     * How many distinct digits the board uses. Digits are 1..digitCount.
     */
    readonly digitCount: number;
}

/**
 * Precomputes the constraint structure of a board so that solutions can be counted without
 * repeatedly rebuilding units.
 *
 * Only the shape of the board is captured, not the cell values, so the returned index stays
 * valid while the values are being changed.
 *
 * @param board The game board to index.
 */
export function buildSolverIndex(board: GameBoardState): SolverIndex {
    const cells = [...board.cells.values()];

    const indexOfCell = new Map<CellState, number>();
    for (let i = 0; i < cells.length; i++) {
        indexOfCell.set(cells[i], i);
    }

    const peerSets = cells.map(() => new Set<number>());

    // A digit must appear once in every group, so the largest unit tells us how many digits exist.
    // The rank units along the edges of the board are shorter than this.
    let digitCount = 0;

    for (let i = 0; i < cells.length; i++) {
        for (const unitType of AllUnitTypes) {
            const unit = getUnit(board, cells[i].coordinate, unitType);
            digitCount = Math.max(digitCount, unit.length);

            for (const other of unit) {
                const j = indexOfCell.get(other);
                if (j === undefined) {
                    throw new Error('Assertion: unit contained a cell that is not on the board');
                }

                if (j !== i) {
                    peerSets[i].add(j);
                }
            }
        }
    }

    return {
        cells,
        peers: peerSets.map((set) => [...set]),
        digitCount,
    };
}

/**
 * Counts how many ways the given puzzle can be completed, stopping once `limit` solutions
 * have been found.
 *
 * Pass a limit of 2 to answer "does this puzzle have exactly one solution?" without paying
 * for a full enumeration; the solution space of a hex grid is large enough that counting
 * every solution is not practical.
 *
 * @param index The constraint structure of the board, from buildSolverIndex.
 * @param values The current puzzle, keyed by index.cells. `null` marks a cell to be solved.
 * @param limit Stop searching once this many solutions have been found. Must be at least 1.
 * @returns The number of solutions found, which is at most `limit`.
 */
export function countSolutions(index: SolverIndex, values: readonly (number | null)[], limit: number): number {
    const { peers, digitCount } = index;
    const cellCount = index.cells.length;

    if (values.length !== cellCount) {
        throw new Error('Assertion: values must have one entry per cell');
    }

    // Candidates are held as bitmasks, where digit d occupies bit d - 1
    const allDigits = (1 << digitCount) - 1;
    const candidates = new Array<number>(cellCount).fill(allDigits);
    const working = [...values];

    // Seed the candidates from the digits already placed
    for (let i = 0; i < cellCount; i++) {
        const value = working[i];
        if (value === null) {
            continue;
        }

        const bit = 1 << (value - 1);
        for (const peer of peers[i]) {
            if (working[peer] === null) {
                candidates[peer] &= ~bit;
            }
        }
    }

    let found = 0;

    const search = (): void => {
        // Solve the most constrained cell first, which keeps the search from fanning out
        let target = -1;
        let fewestCandidates = digitCount + 1;

        for (let i = 0; i < cellCount; i++) {
            if (working[i] !== null) {
                continue;
            }

            const count = countBits(candidates[i]);
            if (count === 0) {
                // This cell can hold nothing, so the puzzle as it stands is unsolvable
                return;
            }

            if (count < fewestCandidates) {
                fewestCandidates = count;
                target = i;

                if (count === 1) {
                    break;
                }
            }
        }

        if (target < 0) {
            // Every cell holds a digit
            ++found;
            return;
        }

        const targetCandidates = candidates[target];

        for (let digit = 1; digit <= digitCount; digit++) {
            const bit = 1 << (digit - 1);
            if ((targetCandidates & bit) === 0) {
                continue;
            }

            // Place the digit and withdraw it from every peer, remembering what we changed
            // so the board can be restored on the way back out
            working[target] = digit;
            const narrowed: number[] = [];
            let isSolvable = true;

            for (const peer of peers[target]) {
                if (working[peer] === null && (candidates[peer] & bit) !== 0) {
                    candidates[peer] &= ~bit;
                    narrowed.push(peer);

                    if (candidates[peer] === 0) {
                        isSolvable = false;
                    }
                }
            }

            if (isSolvable) {
                search();
            }

            for (const peer of narrowed) {
                candidates[peer] |= bit;
            }
            working[target] = null;

            if (found >= limit) {
                return;
            }
        }
    };

    search();

    return found;
}

function countBits(mask: number): number {
    let count = 0;
    while (mask !== 0) {
        mask &= mask - 1;
        ++count;
    }
    return count;
}
