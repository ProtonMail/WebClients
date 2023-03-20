import { Ref, forwardRef } from 'react';

import Icon, { IconName } from '../icon/Icon';
import AppLink, { AppLinkProps } from '../link/AppLink';

interface Props extends AppLinkProps {
    icon: IconName;
    info: string;
}
export const SidebarListItemHeaderLinkButton = ({ info, icon, ...rest }: Props, ref: Ref<HTMLAnchorElement>) => {
    return (
        <AppLink
            className="flex navigation-link-header-group-control flex-item-noshrink -mr0-5"
            type="button"
            ref={ref}
            {...rest}
        >
            <Icon name={icon} className="navigation-icon" />
            <span className="sr-only">{info}</span>
        </AppLink>
    );
};

export default forwardRef<HTMLAnchorElement, Props>(SidebarListItemHeaderLinkButton);
