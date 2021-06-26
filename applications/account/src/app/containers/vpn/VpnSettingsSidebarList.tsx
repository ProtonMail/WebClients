import React from 'react';
import { c } from 'ttag';
import { useRouteMatch } from 'react-router-dom';

import {
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

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
                <SidebarListItemContent>{APPS_CONFIGURATION[APPS.PROTONVPN_SETTINGS].name}</SidebarListItemContent>
            </SidebarListItem>
            <LocalListItem to={`${path}/vpn-apps`} icon="download">
                {c('Settings section title').t`VPN apps`}
            </LocalListItem>
            <LocalListItem to={`${path}/open-vpn-ike-v2`} icon="keys">
                OpenVPN/IKEv2
            </LocalListItem>
        </SidebarList>
    );
};

export default VpnSettingsSidebarList;
