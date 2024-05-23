import { ElementType } from 'react';

import { ButtonProps, Button as CoreButton } from '@proton/atoms/Button/Button';
import CoreButtonLike, { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import clsx from '@proton/utils/clsx';

import './Button.scss';

export { CoreButton };

export const Button = ({ children, className, shadow, ...rest }: ButtonProps & { shadow?: boolean }) => (
    <CoreButton className={clsx(className, 'wallet-button')} pill {...rest}>
        {children}
    </CoreButton>
);

const defaultElement = 'button';

export const ButtonLike = <E extends ElementType = typeof defaultElement>(props: ButtonLikeProps<E>) => {
    const className = clsx(props.className, 'wallet-button');
    return <CoreButtonLike pill {...{ ...props, className }} />;
};
