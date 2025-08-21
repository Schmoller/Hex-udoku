import { create } from 'zustand';
import type { GameBoardState, GameMetadata } from '../lib/board';
import { asyncGenerateNewBoard } from '../lib/generator/async-generate';
import { loadPersistedState } from '../lib/state-persistence';

export const enum View {
    MainMenu,
    Playing,
}

interface OverallGameState {
    currentView: View;
    gameStateLoader: Promise<GameBoardState> | null;
    gameMetadata: GameMetadata | null;
}

interface OverallStateActions {
    showMainMenu: () => void;
    startNewGame: (metadata: GameMetadata) => void;
    loadAndContinueGame: () => void;
}

export const useOverallStateStore = create<OverallGameState & OverallStateActions>((set, get) => ({
    currentView: View.MainMenu,
    gameStateLoader: null,
    gameMetadata: null,

    showMainMenu: () => {
        set({
            currentView: View.MainMenu,
            gameStateLoader: null,
            gameMetadata: null,
        });
    },
    startNewGame: (metadata) => {
        const loader = asyncGenerateNewBoard(metadata);
        set({
            gameStateLoader: loader,
            gameMetadata: metadata,
            currentView: View.Playing,
        });
    },
    loadAndContinueGame: () => {
        const gameState = loadPersistedState();
        if (gameState) {
            const metadata: GameMetadata = { width: 9, height: 9 }; // Replace with actual metadata retrieval logic
            set({
                gameStateLoader: Promise.resolve(gameState),
                gameMetadata: metadata,
                currentView: View.Playing,
            });
        } else {
            console.warn('No saved game state found, starting a new game');
            get().startNewGame({ width: 9, height: 9 }); // Default metadata
        }
    },
}));
