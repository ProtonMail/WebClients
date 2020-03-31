import React from 'react';

import Button, { Props as ButtonProps } from './Button';
import { classnames } from '../../helpers/component';

const LinkButton = ({ children, className = '', ...rest }: ButtonProps) => {
    return (
        <Button className={classnames(['pm-button--link', className])} {...rest}>
            {children}
        </Button>
    );
};

export default LinkButton;
