import type { FC } from 'react';
import { Modal } from '../../components/Modal';
import { VictoryIcon } from '../../assets/icons/Victory';

export interface GameCompleteModalProps {
    open?: boolean;
    onNewGameClick: () => void;
}

export const GameCompleteModal: FC<GameCompleteModalProps> = ({ open, onNewGameClick }) => {
    return (
        <Modal
            actions={[
                { type: 'close', text: 'Close' },
                { type: 'primary', text: 'New game', onClick: onNewGameClick },
            ]}
            open={open}
        >
            <h3 className="text-xl font-semibold flex flex-row gap-2">
                <VictoryIcon />
                Victory!
            </h3>
            <p>You have successfully completed the puzzle</p>
        </Modal>
    );
};
