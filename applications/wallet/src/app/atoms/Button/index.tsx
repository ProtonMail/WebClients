import { ButtonProps, Button as CoreButton } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import './Button.scss';

export { CoreButton };

export const Button = ({ children, className, ...rest }: ButtonProps) => (
    <CoreButton className={clsx(className, 'wallet-button', rest.size === 'small' ? 'py-1' : 'py-3')} {...rest}>
        {children}
    </CoreButton>
);
