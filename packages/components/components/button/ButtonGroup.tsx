import React from 'react';

import Button, { ButtonProps } from './Button';
import { classnames } from '../../helpers';

const ButtonGroup = ({ children, className = '', ...rest }: ButtonProps) => (
    <Button className={classnames(['grouped-button', className])} {...rest}>
        {children}
    </Button>
);

export default ButtonGroup;
