import type { MouseEvent, PropsWithChildren } from 'react';
import { type FC, useRef } from 'react';

import { c } from 'ttag';

import { ClipboardProvider, useOnCopyToClipboard } from '@proton/pass/components/Settings/Clipboard/ClipboardProvider';
import { SelectionManager } from '@proton/pass/utils/dom/selection';
import clsx from '@proton/utils/clsx';

export type ClickToCopyProps = {
    className?: string;
    value?: string | (() => string);
    onCopy?: () => void;
};

const ClickToCopyInternal: FC<PropsWithChildren<ClickToCopyProps>> = ({ className, children, onCopy, value = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    // const { showModal, onCloseModal, onCopyToClipboard } = useCopyToClipboard();
    const onCopyToClipboard = useOnCopyToClipboard();
    const getValue = () => (value instanceof Function ? value() : value);

    const handleClick = (evt: MouseEvent) => {
        if (ref.current && SelectionManager.hasChildOf(ref.current)) evt.preventDefault();
        else if (value) {
            void onCopyToClipboard(getValue());
            onCopy?.();
        }
    };

    return (
        /* disabling `prefer-tag-over-role` as we cannot use a * `button` element here - children may include
            buttons and * this would lead to invalid DOM structure */
        /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
        <div
            ref={ref}
            className={clsx('cursor-pointer overflow-hidden', className)}
            onKeyDown={(evt) => evt.key === 'Enter' && onCopyToClipboard(getValue())}
            onClick={handleClick}
            tabIndex={0}
            role="button"
        >
            <span className="sr-only"> {c('Info').t`Press Enter to copy`}</span>
            {children}
        </div>
    );
};

export const ClickToCopy: FC<PropsWithChildren<ClickToCopyProps>> = (props) => {
    return (
        <ClipboardProvider>
            <ClickToCopyInternal {...props} />
        </ClipboardProvider>
    );
};
