import { Random } from 'random';
import { type CellState } from './cell';
import { HexCoordinate } from './coordinates';
import { generateFlowerGridBoard } from './presets/flower-grid';
import { fillBoardWithRandomNumbers } from './generator/fill';
import { pruneBoard } from './generator/prune';

/**
 * GameMetadata interface represents the metadata of a game board.
 * This is for information which does not change during the game.
 */
export interface GameMetadata {
    readonly width: number;
    readonly height: number;
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

export function initialiseGameState(metadata: GameMetadata): GameBoardState {
    // const { width, height } = metadata;

    const generateResult = generateFlowerGridBoard();

    const board: GameBoardState = {
        cells: generateResult.cells,
        isComplete: false,
    };

    const random = new Random();
    fillBoardWithRandomNumbers(board, random);
    pruneBoard(board, 15, random);

    return board;
}
