import { useEffect, useMemo } from 'react';
import type { GameBoardState } from './board';
import { deserialiseGameState, serialiseGameState } from './board-serialiser';

const BoardStorageKey = 'hexudoku-game-state';

/**
 * Stores the current game state in local storage.
 * @param state The game state to persist.
 */
export function usePersistState(state: GameBoardState): void {
    useEffect(() => {
        const serialised = serialiseGameState(state);

        localStorage.setItem(BoardStorageKey, serialised);
    }, [state]);
}

/**
 * Loads the persisted game state from local storage.
 * @returns The persisted game state, or null if no state is found or is invalid.
 */
export function loadPersistedState(): GameBoardState | null {
    const serialised = localStorage.getItem(BoardStorageKey);
    if (!serialised) {
        return null;
    }

    try {
        return deserialiseGameState(serialised);
    } catch (error) {
        console.error('Failed to parse persisted game state:', error);
        return null;
    }
}

/**
 * Retrieves the persisted state when the component mounts.
 * Changes to persisted state will not trigger re-renders.
 * @returns The persisted game state, or null if no state is found.
 */
export function usePersistedState(): GameBoardState | null {
    try {
        return loadPersistedState();
    } catch (error) {
        return null;
    }
}
