import React from 'react';

import Button, { Props as ButtonProps } from './Button';
import { classnames } from '../../helpers';

const ButtonGroup = ({ children, className = '', ...rest }: ButtonProps) => (
    <Button className={classnames(['pm-group-button', className])} {...rest}>
        {children}
    </Button>
);

export default ButtonGroup;
