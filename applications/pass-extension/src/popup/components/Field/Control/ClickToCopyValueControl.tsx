import type { FC, KeyboardEvent } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

type Props = {
    value: string;
    onCopySuccess?: () => void;
    onCopyFailure?: () => void;
};

export const ClickToCopyValueControl: FC<Props> = ({ children, value }) => {
    const copyToClipboard = useCopyToClipboard();

    const handleKeyDown = (evt: KeyboardEvent<HTMLElement>) => {
        if (evt.key === 'Enter') {
            void copyToClipboard(value);
        }
    };

    const empty = value === '';
    const notEmptyValueProps = !empty && {
        onClick: () => copyToClipboard(value),
        onKeyDown: handleKeyDown,
        tabIndex: 0,
    };

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
