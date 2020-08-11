import React from 'react';

import AppLink, { Props as LinkProps } from '../link/AppLink';

const SidebarBackButton = ({ children, ...rest }: LinkProps) => {
    return (
        <AppLink
            className="pm-button pm-button--primaryborder-dark pm-button--large inbl aligncenter bold mt0-25 w100"
            {...rest}
        >
            {children}
        </AppLink>
    );
};

export default SidebarBackButton;
