import { type FC } from 'react';
import { DigitMode } from '../common';
import classNames from 'classnames';
import { SingleModeIcon } from '../../../assets/icons/SingleMode';
import { CenterModeIcon } from '../../../assets/icons/CenterMode';
import { OuterModeIcon } from '../../../assets/icons/OuterMode';

export interface ModeSelectPadProps {
    digitMode: DigitMode;
    onUpdateDigitMode: (mode: DigitMode) => void;
}

export const ModeSelectPad: FC<ModeSelectPadProps> = ({ digitMode, onUpdateDigitMode }) => {
    return (
        <>
            <button
                className={classNames('btn', { 'btn-active': digitMode === DigitMode.Single })}
                onClick={() => onUpdateDigitMode(DigitMode.Single)}
                title="Set cell value"
            >
                <div>
                    <SingleModeIcon />
                </div>
            </button>
            <button
                className={classNames('btn', { 'btn-active': digitMode === DigitMode.CenterNote })}
                onClick={() => onUpdateDigitMode(DigitMode.CenterNote)}
                title="Set cell center note"
            >
                <div>
                    <CenterModeIcon />
                </div>
            </button>
            <button
                className={classNames('btn', { 'btn-active': digitMode === DigitMode.OuterNote })}
                onClick={() => onUpdateDigitMode(DigitMode.OuterNote)}
                title="Set cell outer note"
            >
                <div>
                    <OuterModeIcon />
                </div>
            </button>
        </>
    );
};
