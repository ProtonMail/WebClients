import type { ReactNode } from 'react';

import type { IconComponent } from '@proton/icons/component';

import SidebarListItem from './SidebarListItem';
import SidebarListItemContent from './SidebarListItemContent';
import SidebarListItemContentIcon from './SidebarListItemContentIcon';
import type { Props as SidebarListItemProps } from './SidebarListItemLink';
import SidebarListItemLink from './SidebarListItemLink';

interface Props extends SidebarListItemProps {
    to: string;
    icon?: IconComponent;
    children: ReactNode;
}

const SimpleSidebarListItemLink = ({ to, children, icon, ...rest }: Props) => {
    const left = icon ? <SidebarListItemContentIcon icon={icon} /> : null;
    return (
        <SidebarListItem>
            <SidebarListItemLink to={to} {...rest}>
                <SidebarListItemContent left={left}>{children}</SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemLink;
