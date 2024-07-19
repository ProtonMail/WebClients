import type { Ref } from 'react';
import { forwardRef } from 'react';

import type { IconName } from '../icon/Icon';
import Icon from '../icon/Icon';
import type { AppLinkProps } from '../link/AppLink';
import AppLink from '../link/AppLink';

interface Props extends AppLinkProps {
    icon: IconName;
    alt: string;
}
export const SidebarListItemHeaderLinkButton = ({ alt, icon, ...rest }: Props, ref: Ref<HTMLAnchorElement>) => {
    return (
        <AppLink className="flex navigation-link-header-group-control shrink-0" type="button" ref={ref} {...rest}>
            <Icon name={icon} className="navigation-icon" alt={alt} />
        </AppLink>
    );
};

export default forwardRef<HTMLAnchorElement, Props>(SidebarListItemHeaderLinkButton);
