import React from 'react';

import AppLink, { Props as LinkProps } from '../link/AppLink';
import { ButtonLike } from '../button';

const SidebarBackButton = ({ children, ...rest }: LinkProps) => {
    return (
        <ButtonLike as={AppLink} size="large" color="norm" shape="outline" fullWidth className="mt0-25" {...rest}>
            {children}
        </ButtonLike>
    );
};

export default SidebarBackButton;
