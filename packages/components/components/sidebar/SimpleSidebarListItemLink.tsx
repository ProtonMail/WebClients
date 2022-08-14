import { ReactNode } from 'react';

import { IconName, IconSize } from '../icon/Icon';
import SidebarListItem from './SidebarListItem';
import SidebarListItemContent from './SidebarListItemContent';
import SidebarListItemContentIcon from './SidebarListItemContentIcon';
import SidebarListItemLink, { Props as SidebarListItemProps } from './SidebarListItemLink';

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
