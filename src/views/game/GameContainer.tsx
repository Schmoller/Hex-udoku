import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { type GameMetadata } from '../../lib/board';
import { useGameState } from '../../lib/state-reducer';
import { GameBoardUI } from './GameBoardUI';
import { ControlPad } from './control-pad/ControlPad';
import { DigitMode } from './common';
import { GameCompleteModal } from './GameCompleteModal';

export const GameContainer: FC = () => {
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    const meta = useMemo<GameMetadata>(() => ({ width: 9, height: 9 }), []);
    const [state, updater] = useGameState(meta);
    const [explicitDigitMode, setExplicitDigitMode] = useState<DigitMode>(DigitMode.Single);
    const [implicitDigitMode, setImplicitDigitMode] = useState<DigitMode | null>(null);

    const digitMode = implicitDigitMode ?? explicitDigitMode;

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

    const handleNewGame = useCallback(() => {
        updater.newGame();
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            let handled = false;
            // Temporary mode switching
            if (event.shiftKey && !event.ctrlKey) {
                setImplicitDigitMode(DigitMode.CenterNote);
            } else if (event.ctrlKey && !event.shiftKey) {
                setImplicitDigitMode(DigitMode.OuterNote);
            } else if (event.ctrlKey && event.shiftKey) {
                // Not valid yet
                setImplicitDigitMode(null);
            }

            // Digit actions
            if (event.code.startsWith('Digit') || event.code.startsWith('Numpad')) {
                const digit = parseInt(event.code.replace('Digit', '').replace('Numpad', ''), 10);
                if (digit >= 1 && digit <= 7) {
                    handleDigitSelect(digit);
                    handled = true;
                }
            }

            // Other actions
            switch (event.code) {
                case 'Escape':
                    updater.deselectAllCells();
                    handled = true;
                    break;
                case 'Delete':
                case 'Backspace':
                    updater.clearSelectedCells();
                    handled = true;
                    break;
            }

            if (handled) {
                event.preventDefault();
            }
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.shiftKey && !event.ctrlKey) {
                setImplicitDigitMode(DigitMode.CenterNote);
            } else if (event.ctrlKey && !event.shiftKey) {
                setImplicitDigitMode(DigitMode.OuterNote);
            } else {
                setImplicitDigitMode(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [updater, handleDigitSelect]);

    return (
        <div className="flex flex-grow flex-col items-stretch gap-2 w-full sm:w-xl max-h-[50rem] justify-end md:justify-start">
            <GameBoardUI meta={meta} state={state} showDebugInfo={showDebugInfo} gameUpdater={updater} />
            <div>
                <ControlPad
                    digits={7}
                    onDigitSelect={handleDigitSelect}
                    digitMode={digitMode}
                    onUpdateDigitMode={setExplicitDigitMode}
                    onClearSelected={handleClearSelected}
                    onRestart={handleNewGame}
                />
            </div>
            <GameCompleteModal open={state.isComplete} onNewGameClick={handleNewGame} />
        </div>
    );
};
