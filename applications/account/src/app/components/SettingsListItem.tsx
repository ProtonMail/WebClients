import * as React from 'react';

import {
    IconName,
    NotificationDot,
    NotificationDotColor,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components';

interface Props {
    to: string;
    icon: IconName;
    notification?: NotificationDotColor;
    children: React.ReactNode;
}

const SettingsListItem = ({ to, icon, children, notification }: Props) => {
    return (
        <SidebarListItem>
            <SidebarListItemLink to={to}>
                <SidebarListItemContent
                    left={<SidebarListItemContentIcon name={icon} />}
                    right={notification && <NotificationDot color={notification} />}
                >
                    {children}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default SettingsListItem;
