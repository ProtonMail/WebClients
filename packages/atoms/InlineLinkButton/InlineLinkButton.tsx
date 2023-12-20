import { ComponentPropsWithRef, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

interface InlineLinkButtonProps extends ComponentPropsWithRef<'button'> {}

const InlineLinkButtonBase = (
    { children, className = '', ...rest }: InlineLinkButtonProps,
    ref: Ref<HTMLButtonElement>
) => {
    return (
        <button
            type="button"
            className={clsx(['link link-focus align-baseline text-left', className])}
            ref={ref}
            {...rest}
        >
            {children}
        </button>
    );
};

export const InlineLinkButton = forwardRef<HTMLButtonElement, InlineLinkButtonProps>(InlineLinkButtonBase);
