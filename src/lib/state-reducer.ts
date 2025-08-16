import { useReducer, useMemo } from 'react';
import { type GameBoardState, type GameMetadata, initialiseGameState } from './board';
import type { HexCoordinate } from './coordinates';
import { updateBoardValidity } from './validity';

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
