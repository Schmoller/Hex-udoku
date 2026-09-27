import type { Random } from 'random';
import type { GameBoardState } from '../board';
import { DifficultySpecs, type Difficulty } from './difficulty';
import { buildSolverIndex, countSolutions, type SolverIndex } from './solve';
import { profilePuzzle, type SolveProfile } from './techniques';

/**
 * How many pruning attempts to make before giving up on hitting the requested difficulty.
 *
 * A single pruning pass is cheap next to filling the board, so it is worth re-pruning the same
 * solution many times over rather than generating a fresh one.
 */
const MaxPruneAttempts = 80;

/**
 * A puzzle, keyed by the cells of a SolverIndex, where `null` marks a cell for the player to fill.
 */
type Puzzle = (number | null)[];

/**
 * The outcome of pruning a board down to a difficulty.
 */
export interface PruneResult {
    /** How many digits were left on the board. */
    readonly clueCount: number;

    /** What it takes to solve the puzzle that was left behind. */
    readonly profile: SolveProfile;

    /**
     * Whether the puzzle actually landed in the requested difficulty. When this is false the
     * board holds the closest puzzle found instead, so generation still produces something
     * playable.
     */
    readonly isRequestedDifficulty: boolean;

    /** How many pruning attempts it took. */
    readonly attempts: number;
}

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
    const puzzle = prunePuzzle(
        index,
        index.cells.map((cell) => cell.value),
        targetNumberOfFilledCells,
        random,
    );

    applyPuzzle(index, puzzle);

    return countClues(puzzle);
}

/**
 * Removes digits from a solved board to produce a puzzle of the requested difficulty.
 *
 * The board is pruned repeatedly, and each result is graded by solving it with nothing but
 * logic. A puzzle is only accepted if it needs the right amount of work for the tier and can be
 * finished without guessing, so the difficulty a player is offered is the difficulty they get.
 *
 * If no attempt lands in the tier, the closest solvable puzzle found is used instead and
 * `isRequestedDifficulty` reports that. Generation never fails, and never hands back a puzzle
 * that cannot be solved by logic alone unless no such puzzle was found at all.
 *
 * @param board A fully solved board, which is modified in place.
 * @param difficulty The difficulty to aim for.
 * @param random The source of randomness used to order the removals.
 */
export function pruneBoardToDifficulty(board: GameBoardState, difficulty: Difficulty, random: Random): PruneResult {
    const spec = DifficultySpecs[difficulty];
    const index = buildSolverIndex(board);
    const solution = index.cells.map((cell) => cell.value);

    let best: { puzzle: Puzzle; profile: SolveProfile } | null = null;
    let bestCost = Number.POSITIVE_INFINITY;
    let attempts = 0;

    while (attempts < MaxPruneAttempts) {
        ++attempts;

        const puzzle = prunePuzzle(index, solution, spec.clues, random);
        const profile = profilePuzzle(index, puzzle);

        if (profile.isSolved && profile.hardSteps >= spec.minHardSteps && profile.hardSteps <= spec.maxHardSteps) {
            applyPuzzle(index, puzzle);
            return {
                clueCount: countClues(puzzle),
                profile,
                isRequestedDifficulty: true,
                attempts,
            };
        }

        // Keep the nearest miss, strongly preferring puzzles that logic can actually finish
        const distance =
            profile.hardSteps < spec.minHardSteps
                ? spec.minHardSteps - profile.hardSteps
                : profile.hardSteps - spec.maxHardSteps;
        const cost = (profile.isSolved ? 0 : index.cells.length) + distance;

        if (cost < bestCost) {
            bestCost = cost;
            best = { puzzle, profile };
        }
    }

    if (best === null) {
        throw new Error('Assertion: pruning produced no candidate puzzles');
    }

    applyPuzzle(index, best.puzzle);

    return {
        clueCount: countClues(best.puzzle),
        profile: best.profile,
        isRequestedDifficulty: false,
        attempts,
    };
}

/**
 * Produces a puzzle from a solved board without touching the board itself.
 *
 * Working on a copy means a rejected removal costs nothing to undo, and lets the same solution be
 * pruned many times over.
 */
function prunePuzzle(
    index: SolverIndex,
    solution: readonly (number | null)[],
    targetNumberOfFilledCells: number,
    random: Random,
): Puzzle {
    const puzzle = [...solution];
    let filledCells = countClues(puzzle);

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

    return puzzle;
}

function applyPuzzle(index: SolverIndex, puzzle: readonly (number | null)[]): void {
    for (let i = 0; i < index.cells.length; i++) {
        const cell = index.cells[i];
        cell.value = puzzle[i];
        cell.isEditable = puzzle[i] === null;
    }
}

function countClues(puzzle: readonly (number | null)[]): number {
    return puzzle.filter((value) => value !== null).length;
}
