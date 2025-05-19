import type { MouseEvent, MouseEventHandler, PropsWithChildren } from 'react';
import { type FC, useRef } from 'react';

import { c } from 'ttag';

import { useCopyToClipboard } from '@proton/pass/hooks/useCopyToClipboard';
import { SelectionManager } from '@proton/pass/utils/dom/selection';
import clsx from '@proton/utils/clsx';

export type ClickToCopyProps = { className?: string; onClick?: MouseEventHandler; value?: string | (() => string) };

export const ClickToCopy: FC<PropsWithChildren<ClickToCopyProps>> = ({ className, children, onClick, value = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const copyToClipboard = useCopyToClipboard();
    const getValue = () => (value instanceof Function ? value() : value);

    const handleClick = async (evt: MouseEvent) => {
        if (ref.current && SelectionManager.hasChildOf(ref.current)) evt.preventDefault();
        else if (value) await copyToClipboard(getValue());
        onClick?.(evt);
    };

    return (
        /* disabling `prefer-tag-over-role` as we cannot use a
         * `button` element here - children may include buttons and
         * this would lead to invalid DOM structure */
        /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
        <div
            ref={ref}
            className={clsx('cursor-pointer overflow-hidden', className)}
            onKeyDown={(evt) => evt.key === 'Enter' && copyToClipboard(getValue())}
            onClick={handleClick}
            tabIndex={0}
            role="button"
        >
            <span className="sr-only"> {c('Info').t`Press Enter to copy`}</span>
            {children}
        </div>
    );
};
