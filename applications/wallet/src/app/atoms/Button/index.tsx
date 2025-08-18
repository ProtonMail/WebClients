import { type ElementType, type Ref, forwardRef } from 'react';

import type { ButtonLikeProps, ButtonProps } from '@proton/atoms';
import { Button as CoreButton, ButtonLike as CoreButtonLike } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import './WalletButton.scss';

export { CoreButton, CoreButtonLike };

export const Button = forwardRef(
    ({ children, className, shadow, ...rest }: ButtonProps & { shadow?: boolean }, ref: Ref<HTMLButtonElement>) => (
        <CoreButton className={clsx(className, 'wallet-button', shadow && 'shadow')} pill ref={ref} {...rest}>
            {children}
        </CoreButton>
    )
);

Button.displayName = 'Button';

export const ButtonLike = forwardRef(
    <E extends ElementType = 'button'>(props: ButtonLikeProps<E> & { shadow?: boolean }, ref: Ref<Element>) => {
        const className = clsx(props.className, 'wallet-button', props.shadow && 'shadow');
        return <CoreButtonLike pill ref={ref} {...{ ...props, className }} />;
    }
);

ButtonLike.displayName = 'ButtonLike';
