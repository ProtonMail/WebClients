import React from 'react';
import { Icon } from '../../index';
import AppLink, { Props as LinkProps } from '../link/AppLink';

interface Props extends LinkProps {
    icon: string;
    info: string;
}
export const SidebarListItemHeaderLinkButton = ({ info, icon, ...rest }: Props) => {
    return (
        <AppLink className="navigation__link--groupHeader-link flex-item-noshrink" type="button" {...rest}>
            <Icon name={icon} className="navigation__icon" />
            <span className="sr-only">{info}</span>
        </AppLink>
    );
};

export default SidebarListItemHeaderLinkButton;
