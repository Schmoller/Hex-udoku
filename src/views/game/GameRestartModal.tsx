import type { FC } from 'react';
import { Modal } from '../../components/Modal';
import { RestartIcon } from '../../assets/icons/Restart';

export interface GameRestartModalProps {
    open?: boolean;
    onRestart: () => void;
    onClose?: () => void;
}

export const GameRestartModal: FC<GameRestartModalProps> = ({ open, onRestart, onClose }) => {
    return (
        <Modal
            actions={[
                { type: 'close', text: 'Dont restart' },
                { type: 'primary', text: 'Restart', onClick: onRestart },
            ]}
            onClose={onClose}
            open={open}
        >
            <h3 className="text-xl font-semibold flex flex-row gap-2">
                <RestartIcon />
                Restart?
            </h3>
            <p>If you restart you will lose all your progress.</p>
        </Modal>
    );
};
