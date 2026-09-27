import type { Random } from 'random';
import type { GameBoardState } from '../board';
import { buildSolverIndex, countSolutions } from './solve';

/**
 * Removes digits from a solved board to turn it into a puzzle, keeping exactly one solution.
 *
 * Cells are visited in a random order and a digit is only removed if the puzzle still has a
 * single solution without it. Because removals are considered one at a time, the result is
 * minimal with respect to this ordering rather than globally minimal, which is what makes the
 * puzzle vary between runs.
 *
 * The target is a floor, not a guarantee: pruning stops early if no further digit can be
 * removed without making the puzzle ambiguous. Check the return value if the exact count
 * matters.
 *
 * @param board A fully solved board, which is modified in place.
 * @param targetNumberOfFilledCells How many digits to try to leave behind.
 * @param random The source of randomness used to order the removals.
 * @returns How many cells are still filled, which is at least targetNumberOfFilledCells.
 */
export function pruneBoard(board: GameBoardState, targetNumberOfFilledCells: number, random: Random): number {
    const index = buildSolverIndex(board);

    // The puzzle is built up separately from the board and written back at the end, so that a
    // rejected removal does not have to be undone on the cells themselves
    const puzzle = index.cells.map((cell) => cell.value);
    let filledCells = puzzle.filter((value) => value !== null).length;

    const order = random.shuffle(index.cells.map((_, i) => i));

    for (const i of order) {
        if (filledCells <= targetNumberOfFilledCells) {
            break;
        }

        const removedValue = puzzle[i];
        if (removedValue === null) {
            continue;
        }

        puzzle[i] = null;

        // A second solution means this digit was the only thing ruling it out, so it has to stay
        if (countSolutions(index, puzzle, 2) === 1) {
            --filledCells;
        } else {
            puzzle[i] = removedValue;
        }
    }

    for (let i = 0; i < index.cells.length; i++) {
        const cell = index.cells[i];
        cell.value = puzzle[i];
        cell.isEditable = puzzle[i] === null;
    }

    return filledCells;
}
