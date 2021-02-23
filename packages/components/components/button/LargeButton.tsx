import React from 'react';

import Button, { ButtonProps } from './Button';
import { classnames } from '../../helpers';

const LargeButton = ({ children, className = '', ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['button--large', className])} {...rest}>
            {children}
        </Button>
    );
};

export default LargeButton;
