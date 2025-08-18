import { Suspense, useMemo, type FC } from 'react';
import { initialiseGameState, type GameBoardState, type GameMetadata } from '../../lib/board';
import { GameContainer } from './GameContainer';
import { deserialiseGameState } from '../../lib/board-serialiser';
import { GameSkeleton } from './GameSkeleton';

export const GameLoadingContainer: FC = () => {
    const meta = useMemo<GameMetadata>(() => ({ width: 9, height: 9 }), []);
    const gameInitialiser = useMemo(() => {
        return fetchGameBoardState(meta);
    }, [meta]);

    return (
        <>
            <Suspense fallback={<GameSkeleton />}>
                <GameContainer boardInitialiser={gameInitialiser} metadata={meta} />
            </Suspense>
        </>
    );
};

function fetchGameBoardState(metadata: GameMetadata): Promise<GameBoardState> {
    return new Promise((resolve) => {
        if (window.Worker) {
            console.log('Starting worker to initialise game state');
            const worker = new Worker(new URL('../../lib/workers/game-initialiser.ts', import.meta.url), {
                type: 'module',
            });
            worker.onmessage = (event) => {
                const state = deserialiseGameState(event.data);
                resolve(state);
                worker.terminate();
            };
            worker.postMessage(metadata);
        } else {
            console.warn('Web Workers are not supported in this environment, falling back to direct initialisation');
            resolve(initialiseGameState(metadata));
        }
    });
}
