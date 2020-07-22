import React from 'react';

import Button, { Props as ButtonProps } from '../button/Button';

const SidebarBackButton = ({ children, ...rest }: ButtonProps) => {
    return (
        <Button className="pm-button--primaryborder-dark pm-button--large bold mt0-25 w100" {...rest}>
            {children}
        </Button>
    );
};

export default SidebarBackButton;
