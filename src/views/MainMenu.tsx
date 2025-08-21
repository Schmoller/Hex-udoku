import type { FC } from 'react';
import { usePersistedStateAtPointInTime } from '../lib/state-persistence';

interface MainMenuProps {
    onContinue: () => void;
    onNewGame: () => void;
}

export const MainMenu: FC<MainMenuProps> = ({ onContinue, onNewGame }) => {
    const existingState = usePersistedStateAtPointInTime();

    return (
        <div className="grid place-content-center h-lvh">
            <div className="flex flex-col gap-4 items-stretch max-w-64">
                <img src="/icons/icon-512.png" />
                <h1 className="text-5xl text-center font-semibold mb-16">Hex-udoku</h1>
                {existingState && !existingState.isComplete && (
                    <button className="btn btn-xl btn-primary" onClick={onContinue}>
                        Continue
                    </button>
                )}
                <button className="btn btn-xl" onClick={onNewGame}>
                    New game
                </button>
                {/* <button className="btn btn-xl">How to play</button>
                <button className="btn btn-xl">Settings</button> */}
            </div>
        </div>
    );
};
