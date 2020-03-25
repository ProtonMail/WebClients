import React from 'react';
import Button, { Props as ButtonProps } from './Button';

const ErrorButton = ({ children, ...rest }: ButtonProps) => {
    return (
        <Button className="pm-button--error" {...rest}>
            {children}
        </Button>
    );
};

export default ErrorButton;
