import { useMemo, useState, type FC } from 'react';
import { type GameMetadata, useGameState } from '../../lib/board';
import { GameBoardUI } from './GameBoardUI';

export const GameContainer: FC = () => {
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    const meta = useMemo<GameMetadata>(() => ({ width: 9, height: 9 }), []);
    const [state, updater] = useGameState(meta);

    return (
        <div>
            <GameBoardUI meta={meta} state={state} showDebugInfo={showDebugInfo} gameUpdater={updater} />
            <button onClick={() => setShowDebugInfo(!showDebugInfo)}>Toggle Debug Info</button>
            <div>Status: {state.isComplete ? 'Complete' : 'Incomplete'}</div>
        </div>
    );
};
