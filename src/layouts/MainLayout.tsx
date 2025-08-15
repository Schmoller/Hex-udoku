import type { FC } from 'react';

interface MainLayoutProps {
    children?: React.ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="w-lvw h-lvh flex flex-col items-stretch">
            <div className="p-4 bg-gray-600 text-blue-100 text-2xl">Hexudoku</div>
            <div className="flex-grow grid place-content-center">{children}</div>
        </div>
    );
};
