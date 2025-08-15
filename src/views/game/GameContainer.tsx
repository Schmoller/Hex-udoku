import { useMemo, type FC } from 'react';
import { type GameMetadata, useGameState } from './lib/board';
import { GameBoardUI } from './GameBoardUI';

export const GameContainer: FC = () => {
    const meta = useMemo<GameMetadata>(() => ({ width: 9, height: 9 }), []);
    const [state, dispatch] = useGameState(meta);

    return (
        <div>
            <GameBoardUI meta={meta} state={state} />
        </div>
    );
};
