import React from 'react';
import Button, { ButtonProps } from './Button';
import { classnames } from '../../helpers';

const ErrorButton = ({ children, className, ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['button--error', className])} {...rest}>
            {children}
        </Button>
    );
};

export default ErrorButton;
