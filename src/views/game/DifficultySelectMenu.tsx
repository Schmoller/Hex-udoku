import type { FC } from 'react';
import { useOverallStateStore } from '../../store/overall-state';
import { AllDifficulties, Difficulty } from '../../lib/generator/difficulty';

interface DifficultySelectMenuProps {
    onCancel: () => void;
}

// TODO: Replace with proper translation support
const DifficultyName: Record<Difficulty, string> = {
    [Difficulty.Easy]: 'Easy',
    [Difficulty.Moderate]: 'Moderate',
    [Difficulty.Hard]: 'Hard',
    [Difficulty.Extreme]: 'Extreme',
};

export const DifficultySelectMenu: FC<DifficultySelectMenuProps> = ({ onCancel }) => {
    const { startNewGame } = useOverallStateStore();

    return (
        <div className="grid place-content-center h-lvh">
            <div className="flex flex-col gap-4 items-stretch max-w-64">
                <div className="flex flex-col gap-2 mb-4">
                    <h1 className="text-5xl text-center font-semibold">New game</h1>
                    <p>Select your difficulty</p>
                </div>
                {AllDifficulties.map((difficulty) => (
                    <button
                        className="btn btn-xl btn-primary"
                        onClick={() => startNewGame({ width: 9, height: 9, difficulty })}
                    >
                        {DifficultyName[difficulty]}
                    </button>
                ))}
                <button className="btn btn-lg" onClick={onCancel}>
                    Back
                </button>
            </div>
        </div>
    );
};
