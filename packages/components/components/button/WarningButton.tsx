import React from 'react';
import Button, { Props as ButtonProps } from './Button';
import { classnames } from '../../helpers/component';

const WarningButton = ({ children, className = '', ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['pm-button--warning', className])} {...rest}>
            {children}
        </Button>
    );
};

export default WarningButton;
