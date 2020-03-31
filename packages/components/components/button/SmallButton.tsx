import React from 'react';

import Button, { Props as ButtonProps } from './Button';
import { classnames } from '../../helpers/component';

const SmallButton = ({ children, className = '', ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['pm-button--small', className])} {...rest}>
            {children}
        </Button>
    );
};

export default SmallButton;
