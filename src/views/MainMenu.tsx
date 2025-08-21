import type { FC } from 'react';
import { usePersistedStateAtPointInTime } from '../lib/state-persistence';
import { useOverallStateStore } from '../store/overall-state';

export const MainMenu: FC = () => {
    const { startNewGame, loadAndContinueGame } = useOverallStateStore();
    const existingState = usePersistedStateAtPointInTime();

    return (
        <div className="grid place-content-center h-lvh">
            <div className="flex flex-col gap-4 items-stretch max-w-64">
                <img src="/icons/icon-512.png" />
                <h1 className="text-5xl text-center font-semibold mb-16">hex-udoku</h1>
                {existingState && !existingState.isComplete && (
                    <button className="btn btn-xl btn-primary" onClick={loadAndContinueGame}>
                        Continue
                    </button>
                )}
                <button className="btn btn-xl" onClick={() => startNewGame({ width: 9, height: 9 })}>
                    New game
                </button>
                {/* <button className="btn btn-xl">How to play</button>
                <button className="btn btn-xl">Settings</button> */}
            </div>
        </div>
    );
};
