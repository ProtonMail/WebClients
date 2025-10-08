import type { ReactNode } from 'react';

import type { IconName, IconSize } from '@proton/icons/types';

import SidebarListItem from './SidebarListItem';
import SidebarListItemContent from './SidebarListItemContent';
import SidebarListItemContentIcon from './SidebarListItemContentIcon';
import type { Props as SidebarListItemProps } from './SidebarListItemLink';
import SidebarListItemLink from './SidebarListItemLink';

interface Props extends SidebarListItemProps {
    to: string;
    icon?: IconName;
    iconSize?: IconSize;
    iconColor?: string;
    children: ReactNode;
}

const SimpleSidebarListItemLink = ({ to, children, icon, iconSize, iconColor, ...rest }: Props) => {
    const left = icon ? <SidebarListItemContentIcon name={icon} size={iconSize} color={iconColor} /> : null;
    return (
        <SidebarListItem>
            <SidebarListItemLink to={to} {...rest}>
                <SidebarListItemContent left={left}>{children}</SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemLink;
