import type { FC } from 'react';
import { useGameHistory } from '../../../store/history-state';
import { UndoIcon } from '../../../assets/icons/Undo';
import { RedoIcon } from '../../../assets/icons/Redo';

export const HistoryPad: FC = () => {
    const { hasNext, hasPrevious, back, forward, currentIndex } = useGameHistory();

    return (
        <>
            <button className="btn btn-ghost" title="Undo" disabled={!hasPrevious} onClick={back}>
                <div>
                    <UndoIcon />
                </div>
                {currentIndex}
            </button>
            <button className="btn btn-ghost" title="Redo" disabled={!hasNext} onClick={forward}>
                <div>
                    <RedoIcon />
                </div>
            </button>
        </>
    );
};
