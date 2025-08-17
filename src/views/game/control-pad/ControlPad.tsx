import { useState, type FC } from 'react';
import { NumberPad, type NumberPadProps } from './NumberPad';
import { ModeSelectPad, type ModeSelectPadProps } from './ModeSelectPad';
import { ClearIcon } from '../../../assets/icons/Clear';
import { RestartIcon } from '../../../assets/icons/Restart';
import { GameRestartModal } from '../GameRestartModal';

interface ControlPadProps extends NumberPadProps, ModeSelectPadProps {
    onClearSelected: () => void;
    onRestart: () => void;
}

export const ControlPad: FC<ControlPadProps> = ({
    digitMode,
    onUpdateDigitMode,
    onClearSelected,
    onRestart,
    ...props
}) => {
    const [showRestartConfirmation, setShowRestartConfirmation] = useState(false);

    return (
        <div className="grid grid-cols-7 gap-2">
            <NumberPad {...props} />
            <ModeSelectPad digitMode={digitMode} onUpdateDigitMode={onUpdateDigitMode} />
            <button className="btn col-start-7" title="Clear selected cells" onClick={onClearSelected}>
                <ClearIcon />
            </button>
            <button
                className="btn btn-ghost btn-error col-start-7"
                title="Restart game"
                onClick={() => setShowRestartConfirmation(true)}
            >
                <RestartIcon />
            </button>
            <GameRestartModal
                open={showRestartConfirmation}
                onClose={() => setShowRestartConfirmation(false)}
                onRestart={() => {
                    setShowRestartConfirmation(false);
                    onRestart();
                }}
            />
        </div>
    );
};
