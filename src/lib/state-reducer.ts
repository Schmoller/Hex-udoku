import { useReducer, useMemo, use } from 'react';
import { cloneGameState, type GameBoardState, type GameMetadata, initialiseGameState } from './board';
import type { HexCoordinate } from './coordinates';
import { updateBoardValidity } from './validity';

const enum ActionType {
    RestartSelection = 'restartSelection',
    SetCellSelection = 'setCellSelection',
    DeselectAllCells = 'deselectAllCells',
    EditValue = 'editValue',
    ClearSelectedCells = 'clearSelectedCell',
    ToggleSelectedCellValues = 'toggleSelectedCellValues',
    ToggleSelectedCellCenterNote = 'toggleSelectedCellCenterNote',
    ToggleSelectedCellOuterNote = 'toggleSelectedCellOuterNote',
    NewGame = 'newGame',
}

type GameUpdateAction =
    | { type: ActionType.RestartSelection; coordinate: HexCoordinate }
    | { type: ActionType.SetCellSelection; coordinate: HexCoordinate; selected: boolean }
    | { type: ActionType.DeselectAllCells }
    | { type: ActionType.EditValue; coordinate: HexCoordinate; value: number | null }
    | { type: ActionType.ClearSelectedCells; full?: boolean }
    | { type: ActionType.ToggleSelectedCellValues; value: number | null }
    | { type: ActionType.ToggleSelectedCellCenterNote; value: number }
    | { type: ActionType.ToggleSelectedCellOuterNote; value: number }
    | { type: ActionType.NewGame };

function gameStateReducer(metadata: GameMetadata, state: GameBoardState, action: GameUpdateAction): GameBoardState {
    switch (action.type) {
        case ActionType.RestartSelection: {
            state = cloneGameState(state);
            const { coordinate } = action;
            const cell = state.cells.get(coordinate);

            const selectedCount = Array.from(state.cells.values()).filter((c) => c.isSelected).length;

            if (cell) {
                // Toggle selection if only one cell was selected
                if (selectedCount === 1) {
                    cell.isSelected = !cell.isSelected;
                } else {
                    // Deselect all cells first
                    for (const cellState of state.cells.values()) {
                        cellState.isSelected = false;
                    }

                    cell.isSelected = true;
                }
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
        case ActionType.ClearSelectedCells: {
            const { full } = action;

            state = cloneGameState(state);

            for (const cellState of state.cells.values()) {
                if (!cellState.isSelected || !cellState.isEditable) {
                    continue;
                }

                let didClear = false;
                // First: clear the value
                if (cellState.value != null) {
                    didClear = true;
                    cellState.value = null;
                }

                // Second: clear notes if any
                if ((!didClear || full) && (cellState.centerNotes.size > 0 || cellState.outerNotes.size > 0)) {
                    cellState.centerNotes.clear();
                    cellState.outerNotes.clear();
                }
            }

            state = updateBoardValidity(state);
            return state;
        }
        case ActionType.NewGame: {
            return initialiseGameState(metadata);
        }
    }
    return state;
}

export interface GameStateUpdater {
    restartSelection(coordinate: HexCoordinate): void;
    setCellSelection(coordinate: HexCoordinate, selected: boolean): void;
    deselectAllCells(): void;
    editCellValue(coordinate: HexCoordinate, value: number | null): void;
    clearSelectedCells(force?: boolean): void;
    toggleSelectedCellValues(value: number | null): void;
    toggleSelectedCellCenterNote(value: number): void;
    toggleSelectedCellOuterNote(value: number): void;
    newGame(): void;
}

export function useGameState(
    metadata: GameMetadata,
    initialiser: Promise<GameBoardState>,
): [GameBoardState, GameStateUpdater] {
    const initialGameState = use(initialiser);

    const [state, dispatch] = useReducer<GameBoardState, [GameUpdateAction]>(
        gameStateReducer.bind(undefined, metadata),
        initialGameState,
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
            clearSelectedCells: (force?: boolean) => {
                dispatch({ type: ActionType.ClearSelectedCells, full: force });
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
            newGame: () => {
                dispatch({ type: ActionType.NewGame });
            },
        }),
        [dispatch],
    );

    return [state, gameStateUpdater];
}
