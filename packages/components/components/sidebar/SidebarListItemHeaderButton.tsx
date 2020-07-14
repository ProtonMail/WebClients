import React from 'react';
import { Icon } from '../../index';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    info: string;
}
export const SidebarListItemHeaderLinkButton = ({ info, icon, ...rest }: Props) => {
    return (
        <button className="navigation__link--groupHeader-link flex-item-noshrink" type="button" {...rest}>
            <Icon name={icon} className="navigation__icon" />
            <span className="sr-only">{info}</span>
        </button>
    );
};

export default SidebarListItemHeaderLinkButton;
