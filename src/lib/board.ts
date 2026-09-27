import { Random } from 'random';
import { cloneCellState, type CellState } from './cell';
import { HexCoordinate } from './coordinates';
import { generateFlowerGridBoard } from './presets/flower-grid';
import { fillBoardWithRandomNumbers } from './generator/fill';
import { pruneBoardToDifficulty, type PruneResult } from './generator/prune';
import { Difficulty } from './generator/difficulty';

/**
 * GameMetadata interface represents the metadata of a game board.
 * This is for information which does not change during the game.
 */
export interface GameMetadata {
    readonly width: number;
    readonly height: number;

    /**
     * How hard the generated puzzle should be. Defaults to DefaultDifficulty when not given.
     */
    readonly difficulty?: Difficulty;
}

/**
 * GameBoardState interface represents the state of the game board.
 * This includes all the cells in the game board and their current state.
 */
export interface GameBoardState {
    /**
     * All the cells in the game board as a map.
     * The keys are HexCoordinate objects representing the coordinates of the cells.
     * The values are CellState objects representing the state of each cell.
     *
     * * @see HexCoordinate for the coordinate system used.
     * * @see GameMetadata for the metadata of the game board.
     */
    readonly cells: Map<HexCoordinate, CellState>;

    /**
     * Holds the status of whether the whole board is complete and valid.
     */
    readonly isComplete: boolean;

    readonly highlightValue: number | null;
}

export const enum UnitType {
    /**
     * Group units contain all cells with the same group number.
     * This is equivalent to the box in Sudoku.
     */
    Group,
    /**
     * All cells which share the same Q value
     */
    QRank,
    /**
     * All cells which share the same R value
     */
    RRank,
    /**
     * All cells which share the same S value
     */
    SRank,
}

export const AllUnitTypes = [UnitType.Group, UnitType.QRank, UnitType.RRank, UnitType.SRank];

/**
 * Retrieves all the cells that are contained within specified unit.
 * A unit is a collection of cells which are all related by the unit type.
 *
 * @param board The game board
 * @param start The starting coordinate to use as a reference point
 * @param unitType What kind of unit to retrieve
 */
export function getUnit(board: GameBoardState, start: HexCoordinate, unitType: UnitType): CellState[] {
    const unit: CellState[] = [];

    const startingCell = board.cells.get(start);
    if (!startingCell) {
        throw new Error('Expected starting coordinate to be in the grid');
    }

    for (const cell of board.cells.values()) {
        if (cell === startingCell) {
            unit.push(cell);
            continue;
        }

        let sameUnit = false;
        switch (unitType) {
            case UnitType.Group:
                sameUnit = cell.group === startingCell.group;
                break;
            case UnitType.QRank:
                sameUnit = cell.coordinate.q === start.q;
                break;
            case UnitType.RRank:
                sameUnit = cell.coordinate.r === start.r;
                break;
            case UnitType.SRank:
                sameUnit = cell.coordinate.s === start.s;
                break;
        }

        if (sameUnit) {
            unit.push(cell);
        }
    }

    return unit;
}

/**
 * The difficulty used when the metadata does not ask for one.
 */
export const DefaultDifficulty = Difficulty.Moderate;

/**
 * How many times to fill a fresh solution when pruning cannot reach the requested difficulty.
 *
 * Pruning already retries many times against a single solution, so needing a second solution at
 * all is rare. This is a backstop rather than something the generator leans on.
 */
const MaxFillAttempts = 3;

export function initialiseGameState(metadata: GameMetadata): GameBoardState {
    // const { width, height } = metadata;

    const difficulty = metadata.difficulty ?? DefaultDifficulty;
    const generateResult = generateFlowerGridBoard();

    const board: GameBoardState = {
        cells: generateResult.cells,
        isComplete: false,
        highlightValue: null,
    };

    const random = new Random();

    let result: PruneResult | null = null;
    for (let attempt = 1; attempt <= MaxFillAttempts && !result?.isRequestedDifficulty; attempt++) {
        // Filling clears the board first, so a rejected puzzle from the previous attempt is
        // simply replaced
        fillBoardWithRandomNumbers(board, random);
        result = pruneBoardToDifficulty(board, difficulty, random);
    }

    if (result && !result.isRequestedDifficulty) {
        console.warn(
            `Could not generate a ${difficulty} puzzle, falling back to the closest found: ` +
                `${result.clueCount} clues, ${result.profile.hardSteps} steps beyond singles, ` +
                `${result.profile.isSolved ? 'solvable by logic' : 'needs guessing'}`,
        );
    }

    return board;
}

export function cloneGameState(state: GameBoardState): GameBoardState {
    const newCells = new Map<HexCoordinate, CellState>();
    for (const cell of state.cells.values()) {
        newCells.set(cell.coordinate, cloneCellState(cell));
    }

    return {
        cells: newCells,
        isComplete: state.isComplete,
        highlightValue: null,
    };
}
