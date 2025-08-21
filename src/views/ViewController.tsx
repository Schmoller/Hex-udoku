import { useCallback, useState, type FC } from 'react';
import { MainMenu } from './MainMenu';
import { GameLoadingContainer } from './game/GameLoadingContainer';
import { MainLayout } from '../layouts/MainLayout';
import { type GameBoardState, type GameMetadata } from '../lib/board';
import { asyncGenerateNewBoard } from '../lib/generator/async-generate';
import { loadPersistedState } from '../lib/state-persistence';

const enum View {
    MainMenu,
    Playing,
}

export const ViewController: FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.MainMenu);
    // For in-progress games
    const [gameStateLoader, setGameStateLoader] = useState<Promise<GameBoardState> | null>(null);
    const [gameMetadata, setGameMetadata] = useState<GameMetadata | null>(null);

    const handleNewGame = useCallback(() => {
        const metadata: GameMetadata = { width: 9, height: 9 };
        const loader = asyncGenerateNewBoard(metadata);
        setGameStateLoader(loader);
        setGameMetadata(metadata);
        setCurrentView(View.Playing);
    }, []);

    const handleContinueGame = useCallback(() => {
        // TODO: Replace with actual metadata retrieval logic
        const metadata: GameMetadata = { width: 9, height: 9 };
        const gameState = loadPersistedState();
        if (gameState) {
            setGameStateLoader(Promise.resolve(gameState));
            setGameMetadata(metadata);
            setCurrentView(View.Playing);
        } else {
            console.warn('No saved game state found, starting a new game');
            handleNewGame();
        }
    }, [handleNewGame]);

    switch (currentView) {
        case View.MainMenu:
            return <MainMenu onNewGame={handleNewGame} onContinue={handleContinueGame} />;
        case View.Playing:
            return (
                <MainLayout>
                    {gameStateLoader && gameMetadata && (
                        <GameLoadingContainer loader={gameStateLoader} metadata={gameMetadata} />
                    )}
                </MainLayout>
            );
    }
};
