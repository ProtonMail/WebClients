import type { FC, KeyboardEvent } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

type ClickToCopyProps = {
    className?: string;
    enabled?: boolean;
    value?: string;
};

export const ClickToCopy: FC<ClickToCopyProps> = ({ className, children, enabled = true, value }) => {
    const copyToClipboard = useCopyToClipboard();
    const isEnabled = enabled && value;

    return isEnabled ? (
        <div
            className={clsx('cursor-pointer overflow-hidden', className)}
            onClick={() => copyToClipboard(value)}
            onKeyDown={(evt: KeyboardEvent<HTMLElement>) => {
                if (evt.key === 'Enter') {
                    void copyToClipboard(value);
                }
            }}
            role="button"
            tabIndex={0}
        >
            <span className="sr-only"> {c('Info').t`Press Enter to copy`}</span>
            {children}
        </div>
    ) : (
        <div className={className}>{children}</div>
    );
};
