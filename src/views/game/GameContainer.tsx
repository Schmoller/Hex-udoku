import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { type GameBoardState, type GameMetadata } from '../../lib/board';
import { useGameState } from '../../lib/state-reducer';
import { GameBoardUI } from './GameBoardUI';
import { ControlPad } from './control-pad/ControlPad';
import { DigitMode } from './common';
import { GameCompleteModal } from './GameCompleteModal';
import { usePersistState } from '../../lib/state-persistence';
import { useGameHistory } from '../../store/history-state';

interface GameContainerProps {
    boardInitialiser: Promise<GameBoardState>;
    metadata: GameMetadata;
}

export const GameContainer: FC<GameContainerProps> = ({ boardInitialiser, metadata }) => {
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    const [state, updater] = useGameState(metadata, boardInitialiser);

    usePersistState(state);

    const { history, currentIndex, push, reset } = useGameHistory();

    // Set right before calling updater.newGame() so the next history push
    // starts a fresh history instead of appending to the previous game's.
    const isNewGameRef = useRef(false);

    useEffect(() => {
        if (isNewGameRef.current) {
            isNewGameRef.current = false;
            reset(state);
        } else {
            push(state);
        }
    }, [state, push, reset]);

    // Applies the state at the current history index back into the game, but
    // only when it was moved there by undo/redo: after a push, history[currentIndex]
    // is state itself, so this is a no-op and doesn't fight the effect above.
    useEffect(() => {
        const target = history[currentIndex];
        if (target && target !== state) {
            updater.restoreState(target);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

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
        isNewGameRef.current = true;
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
            <GameBoardUI meta={metadata} state={state} showDebugInfo={showDebugInfo} gameUpdater={updater} />
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
