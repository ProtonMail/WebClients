import React from 'react';
import { Icon } from '../../index';
import Link, { Props as LinkProps } from '../../components/link/Link';

interface Props extends LinkProps {
    icon: string;
    info: string;
}
export const SidebarListItemHeaderLinkButton = ({ info, icon, ...rest }: Props) => {
    return (
        <Link className="navigation__link--groupHeader-link flex-item-noshrink" type="button" {...rest}>
            <Icon name={icon} className="navigation__icon" />
            <span className="sr-only">{info}</span>
        </Link>
    );
};

export default SidebarListItemHeaderLinkButton;
