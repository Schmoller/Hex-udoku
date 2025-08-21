import { Suspense, useMemo, type FC } from 'react';
import { type GameMetadata } from '../../lib/board';
import { GameContainer } from './GameContainer';
import { GameSkeleton } from './GameSkeleton';
import { asyncGenerateNewBoard } from '../../lib/generator/async-generate';

export const GameLoadingContainer: FC = () => {
    const meta = useMemo<GameMetadata>(() => ({ width: 9, height: 9 }), []);
    const gameInitialiser = useMemo(() => {
        return asyncGenerateNewBoard(meta);
    }, [meta]);

    return (
        <>
            <Suspense fallback={<GameSkeleton />}>
                <GameContainer boardInitialiser={gameInitialiser} metadata={meta} />
            </Suspense>
        </>
    );
};
