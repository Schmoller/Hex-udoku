import type { FC } from 'react';

interface MainLayoutProps {
    children?: React.ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="w-lvw h-lvh flex flex-col items-stretch">
            <div className="navbar bg-base-200 shadow-sm flex flex-row gap-2">
                <img src="/icons/icon-512.png" className="w-12 h-12" />
                hex-udoku
            </div>
            <div className="flex-grow p-6 flex flex-col items-center justify-center">{children}</div>
        </div>
    );
};
