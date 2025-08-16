import { useMemo, useReducer } from 'react';
import { type CellState } from './cell';
import { HexCoordinate } from './coordinates';
import { generateFlowerGridBoard } from './presets/flower-grid';

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
}

function initialiseGameState(metadata: GameMetadata): GameBoardState {
    // const { width, height } = metadata;

    const generateResult = generateFlowerGridBoard();

    return {
        cells: generateResult.cells,
    } as GameBoardState;
}

const enum ActionType {
    SelectCell = 'selectCell',
    DeselectAllCells = 'deselectAllCells',
}

type GameUpdateAction =
    | { type: ActionType.SelectCell; coordinate: HexCoordinate; multi?: boolean }
    | { type: ActionType.DeselectAllCells };

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
    }
    return state;
}

export interface GameStateUpdater {
    selectCell(coordinate: HexCoordinate, multi?: boolean): void;
    deselectAllCells(): void;
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
        }),
        [dispatch],
    );

    return [state, gameStateUpdater];
}
