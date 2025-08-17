import { type FC } from 'react';
import { NumberPad, type NumberPadProps } from './NumberPad';
import { ModeSelectPad, type ModeSelectPadProps } from './ModeSelectPad';
import { ClearIcon } from '../../../assets/icons/Clear';

interface ControlPadProps extends NumberPadProps, ModeSelectPadProps {
    onClearSelected: () => void;
}

export const ControlPad: FC<ControlPadProps> = ({ digitMode, onUpdateDigitMode, onClearSelected, ...props }) => {
    return (
        <div className="grid grid-cols-7 gap-2">
            <NumberPad {...props} />
            <ModeSelectPad digitMode={digitMode} onUpdateDigitMode={onUpdateDigitMode} />
            <button className="btn col-start-7" title="Clear selected cells" onClick={onClearSelected}>
                <ClearIcon />
            </button>
        </div>
    );
};
