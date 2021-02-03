import React from 'react';

import AppLink, { Props as LinkProps } from '../link/AppLink';

const SidebarBackButton = ({ children, ...rest }: LinkProps) => {
    return (
        <AppLink
            className="button button--primaryborder-dark button--large inline-block text-center text-bold mt0-25 w100"
            {...rest}
        >
            {children}
        </AppLink>
    );
};

export default SidebarBackButton;
