import { initialiseGameState, type GameMetadata } from '../board';
import { serialiseGameState } from '../board-serialiser';

self.onmessage = (event: MessageEvent) => {
    console.log('Initialising game state in background');
    const metadata = event.data as GameMetadata;
    const initialState = initialiseGameState(metadata);
    self.postMessage(serialiseGameState(initialState));
};
