import type { FC } from 'react';
import { UndoIcon } from '../../../assets/icons/Undo';
import { RedoIcon } from '../../../assets/icons/Redo';

export interface HistoryPadProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

export const HistoryPad: FC<HistoryPadProps> = ({ canUndo, canRedo, onUndo, onRedo }) => {
    return (
        <>
            <button className="btn btn-ghost" title="Undo" disabled={!canUndo} onClick={onUndo}>
                <div>
                    <UndoIcon />
                </div>
            </button>
            <button className="btn btn-ghost" title="Redo" disabled={!canRedo} onClick={onRedo}>
                <div>
                    <RedoIcon />
                </div>
            </button>
        </>
    );
};
