import { type FC } from 'react';
import { NumberPad, type NumberPadProps } from './NumberPad';
import { DigitMode } from '../common';
import classNames from 'classnames';

interface ControlPadProps extends NumberPadProps {
    digitMode: DigitMode;
    onUpdateDigitMode: (mode: DigitMode) => void;
}

export const ControlPad: FC<ControlPadProps> = ({ digitMode, onUpdateDigitMode, ...props }) => {
    return (
        <div className="space-y-2">
            <NumberPad {...props} />
            <div className="flex flex-row gap-2">
                <button
                    className={classNames('btn', { 'btn-active': digitMode === DigitMode.Single })}
                    onClick={() => onUpdateDigitMode(DigitMode.Single)}
                >
                    Single
                </button>
                <button
                    className={classNames('btn', { 'btn-active': digitMode === DigitMode.CenterNote })}
                    onClick={() => onUpdateDigitMode(DigitMode.CenterNote)}
                >
                    Center
                </button>
            </div>
        </div>
    );
};
