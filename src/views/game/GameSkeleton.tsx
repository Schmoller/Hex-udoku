import type { FC } from 'react';

export const GameSkeleton: FC = () => {
    return (
        <div className="flex flex-grow flex-col items-stretch gap-2 w-full sm:w-xl max-h-[50rem] justify-center">
            <div className="flex flex-col gap-2 items-center justify-center">
                <div className="text-xl">Loading. Please wait...</div>
                <div className="loading loading-bars loading-xl"></div>
            </div>
        </div>
    );
};
