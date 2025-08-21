import { initialiseGameState, type GameBoardState, type GameMetadata } from '../board';
import { deserialiseGameState } from '../board-serialiser';

export function asyncGenerateNewBoard(metadata: GameMetadata): Promise<GameBoardState> {
    if (!window.Worker) {
        console.warn('Web Workers are not supported in this environment, falling back to direct initialisation');
        return Promise.resolve(initialiseGameState(metadata));
    }

    return new Promise((resolve, reject) => {
        console.log('Starting worker to initialise game state');
        const worker = new Worker(new URL('../workers/game-initialiser.ts', import.meta.url), {
            type: 'module',
        });
        worker.onmessage = (event) => {
            try {
                const state = deserialiseGameState(event.data);
                resolve(state);
                worker.terminate();
            } catch (error) {
                console.error('Failed to deserialize game state from worker:', error);
                reject(error);
            }
        };
        worker.postMessage(metadata);
    });
}
