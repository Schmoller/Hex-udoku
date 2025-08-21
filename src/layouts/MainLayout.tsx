import type { FC } from 'react';
import { useOverallStateStore } from '../store/overall-state';

interface MainLayoutProps {
    children?: React.ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
    const { showMainMenu } = useOverallStateStore();

    return (
        <div className="w-lvw h-lvh flex flex-col items-stretch">
            <div className="navbar bg-base-200 shadow-sm flex flex-row gap-2">
                <button onClick={showMainMenu} className="btn btn-ghost">
                    <img src="/icons/icon-512.png" className="w-12 h-12" />
                    hex-udoku
                </button>
            </div>
            <div className="flex-grow p-6 flex flex-col items-center justify-center">{children}</div>
        </div>
    );
};
