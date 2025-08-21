import { Suspense, type FC } from 'react';
import { type GameBoardState, type GameMetadata } from '../../lib/board';
import { GameContainer } from './GameContainer';
import { GameSkeleton } from './GameSkeleton';

interface GameLoadingContainerProps {
    loader: Promise<GameBoardState>;
    metadata: GameMetadata;
}

export const GameLoadingContainer: FC<GameLoadingContainerProps> = ({ loader, metadata }) => {
    return (
        <>
            <Suspense fallback={<GameSkeleton />}>
                <GameContainer boardInitialiser={loader} metadata={metadata} />
            </Suspense>
        </>
    );
};
