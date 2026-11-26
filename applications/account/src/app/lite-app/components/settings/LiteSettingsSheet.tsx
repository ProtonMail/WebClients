import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    description?: ReactNode;
    /** Shown above Cancel */
    submitButton?: ReactNode;
    onSubmit?: () => void;
    onCancel: () => void;
    children?: ReactNode;
}

/** Form of a lite page opened in a native sheet, which shows the title. From the Figma add-calendar frames. */
const LiteSettingsSheet = ({ className, description, submitButton, onSubmit, onCancel, children }: Props) => {
    return (
        <form
            className={clsx('lite-settings-sheet', className)}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit?.();
            }}
        >
            {description && <p className="lite-settings-sheet-description">{description}</p>}
            {children}
            <div className="lite-settings-sheet-actions">
                {submitButton}
                <Button fullWidth pill size="large" onClick={onCancel}>
                    {c('Action').t`Cancel`}
                </Button>
            </div>
        </form>
    );
};

export default LiteSettingsSheet;
