import React from 'react';

import Button, { Props as ButtonProps } from './Button';
import { classnames } from '../../helpers/component';

const LargeButton = ({ children, className = '', ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['pm-button--large', className])} {...rest}>
            {children}
        </Button>
    );
};

export default LargeButton;
