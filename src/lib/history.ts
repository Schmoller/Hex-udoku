import type { GameBoardState } from './board';

/**
 * How many board states to keep. Older states are dropped once this is exceeded.
 */
const MaxHistoryItems = 20;

/**
 * The undo/redo history of a single game.
 *
 * A history always holds at least one entry, and
 * `currentIndex` always points at the board the player is looking at.
 */
export interface GameHistory {
    readonly entries: readonly GameBoardState[];
    readonly currentIndex: number;
}

/**
 * Starts a fresh history for a board, discarding anything that came before.
 *
 * Every game begins with a call to this, which is what keeps one game's history from leaking
 * into the next.
 */
export function createHistory(state: GameBoardState): GameHistory {
    return { entries: [state], currentIndex: 0 };
}

/**
 * The board the history is currently pointing at.
 */
export function currentHistoryState(history: GameHistory): GameBoardState {
    return history.entries[history.currentIndex];
}

export function canUndo(history: GameHistory): boolean {
    return history.currentIndex > 0;
}

export function canRedo(history: GameHistory): boolean {
    return history.currentIndex < history.entries.length - 1;
}

/**
 * Records a board state, if it differs from the current one in a way worth undoing.
 *
 * Recording after an undo drops whatever was ahead, so redo never jumps into a branch the player
 * has already moved away from.
 *
 * @returns The updated history, or the history unchanged if nothing worth recording happened.
 */
export function recordHistory(history: GameHistory, state: GameBoardState): GameHistory {
    if (!hasChangedForHistory(currentHistoryState(history), state)) {
        return history;
    }

    const entries = history.entries.slice(0, history.currentIndex + 1);
    entries.push(state);

    // Ensure we don't exceed the size limit
    if (entries.length > MaxHistoryItems) {
        entries.splice(0, entries.length - MaxHistoryItems);
    }

    return { entries, currentIndex: entries.length - 1 };
}

/**
 * Steps back one entry, or returns the history unchanged if there is nothing to undo.
 */
export function undoHistory(history: GameHistory): GameHistory {
    if (!canUndo(history)) {
        return history;
    }

    return { ...history, currentIndex: history.currentIndex - 1 };
}

/**
 * Steps forward one entry, or returns the history unchanged if there is nothing to redo.
 */
export function redoHistory(history: GameHistory): GameHistory {
    if (!canRedo(history)) {
        return history;
    }

    return { ...history, currentIndex: history.currentIndex + 1 };
}

/**
 * Checks if the change in state is sufficient to cause a history item.
 *
 * Only what the player can change counts, so selecting cells or moving the highlight around does
 * not fill the history with entries that would look like no-ops when undone.
 *
 * @param previous The previous game state
 * @param current The new game state
 * @returns True if the change in state is sufficient to cause a history item
 */
function hasChangedForHistory(previous: GameBoardState, current: GameBoardState): boolean {
    for (const cell of current.cells.values()) {
        if (!cell.isEditable) {
            continue;
        }

        const previousCell = previous.cells.get(cell.coordinate);

        if (!previousCell) {
            // Should not happen
            return true;
        }

        // The cell's value has changed
        if (cell.value !== previousCell.value) {
            return true;
        }

        // Or either set of notes has changed
        if (
            !areNotesEqual(cell.centerNotes, previousCell.centerNotes) ||
            !areNotesEqual(cell.outerNotes, previousCell.outerNotes)
        ) {
            return true;
        }
    }

    return false;
}

function areNotesEqual(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
    // Comparing sizes first is what catches a note being removed, which is invisible to a
    // one-directional scan
    if (a.size !== b.size) {
        return false;
    }

    for (const note of a) {
        if (!b.has(note)) {
            return false;
        }
    }

    return true;
}
