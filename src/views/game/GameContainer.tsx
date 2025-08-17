import { useCallback, useMemo, useState, type FC } from 'react';
import { type GameMetadata } from '../../lib/board';
import { useGameState } from '../../lib/state-reducer';
import { GameBoardUI } from './GameBoardUI';
import { ControlPad } from './control-pad/ControlPad';
import { DigitMode } from './common';

export const GameContainer: FC = () => {
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    const meta = useMemo<GameMetadata>(() => ({ width: 9, height: 9 }), []);
    const [state, updater] = useGameState(meta);
    const [digitMode, setDigitMode] = useState<DigitMode>(DigitMode.Single);

    const handleDigitSelect = useCallback(
        (digit: number) => {
            if (digitMode === DigitMode.Single) {
                updater.toggleSelectedCellValues(digit);
            } else if (digitMode === DigitMode.CenterNote) {
                updater.toggleSelectedCellCenterNote(digit);
            } else if (digitMode === DigitMode.OuterNote) {
                updater.toggleSelectedCellOuterNote(digit);
            }
        },
        [updater, digitMode],
    );

    const handleClearSelected = useCallback(() => {
        updater.clearSelectedCells();
    }, []);

    return (
        <div className="flex flex-col items-stretch gap-2">
            <GameBoardUI
                meta={meta}
                state={state}
                showDebugInfo={showDebugInfo}
                gameUpdater={updater}
                onDigitSelect={handleDigitSelect}
            />
            <div>Status: {state.isComplete ? 'Complete' : 'Incomplete'}</div>
            <div>
                <ControlPad
                    digits={7}
                    onDigitSelect={handleDigitSelect}
                    digitMode={digitMode}
                    onUpdateDigitMode={setDigitMode}
                    onClearSelected={handleClearSelected}
                />
            </div>
        </div>
    );
};
