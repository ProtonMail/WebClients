import React from 'react';
import Icon from '../icon/Icon';
import AppLink, { Props as LinkProps } from '../link/AppLink';

interface Props extends LinkProps {
    icon: string;
    info: string;
}
export const SidebarListItemHeaderLinkButton = ({ info, icon, ...rest }: Props) => {
    return (
        <AppLink
            className="flex navigation-link-header-group-control flex-item-noshrink mr-0-5"
            type="button"
            {...rest}
        >
            <Icon name={icon} className="navigation-icon" />
            <span className="sr-only">{info}</span>
        </AppLink>
    );
};

export default SidebarListItemHeaderLinkButton;
