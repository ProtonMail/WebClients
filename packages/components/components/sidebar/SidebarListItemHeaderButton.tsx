import type { ButtonHTMLAttributes } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';

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
