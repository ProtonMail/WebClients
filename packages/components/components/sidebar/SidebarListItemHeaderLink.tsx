import type { Ref } from 'react';
import { forwardRef } from 'react';

import type { IconComponent } from '@proton/icons/component';

import type { AppLinkProps } from '../link/AppLink';
import AppLink from '../link/AppLink';

interface Props extends AppLinkProps {
    icon: IconComponent;
    alt: string;
}
const SidebarListItemHeaderLink = ({ alt, icon: Icon, ...rest }: Props, ref: Ref<HTMLAnchorElement>) => {
    return (
        <AppLink className="flex navigation-link-header-group-control shrink-0" type="button" ref={ref} {...rest}>
            <Icon className="navigation-icon" alt={alt} />
        </AppLink>
    );
};

export default forwardRef<HTMLAnchorElement, Props>(SidebarListItemHeaderLink);
