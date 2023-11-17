import { ButtonHTMLAttributes } from 'react';

import Icon, { IconName } from '../icon/Icon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: IconName;
    info: string;
}
export const SidebarListItemHeaderLinkButton = ({ info, icon, ...rest }: Props) => {
    return (
        <button className="navigation-link-header-group-control shrink-0" type="button" {...rest}>
            <Icon name={icon} className="navigation-icon" />
            <span className="sr-only">{info}</span>
        </button>
    );
};

export default SidebarListItemHeaderLinkButton;
