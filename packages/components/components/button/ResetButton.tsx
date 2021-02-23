import React from 'react';
import Button, { ButtonProps } from './Button';

const ResetButton = ({ children, ...rest }: ButtonProps) => (
    <Button type="reset" {...rest}>
        {children}
    </Button>
);

export default ResetButton;
