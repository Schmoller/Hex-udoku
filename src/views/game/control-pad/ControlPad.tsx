import { type FC } from 'react';
import { NumberPad, type NumberPadProps } from './NumberPad';
import { ModeSelectPad, type ModeSelectPadProps } from './ModeSelectPad';

interface ControlPadProps extends NumberPadProps, ModeSelectPadProps {}

export const ControlPad: FC<ControlPadProps> = ({ digitMode, onUpdateDigitMode, ...props }) => {
    return (
        <div className="grid grid-cols-7 gap-2">
            <NumberPad {...props} />
            <ModeSelectPad digitMode={digitMode} onUpdateDigitMode={onUpdateDigitMode} />
        </div>
    );
};
