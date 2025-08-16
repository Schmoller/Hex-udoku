import { type FC } from 'react';
import { NumberPad, type NumberPadProps } from './NumberPad';

interface ControlPadProps extends NumberPadProps {}

export const ControlPad: FC<ControlPadProps> = (props) => {
    return (
        <div>
            <NumberPad {...props} />
        </div>
    );
};
