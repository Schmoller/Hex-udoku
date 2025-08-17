import { useReducer, useMemo } from 'react';
import { cloneGameState, type GameBoardState, type GameMetadata, initialiseGameState } from './board';
import type { HexCoordinate } from './coordinates';
import { updateBoardValidity } from './validity';

const enum ActionType {
    RestartSelection = 'restartSelection',
    SetCellSelection = 'setCellSelection',
    DeselectAllCells = 'deselectAllCells',
    EditValue = 'editValue',
    ToggleSelectedCellValues = 'toggleSelectedCellValues',
    ToggleSelectedCellCenterNote = 'toggleSelectedCellCenterNote',
    ToggleSelectedCellOuterNote = 'toggleSelectedCellOuterNote',
}

type GameUpdateAction =
    | { type: ActionType.RestartSelection; coordinate: HexCoordinate }
    | { type: ActionType.SetCellSelection; coordinate: HexCoordinate; selected: boolean }
    | { type: ActionType.DeselectAllCells }
    | { type: ActionType.EditValue; coordinate: HexCoordinate; value: number | null }
    | { type: ActionType.ToggleSelectedCellValues; value: number | null }
    | { type: ActionType.ToggleSelectedCellCenterNote; value: number }
    | { type: ActionType.ToggleSelectedCellOuterNote; value: number };

function gameStateReducer(state: GameBoardState, action: GameUpdateAction): GameBoardState {
    switch (action.type) {
        case ActionType.RestartSelection: {
            state = cloneGameState(state);
            const { coordinate } = action;
            const cell = state.cells.get(coordinate);

            if (cell) {
                // Deselect all cells first
                for (const cellState of state.cells.values()) {
                    cellState.isSelected = false;
                }

                cell.isSelected = true;
            }

            return state;
        }
        case ActionType.SetCellSelection: {
            state = cloneGameState(state);
            const { coordinate, selected } = action;
            const cell = state.cells.get(coordinate);

            if (cell) {
                cell.isSelected = selected;
            }

            return state;
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
        case ActionType.ToggleSelectedCellValues: {
            const { value } = action;

            state = cloneGameState(state);

            let areAllSet = true;
            for (const cellState of state.cells.values()) {
                if (!cellState.isSelected || !cellState.isEditable) {
                    continue;
                }

                if (cellState.value !== value) {
                    areAllSet = false;
                    cellState.value = value;
                }
            }

            if (areAllSet) {
                // In this case, we want to unset the values
                for (const cellState of state.cells.values()) {
                    if (!cellState.isSelected || !cellState.isEditable) {
                        continue;
                    }

                    cellState.value = null;
                }
            }

            let board = { ...state };
            board = updateBoardValidity(board);
            return board;
        }
        case ActionType.ToggleSelectedCellCenterNote: {
            const { value } = action;

            state = cloneGameState(state);

            let areAllSet = true;
            for (const cellState of state.cells.values()) {
                if (!cellState.isSelected || !cellState.isEditable) {
                    continue;
                }

                if (!cellState.centerNotes.has(value)) {
                    areAllSet = false;
                    cellState.centerNotes.add(value);
                }
            }

            if (areAllSet) {
                // In this case, we want to unset the value
                for (const cellState of state.cells.values()) {
                    if (!cellState.isSelected || !cellState.isEditable) {
                        continue;
                    }

                    cellState.centerNotes.delete(value);
                }
            }

            return state;
        }
        case ActionType.ToggleSelectedCellOuterNote: {
            const { value } = action;

            state = cloneGameState(state);

            let areAllSet = true;
            for (const cellState of state.cells.values()) {
                if (!cellState.isSelected || !cellState.isEditable) {
                    continue;
                }

                if (!cellState.outerNotes.has(value)) {
                    areAllSet = false;
                    cellState.outerNotes.add(value);
                }
            }

            if (areAllSet) {
                // In this case, we want to unset the value
                for (const cellState of state.cells.values()) {
                    if (!cellState.isSelected || !cellState.isEditable) {
                        continue;
                    }

                    cellState.outerNotes.delete(value);
                }
            }

            return state;
        }
    }
    return state;
}

export interface GameStateUpdater {
    restartSelection(coordinate: HexCoordinate): void;
    setCellSelection(coordinate: HexCoordinate, selected: boolean): void;
    deselectAllCells(): void;
    editCellValue(coordinate: HexCoordinate, value: number | null): void;
    toggleSelectedCellValues(value: number | null): void;
    toggleSelectedCellCenterNote(value: number): void;
    toggleSelectedCellOuterNote(value: number): void;
}

export function useGameState(metadata: GameMetadata): [GameBoardState, GameStateUpdater] {
    const [state, dispatch] = useReducer<GameBoardState, GameMetadata, [GameUpdateAction]>(
        gameStateReducer,
        metadata,
        initialiseGameState,
    );

    const gameStateUpdater = useMemo<GameStateUpdater>(
        () => ({
            restartSelection: (coordinate: HexCoordinate) => {
                dispatch({ type: ActionType.RestartSelection, coordinate });
            },
            setCellSelection: (coordinate: HexCoordinate, selected: boolean) => {
                dispatch({ type: ActionType.SetCellSelection, coordinate, selected });
            },
            deselectAllCells: () => {
                dispatch({ type: ActionType.DeselectAllCells });
            },
            editCellValue: (coordinate: HexCoordinate, value: number | null) => {
                dispatch({ type: ActionType.EditValue, coordinate, value });
            },
            toggleSelectedCellValues: (value: number | null) => {
                dispatch({ type: ActionType.ToggleSelectedCellValues, value });
            },
            toggleSelectedCellCenterNote: (value: number) => {
                dispatch({ type: ActionType.ToggleSelectedCellCenterNote, value });
            },
            toggleSelectedCellOuterNote: (value: number) => {
                dispatch({ type: ActionType.ToggleSelectedCellOuterNote, value });
            },
        }),
        [dispatch],
    );

    return [state, gameStateUpdater];
}
