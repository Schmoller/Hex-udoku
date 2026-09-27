import { create } from 'zustand';
import type { GameBoardState } from '../lib/board';

const MaxHistoryItems = 20;

interface HistoryState {
    history: GameBoardState[];
    currentIndex: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

interface HistoryStateActions {
    push(state: GameBoardState): void;
    back(): void;
    forward(): void;
    reset(state: GameBoardState): void;
}

export const useGameHistory = create<HistoryState & HistoryStateActions>((set, get) => ({
    history: [],
    currentIndex: -1,
    hasNext: false,
    hasPrevious: false,

    push: (state: GameBoardState) => {
        const { currentIndex, history } = get();

        // Don't record history if nothing important has changed
        if (currentIndex >= 0) {
            const latestHistory = history[currentIndex];

            if (!hasChangedForHistory(latestHistory, state)) {
                return;
            }
        }

        // Start recording history from the current point
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(state);

        // Ensure we don't exceed the size limit
        if (newHistory.length > MaxHistoryItems) {
            newHistory.splice(0, newHistory.length - MaxHistoryItems);
        }

        set({
            history: newHistory,
            currentIndex: newHistory.length - 1,
            hasNext: false,
            hasPrevious: newHistory.length > 1,
        });
    },
    back: () => {
        const { currentIndex, history } = get();

        if (currentIndex <= 0) {
            return;
        }

        const newIndex = currentIndex - 1;

        set({
            currentIndex: newIndex,
            hasPrevious: newIndex > 0,
            hasNext: newIndex < history.length - 1,
        });
    },
    forward: () => {
        const { currentIndex, history } = get();

        if (currentIndex >= history.length - 1) {
            return;
        }

        const newIndex = currentIndex + 1;

        set({
            currentIndex: newIndex,
            hasPrevious: newIndex > 0,
            hasNext: newIndex < history.length - 1,
        });
    },
    reset: (state: GameBoardState) => {
        set({
            history: [state],
            currentIndex: 0,
            hasNext: false,
            hasPrevious: false,
        });
    },
}));

/**
 * Checks if the change in state is sufficient to cause a history item
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

        // Center notes have changed
        for (const note of cell.centerNotes) {
            if (!previousCell.centerNotes.has(note)) {
                return true;
            }
        }

        // Or outer notes have changed
        for (const note of cell.outerNotes) {
            if (!previousCell.outerNotes.has(note)) {
                return true;
            }
        }
    }

    return false;
}
