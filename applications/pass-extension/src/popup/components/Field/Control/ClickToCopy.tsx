import type { MouseEvent } from 'react';
import { type FC, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

export type ClickToCopyProps = { className?: string; value?: string };

export const ClickToCopy: FC<ClickToCopyProps> = ({ className, children, value = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const copyToClipboard = useCopyToClipboard();
    const [selection, setSelection] = useState(false);

    const handleClick = (evt: MouseEvent) => {
        if (selection) evt.preventDefault();
        else if (value) void copyToClipboard(value);
    };

    useEffect(() => {
        const onSelectionChange = () => {
            const selection = window.getSelection();
            setSelection(selection !== null && selection.toString().length > 0);
        };

        document.addEventListener('selectionchange', onSelectionChange);
        return () => document.removeEventListener('selectionchange', onSelectionChange);
    }, []);

    return (
        /* disabling `prefer-tag-over-role` as we cannot use a
         * `button` element here - children may include buttons and
         * this would lead to invalid DOM structure */
        /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
        <div
            ref={ref}
            className={clsx('cursor-pointer overflow-hidden', className)}
            onKeyDown={(evt) => evt.key === 'Enter' && copyToClipboard(value)}
            onClick={handleClick}
            tabIndex={0}
            role="button"
        >
            <span className="sr-only"> {c('Info').t`Press Enter to copy`}</span>
            {children}
        </div>
    );
};
