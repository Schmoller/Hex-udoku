import type { FC } from 'react';

export interface NumberPadProps {
    digits: number;
    onDigitSelect?: (digit: number) => void;
}

export const NumberPad: FC<NumberPadProps> = ({ digits, onDigitSelect }) => {
    const numbers = Array.from({ length: digits }, (_, i) => i + 1);

    return (
        <div className="flex flex-row gap-2 justify-between">
            {numbers.map((num) => (
                <button key={num} className="btn flex-grow text-xl" onClick={() => onDigitSelect?.(num)}>
                    {num}
                </button>
            ))}
        </div>
    );
};
