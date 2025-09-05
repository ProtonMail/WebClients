import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { IcCheckmark } from '@proton/icons';
import { wait } from '@proton/shared/lib/helpers/promise';
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

    return (
        <Button
            className={clsx(
                'mx-auto w-full rounded-full border-none py-4 flex justify-center items-center gap-1',
                isPrimary ? 'copy-button-norm' : 'copy-button-weak',
                className,
                isPrimary && 'color-invert'
            )}
            size="large"
            onClick={async () => {
                void navigator.clipboard.writeText(text);
                setShowNotifications(true);
                await wait(3000);
                setShowNotifications(false);
            }}
        >
            {showNotifications ? c('Action').t`Copied` : c('Action').t`Copy ${title}`}
            {showNotifications && <IcCheckmark size={5} />}
        </Button>
    );
};
