import { type ElementType, type Ref, forwardRef } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button as CoreButton } from '@proton/atoms/Button/Button';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import CoreButtonLike from '@proton/atoms/Button/ButtonLike';
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

const defaultElement = 'button';

export const ButtonLike = forwardRef(
    <E extends ElementType = typeof defaultElement>(
        props: ButtonLikeProps<E> & { shadow?: boolean },
        ref: Ref<Element>
    ) => {
        const className = clsx(props.className, 'wallet-button', props.shadow && 'shadow');
        return <CoreButtonLike pill ref={ref} {...{ ...props, className }} />;
    }
);

ButtonLike.displayName = 'ButtonLike';
