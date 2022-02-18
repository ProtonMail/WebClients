import { forwardRef, Ref, ComponentPropsWithRef } from 'react';

import { classnames } from '../../helpers';

type InlineLinkButtonProps = ComponentPropsWithRef<'button'>;

const InlineLinkButton = forwardRef<HTMLButtonElement, InlineLinkButtonProps>(
    ({ children, className = '', ...rest }: InlineLinkButtonProps, ref: Ref<HTMLButtonElement>) => {
        return (
            <button
                type="button"
                className={classnames(['link align-baseline text-left', className])}
                ref={ref}
                {...rest}
            >
                {children}
            </button>
        );
    }
);

export default InlineLinkButton;
