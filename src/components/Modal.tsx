import { useEffect, useRef, type FC, type ReactNode } from 'react';

import classNames from 'classnames';

interface ModalCloseAction {
    type: 'close';
    text: string;
}

interface ModalGeneralAction {
    type: 'general' | 'primary' | 'secondary';
    text: string;
    onClick: () => void;
}

type ModalAction = ModalCloseAction | ModalGeneralAction;

export interface ModalProps {
    open?: boolean;
    actions: ModalAction[];
    children: ReactNode;

    onClose?: () => void;
}

export const Modal: FC<ModalProps> = ({ actions, open, onClose, children }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (!dialogRef.current) {
            return;
        }

        if (open) {
            dialogRef.current.showModal();
        } else {
            dialogRef.current.close();
        }
    }, [open]);

    // Add a handler to detect dialog close
    useEffect(() => {
        if (!onClose) {
            return;
        }

        dialogRef.current?.addEventListener('close', onClose);
        return () => {
            dialogRef.current?.removeEventListener('close', onClose);
        };
    }, [onClose]);

    return (
        <dialog ref={dialogRef} className="modal">
            <div className="modal-box">
                {children}
                <div className="modal-action">
                    {actions.map((action, index) => (
                        <Action key={index} action={action} />
                    ))}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
};

interface ActionProps {
    action: ModalAction;
}

const Action: FC<ActionProps> = ({ action }) => {
    if (action.type === 'close') {
        return (
            <form method="dialog">
                <button className="btn">{action.text}</button>
            </form>
        );
    } else {
        return (
            <button
                className={classNames('btn', {
                    'btn-primary': action.type === 'primary',
                    'btn-secondary': action.type === 'secondary',
                })}
                onClick={action.onClick}
            >
                {action.text}
            </button>
        );
    }
};
