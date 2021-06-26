import React from 'react';
import { useRouteMatch } from 'react-router-dom';

import {
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components';
import { c } from 'ttag';
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

const CalendarSettingsSidebarList = () => {
    const { path } = useRouteMatch();

    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                <SidebarListItemContent>{APPS_CONFIGURATION[APPS.PROTONCALENDAR].name}</SidebarListItemContent>
            </SidebarListItem>
            <LocalListItem to={`${path}/general`} icon="apps">
                {c('Settings section title').t`General`}
            </LocalListItem>
            <LocalListItem to={`${path}/calendars`} icon="calendar">
                {c('Settings section title').t`Calendars`}
            </LocalListItem>
        </SidebarList>
    );
};

export default CalendarSettingsSidebarList;
