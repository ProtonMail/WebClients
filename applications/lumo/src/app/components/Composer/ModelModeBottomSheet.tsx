import { type ReactNode, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Portal } from '@proton/atoms/Portal/Portal';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { LumoIcon } from '../LumoIcon/LumoIcon';

interface ModelModeBottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const ModelModeBottomSheet = ({ open, onClose, children }: ModelModeBottomSheetProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!open || !dialog) {
            return;
        }

        if (!dialog.open) {
            dialog.showModal();
        }

        return () => {
            if (dialog.open) {
                dialog.close();
            }
        };
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <Portal>
            <dialog
                ref={dialogRef}
                className="model-mode-sheet"
                aria-label={c('collider_2025: Label').t`Model and response mode`}
                onCancel={(event) => {
                    event.preventDefault();
                    onClose();
                }}
            >
                <button
                    type="button"
                    className="model-mode-sheet-backdrop"
                    aria-label={c('Action').t`Close`}
                    onClick={onClose}
                />
                <div className="model-mode-sheet-panel">
                    <div className="model-mode-sheet-header">
                        <div className="model-mode-sheet-handle" />
                        <Tooltip title={c('Action').t`Close`}>
                            <Button
                                shape="ghost"
                                size="small"
                                className="model-mode-sheet-close shrink-0"
                                icon
                                onClick={onClose}
                            >
                                <LumoIcon name="X" aria-label={c('Action').t`Close`} />
                            </Button>
                        </Tooltip>
                    </div>
                    <div className="model-mode-sheet-content">{children}</div>
                </div>
            </dialog>
        </Portal>
    );
};
