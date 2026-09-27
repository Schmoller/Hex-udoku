import { useReducer, useMemo, use } from 'react';
import { cloneGameState, type GameBoardState, type GameMetadata, initialiseGameState } from './board';
import type { HexCoordinate } from './coordinates';
import { updateBoardValidity } from './validity';
import { clearNotesInAppropriateCells } from './utils/note-clearer';
import {
    createHistory,
    currentHistoryState,
    recordHistory,
    redoHistory,
    undoHistory,
    type GameHistory,
} from './history';

/**
 * Everything that makes up a game in progress: the board the player sees, and how they got there.
 */
export interface GameSession {
    readonly board: GameBoardState;
    readonly history: GameHistory;
}

export const enum ActionType {
    RestartSelection = 'restartSelection',
    SetCellSelection = 'setCellSelection',
    DeselectAllCells = 'deselectAllCells',
    EditValue = 'editValue',
    ClearSelectedCells = 'clearSelectedCell',
    ToggleSelectedCellValues = 'toggleSelectedCellValues',
    ToggleSelectedCellCenterNote = 'toggleSelectedCellCenterNote',
    ToggleSelectedCellOuterNote = 'toggleSelectedCellOuterNote',
    Undo = 'undo',
    Redo = 'redo',
    RestartGame = 'restartGame',
    NewGame = 'newGame',
}

export type GameUpdateAction =
    | { type: ActionType.RestartSelection; coordinate: HexCoordinate }
    | { type: ActionType.SetCellSelection; coordinate: HexCoordinate; selected: boolean }
    | { type: ActionType.DeselectAllCells }
    | { type: ActionType.EditValue; coordinate: HexCoordinate; value: number | null }
    | { type: ActionType.ClearSelectedCells; full?: boolean }
    | { type: ActionType.ToggleSelectedCellValues; value: number | null }
    | { type: ActionType.ToggleSelectedCellCenterNote; value: number }
    | { type: ActionType.ToggleSelectedCellOuterNote; value: number }
    | { type: ActionType.Undo }
    | { type: ActionType.Redo }
    | { type: ActionType.RestartGame }
    | { type: ActionType.NewGame };

/**
 * Actions that step through the history rather than changing the board, and so must not be
 * recorded as history themselves.
 */
type HistoryAction = Extract<GameUpdateAction, { type: ActionType.Undo | ActionType.Redo }>;

/**
 * Actions that begin a game, which start the history over rather than appending to it.
 */
type NewSessionAction = Extract<GameUpdateAction, { type: ActionType.NewGame | ActionType.RestartGame }>;

/**
 * Actions that change the board the player is working on.
 */
type BoardAction = Exclude<GameUpdateAction, HistoryAction | NewSessionAction>;

export function gameSessionReducer(
    metadata: GameMetadata,
    session: GameSession,
    action: GameUpdateAction,
): GameSession {
    switch (action.type) {
        case ActionType.Undo:
            return moveThroughHistory(session, undoHistory(session.history));
        case ActionType.Redo:
            return moveThroughHistory(session, redoHistory(session.history));
        case ActionType.NewGame:
            return startSession(initialiseGameState(metadata));
        case ActionType.RestartGame:
            // Restarting throws the player's progress away, which the confirmation warns about,
            // so the history it built up goes with it
            return startSession(restartBoard(session.board));
        default: {
            const board = boardReducer(session.board, action);
            return { board, history: recordHistory(session.history, board) };
        }
    }
}

/**
 * Begins a session for a board, with a history containing nothing but that board.
 */
export function startSession(board: GameBoardState): GameSession {
    return { board, history: createHistory(board) };
}

/**
 * Points the session at another entry in its history. The board follows the history rather than
 * the other way around, so there is no round trip through an effect to keep the two in step.
 */
function moveThroughHistory(session: GameSession, history: GameHistory): GameSession {
    if (history === session.history) {
        return session;
    }

    return { board: currentHistoryState(history), history };
}

