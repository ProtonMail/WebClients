import React from 'react';
import Button, { Props as ButtonProps } from './Button';
import { classnames } from '../../helpers/component';

const ErrorButton = ({ children, className, ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['pm-button--error', className])} {...rest}>
            {children}
        </Button>
    );
};

export default ErrorButton;
