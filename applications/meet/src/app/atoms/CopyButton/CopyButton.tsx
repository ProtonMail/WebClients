import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcCheckmark } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import './CopyButton.scss';

interface CopyButtonProps {
    text: string;
    isPrimary?: boolean;
    className?: string;
    title?: string;
}

export const CopyButton = ({ text, isPrimary = false, className, title = 'link' }: CopyButtonProps) => {
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (!showNotifications) {
            return;
        }
        const timeout = setTimeout(() => {
            setShowNotifications(false);
        }, 2000);
        return () => {
            clearTimeout(timeout);
        };
    }, [showNotifications]);

    return (
        <Button
            className={clsx(
                'mx-auto w-full rounded-full border-none py-4 flex justify-center items-center gap-1',
                isPrimary ? 'copy-button-norm' : 'copy-button-weak',
                className,
                isPrimary && 'color-invert'
            )}
            size="large"
            onClick={() => {
                void navigator.clipboard.writeText(text);
                setShowNotifications(true);
            }}
        >
            {showNotifications ? c('l10n_nightly Action').t`Copied` : c('l10n_nightly Action').t`Copy ${title}`}
            {showNotifications && <IcCheckmark size={5} />}
        </Button>
    );
};