/**
 * Returns the board as it was generated, clearing anything the player entered.
 *
 * The clues are exactly the cells the player was never allowed to touch, so clearing everything
 * editable is enough to get there without having to hold on to a copy of the original board.
 */
function restartBoard(board: GameBoardState): GameBoardState {
    const restarted = cloneGameState(board);

    for (const cellState of restarted.cells.values()) {
        cellState.isSelected = false;

        if (!cellState.isEditable) {
            continue;
        }

        cellState.value = null;
        cellState.centerNotes.clear();
        cellState.outerNotes.clear();
    }

    return updateBoardValidity(restarted);
}

function boardReducer(state: GameBoardState, action: BoardAction): GameBoardState {
    switch (action.type) {
        case ActionType.RestartSelection: {
            state = cloneGameState(state);
            const { coordinate } = action;
            const cell = state.cells.get(coordinate);

            const selectedCount = Array.from(state.cells.values()).filter((c) => c.isSelected).length;

            if (cell) {
                // Toggle selection if only one cell was selected
                if (selectedCount === 1 && cell.isSelected) {
                    cell.isSelected = false;
                } else {
                    // Deselect all cells first
                    for (const cellState of state.cells.values()) {
                        cellState.isSelected = false;
                    }

                    cell.isSelected = true;
                }
            }

            state = updateHighlightedDigit(state);

            return state;
        }
        case ActionType.SetCellSelection: {
            state = cloneGameState(state);
            const { coordinate, selected } = action;
            const cell = state.cells.get(coordinate);

            if (cell) {
                cell.isSelected = selected;
            }

            state = updateHighlightedDigit(state);

            return state;
        }
        case ActionType.DeselectAllCells: {
            for (const cellState of state.cells.values()) {
                cellState.isSelected = false;
            }

            return { ...state, highlightValue: null };
        }
        case ActionType.EditValue: {
            const { coordinate, value } = action;
            const cell = state.cells.get(coordinate);
            if (cell && cell.isEditable) {
                cell.value = value;
                if (value != null) {
                    clearNotesInAppropriateCells(state, value, cell.coordinate);
                }
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
                    if (value != null) {
                        clearNotesInAppropriateCells(state, value, cellState.coordinate);
                    }
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
    /** Steps back to the previous board, if there is one. */
    undo(): void;
    /** Steps forward to the next board, if there is one. */
    redo(): void;
    /** Clears the player's progress, leaving the generated clues in place. */
    restartGame(): void;
    newGame(): void;
}

export function useGameState(
    metadata: GameMetadata,
    initialiser: Promise<GameBoardState>,
): [GameSession, GameStateUpdater] {
    const initialGameState = use(initialiser);

    const [session, dispatch] = useReducer<GameSession, GameBoardState, [GameUpdateAction]>(
        gameSessionReducer.bind(undefined, metadata),
        initialGameState,
        startSession,
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
            undo: () => {
                dispatch({ type: ActionType.Undo });
            },
            redo: () => {
                dispatch({ type: ActionType.Redo });
            },
            restartGame: () => {
                dispatch({ type: ActionType.RestartGame });
            },
            newGame: () => {
                dispatch({ type: ActionType.NewGame });
            },
        }),
        [dispatch],
    );

    return [session, gameStateUpdater];
}

function updateHighlightedDigit(state: GameBoardState): GameBoardState {
    const selectedCells = Array.from(state.cells.values()).filter((cell) => cell.isSelected);
    if (selectedCells.length === 0) {
        if (state.highlightValue !== null) {
            return { ...state, highlightValue: null };
        }
        return state;
    }

    if (selectedCells.length === 1) {
        const cell = selectedCells[0];
        if (cell.value !== null) {
            return { ...state, highlightValue: cell.value };
        } else {
            return { ...state, highlightValue: null };
        }
    }

    if (state.highlightValue !== null) {
        return { ...state, highlightValue: null };
    }
    return state;
}
