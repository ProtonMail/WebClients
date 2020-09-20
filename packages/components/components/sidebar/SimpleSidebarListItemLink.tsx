import React from 'react';
import SidebarListItemContentIcon from './SidebarListItemContentIcon';
import SidebarListItem from './SidebarListItem';
import SidebarListItemContent from './SidebarListItemContent';
import SidebarListItemLink, { Props as SidebarListItemProps } from './SidebarListItemLink';

interface Props extends Pick<SidebarListItemProps, 'isActive'> {
    to: string;
    icon?: string;
    iconSize?: number;
    iconColor?: string;
    children: React.ReactNode;
}
const SimpleSidebarListItemLink = ({ to, children, icon, iconSize, iconColor, isActive }: Props) => {
    const left = icon ? <SidebarListItemContentIcon name={icon} size={iconSize} color={iconColor} /> : null;
    return (
        <SidebarListItem>
            <SidebarListItemLink to={to} isActive={isActive}>
                <SidebarListItemContent left={left}>{children}</SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemLink;
