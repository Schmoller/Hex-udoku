import { useMemo, useReducer } from 'react';
import { type CellState } from './cell';
import { HexCoordinate } from './coordinates';
import { generateFlowerGridBoard } from './presets/flower-grid';
import { updateBoardValidity } from './validity';

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

function initialiseGameState(metadata: GameMetadata): GameBoardState {
    // const { width, height } = metadata;

    const generateResult = generateFlowerGridBoard();

    return {
        cells: generateResult.cells,
        isComplete: false,
    };
}

const enum ActionType {
    SelectCell = 'selectCell',
    DeselectAllCells = 'deselectAllCells',
    EditValue = 'editValue',
    SetSelectedCellValues = 'setSelectedCellValues',
}

type GameUpdateAction =
    | { type: ActionType.SelectCell; coordinate: HexCoordinate; multi?: boolean }
    | { type: ActionType.DeselectAllCells }
    | { type: ActionType.EditValue; coordinate: HexCoordinate; value: number | null }
    | { type: ActionType.SetSelectedCellValues; value: number | null };

function gameStateReducer(state: GameBoardState, action: GameUpdateAction): GameBoardState {
    switch (action.type) {
        case ActionType.SelectCell: {
            const { coordinate, multi } = action;
            const cell = state.cells.get(coordinate);

            if (cell) {
                if (!multi) {
                    // Deselect all cells first
                    for (const cellState of state.cells.values()) {
                        cellState.isSelected = false;
                    }
                }

                cell.isSelected = true;
            }

            return { ...state };
        }
        case ActionType.DeselectAllCells: {
            for (const cellState of state.cells.values()) {
                cellState.isSelected = false;
            }
            return { ...state };
        }
        case ActionType.EditValue: {
            const { coordinate, value } = action;
            const cell = state.cells.get(coordinate);
            if (cell && cell.isEditable) {
                cell.value = value;
            }

            let board = { ...state };
            board = updateBoardValidity(board);
            return board;
        }
        case ActionType.SetSelectedCellValues: {
            const { value } = action;
            for (const cellState of state.cells.values()) {
                if (cellState.isSelected && cellState.isEditable) {
                    cellState.value = value;
                }
            }

            let board = { ...state };
            board = updateBoardValidity(board);
            return board;
        }
    }
    return state;
}

export interface GameStateUpdater {
    selectCell(coordinate: HexCoordinate, multi?: boolean): void;
    deselectAllCells(): void;
    editCellValue(coordinate: HexCoordinate, value: number | null): void;
    setSelectedCellValues(value: number | null): void;
}

export function useGameState(metadata: GameMetadata): [GameBoardState, GameStateUpdater] {
    const [state, dispatch] = useReducer<GameBoardState, GameMetadata, [GameUpdateAction]>(
        gameStateReducer,
        metadata,
        initialiseGameState,
    );

    const gameStateUpdater = useMemo<GameStateUpdater>(
        () => ({
            selectCell: (coordinate: HexCoordinate, multi = false) => {
                dispatch({ type: ActionType.SelectCell, coordinate, multi });
            },
            deselectAllCells: () => {
                dispatch({ type: ActionType.DeselectAllCells });
            },
            editCellValue: (coordinate: HexCoordinate, value: number | null) => {
                dispatch({ type: ActionType.EditValue, coordinate, value });
            },
            setSelectedCellValues: (value: number | null) => {
                dispatch({ type: ActionType.SetSelectedCellValues, value });
            },
        }),
        [dispatch],
    );

    return [state, gameStateUpdater];
}
