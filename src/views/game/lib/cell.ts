import type { HexCoordinate } from './coordinates';

export const enum CellType {
    Blank,
    Clue,
    Editable,
}

interface BaseCellState {
    readonly coordinate: HexCoordinate;
    readonly type: CellType;
}

/**
 * Represents an empty space which is not part of the game board.
 * This is used to fill in the gaps in the hexagonal grid where no cells are present
 */
interface BlankCellState extends BaseCellState {
    readonly type: CellType.Blank;
}

/**
 * Represents a cell that contains a clue value.
 * Clue cells are immutable and cannot be changed by the player.
 */
interface ClueCellState extends BaseCellState {
    readonly type: CellType.Clue;
    readonly value: number;
}

/**
 * Represents a cell that can be edited by the player.
 */
interface EditableCellState extends BaseCellState {
    readonly type: CellType.Editable;
    value: number | null;
}

export type CellState = ClueCellState | EditableCellState | BlankCellState;
