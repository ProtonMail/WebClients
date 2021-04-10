import React from 'react';
import { useRouteMatch } from 'react-router-dom';

import {
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from 'react-components';

const LocalListItem = ({ to, icon, children }: { to: string; icon: string; children: React.ReactNode }) => (
    <SidebarListItem>
        <SidebarListItemLink to={to}>
            <SidebarListItemContent left={<SidebarListItemContentIcon name={icon} />}>
                {children}
            </SidebarListItemContent>
        </SidebarListItemLink>
    </SidebarListItem>
);

const VpnSettingsSidebarList = () => {
    const { path } = useRouteMatch();

    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                <SidebarListItemContent>PROTONVPN</SidebarListItemContent>
            </SidebarListItem>
            <LocalListItem to={`${path}/downloads`} icon="download">
                Downloads
            </LocalListItem>
            <LocalListItem to={`${path}/OpenVPNIKEv2`} icon="keys">
                OpenVPN/IKEv2
            </LocalListItem>
        </SidebarList>
    );
};

export default VpnSettingsSidebarList;
