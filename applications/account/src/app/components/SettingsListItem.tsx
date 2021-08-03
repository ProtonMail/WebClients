import * as React from 'react';

import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components';

const SettingsListItem = ({ to, icon, children }: { to: string; icon: string; children: React.ReactNode }) => (
    <SidebarListItem>
        <SidebarListItemLink to={to}>
            <SidebarListItemContent left={<SidebarListItemContentIcon name={icon} />}>
                {children}
            </SidebarListItemContent>
        </SidebarListItemLink>
    </SidebarListItem>
);

export default SettingsListItem;
