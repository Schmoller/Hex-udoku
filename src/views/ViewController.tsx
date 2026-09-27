import { type FC } from 'react';
import { MainMenu } from './MainMenu';
import { GameLoadingContainer } from './game/GameLoadingContainer';
import { MainLayout } from '../layouts/MainLayout';
import { useOverallStateStore, View } from '../store/overall-state';
import { DifficultySelectMenu } from './game/DifficultySelectMenu';

export const ViewController: FC = () => {
    const { currentView, gameStateLoader, gameMetadata, showMainMenu } = useOverallStateStore();

    switch (currentView) {
        case View.MainMenu:
            return <MainMenu />;
        case View.Playing:
            return (
                <MainLayout>
                    {gameStateLoader && gameMetadata && (
                        <GameLoadingContainer loader={gameStateLoader} metadata={gameMetadata} />
                    )}
                </MainLayout>
            );
        case View.DifficultySelect:
            return <DifficultySelectMenu onCancel={showMainMenu} />;
    }
};
