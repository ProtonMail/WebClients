import * as React from 'react';
import Icon from '../icon/Icon';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    info: string;
}
export const SidebarListItemHeaderLinkButton = ({ info, icon, ...rest }: Props) => {
    return (
        <button className="navigation-link-header-group-control flex-item-noshrink" type="button" {...rest}>
            <Icon name={icon} className="navigation-icon" />
            <span className="sr-only">{info}</span>
        </button>
    );
};

export default SidebarListItemHeaderLinkButton;
