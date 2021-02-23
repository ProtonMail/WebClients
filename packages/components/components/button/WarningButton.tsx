import React from 'react';
import Button, { ButtonProps } from './Button';
import { classnames } from '../../helpers';

const WarningButton = ({ children, className = '', ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['button--warning', className])} {...rest}>
            {children}
        </Button>
    );
};

export default WarningButton;
