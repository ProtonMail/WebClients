import React from 'react';

import AppLink, { Props as LinkProps } from '../link/AppLink';
import { ButtonLike } from '../button';
import { Icon } from '../icon';

const SidebarBackButton = ({ children, ...rest }: LinkProps) => {
    return (
        <ButtonLike as={AppLink} size="large" color="weak" shape="solid" fullWidth className="mt0-25" {...rest}>
            <Icon name="arrow-left" />
            <span className="ml0-5 align-middle">{children}</span>
        </ButtonLike>
    );
};

export default SidebarBackButton;
