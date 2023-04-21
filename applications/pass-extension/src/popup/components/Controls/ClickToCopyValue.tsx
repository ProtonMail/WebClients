import type { FC, KeyboardEvent } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { logger } from '@proton/pass/utils/logger';
import clsx from '@proton/utils/clsx';

type Props = {
    value: string;
    onCopySuccess?: () => void;
    onCopyFailure?: () => void;
};

export const ClickToCopyValue: FC<Props> = ({ children, value, ...props }) => {
    const { createNotification } = useNotifications();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            createNotification({ type: 'success', text: c('Info').t`Copied to clipboard`, showCloseButton: false });
            props.onCopySuccess?.();
        } catch (err) {
            createNotification({ type: 'error', text: c('Info').t`Unable to copy to clipboard` });
            logger.error(`[Popup] unable to copy to clipboard`);
            props.onCopyFailure?.();
        }
    };

    const handleKeyDown = (evt: KeyboardEvent<HTMLElement>) => {
        if (evt.key === 'Enter') {
            void handleCopy();
        }
    };

    const empty = value === '';
    const notEmptyValueProps = !empty && { onClick: handleCopy, onKeyDown: handleKeyDown, tabIndex: 0 };

    return (
        <div
            className={clsx('overflow-hidden', !empty && 'cursor-pointer pass-value-control--interactive-focus')}
            {...notEmptyValueProps}
        >
            {!empty && <span className="sr-only"> {c('Info').t`Press Enter to copy`}</span>}
            {children}
        </div>
    );
};
