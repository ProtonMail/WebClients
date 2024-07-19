import type { ElementType } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button as CoreButton } from '@proton/atoms/Button/Button';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import CoreButtonLike from '@proton/atoms/Button/ButtonLike';
import clsx from '@proton/utils/clsx';

import './WalletButton.scss';

export { CoreButton, CoreButtonLike };

export const Button = ({ children, className, shadow, ...rest }: ButtonProps & { shadow?: boolean }) => (
    <CoreButton className={clsx(className, 'wallet-button', shadow && 'shadow')} pill {...rest}>
        {children}
    </CoreButton>
);

const defaultElement = 'button';

export const ButtonLike = <E extends ElementType = typeof defaultElement>(
    props: ButtonLikeProps<E> & { shadow?: boolean }
) => {
    const className = clsx(props.className, 'wallet-button', props.shadow && 'shadow');
    return <CoreButtonLike pill {...{ ...props, className }} />;
};
