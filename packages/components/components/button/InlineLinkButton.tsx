import { ComponentPropsWithRef, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

type InlineLinkButtonProps = ComponentPropsWithRef<'button'>;

const InlineLinkButton = forwardRef<HTMLButtonElement, InlineLinkButtonProps>(
    ({ children, className = '', ...rest }: InlineLinkButtonProps, ref: Ref<HTMLButtonElement>) => {
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
    }
);

export default InlineLinkButton;
