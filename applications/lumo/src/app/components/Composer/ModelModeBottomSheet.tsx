import { type ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Portal } from '@proton/components/components/portal';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';

interface ModelModeBottomSheetProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const ModelModeBottomSheet = ({ open, onClose, children }: ModelModeBottomSheetProps) => {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <Portal>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
            <div className="model-mode-sheet-overlay" onClick={onClose}>
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                <div
                    className="model-mode-sheet"
                    role="dialog"
                    aria-modal="true"
                    aria-label={c('collider_2025: Label').t`Model and response mode`}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="model-mode-sheet-header">
                        <div className="model-mode-sheet-handle" aria-hidden="true" />
                        <Tooltip title={c('Action').t`Close`}>
                            <Button
                                shape="ghost"
                                size="small"
                                className="model-mode-sheet-close shrink-0"
                                icon
                                onClick={onClose}
                            >
                                <IcCrossBig alt={c('Action').t`Close`} />
                            </Button>
                        </Tooltip>
                    </div>
                    <div className="model-mode-sheet-content">{children}</div>
                </div>
            </div>
        </Portal>
    );
};
