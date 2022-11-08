import { SettingsListItem, SidebarList, SidebarListItem } from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import CalendarsSettingsSidebarList from './CalendarsSettingsSidebarList';
import { getCalendarAppRoutes } from './routes';

interface Props extends ReturnType<typeof getCalendarAppRoutes> {
    prefix: string;
}

const CalendarSettingsSidebar = ({ header, routes, prefix }: Props) => {
    return (
        <SidebarList>
            <SidebarListItem className="text-uppercase text-sm navigation-link-header-group">
                <h3>{header}</h3>
            </SidebarListItem>
            {getIsSectionAvailable(routes.general) && (
                <SettingsListItem
                    to={getSectionPath(prefix, routes.general)}
                    icon={routes.general.icon}
                    notification={routes.general.notification}
                    key={routes.general.to}
                >
                    <span className="text-ellipsis" title={routes.general.text}>
                        {routes.general.text}
                    </span>
                </SettingsListItem>
            )}
            {getIsSectionAvailable(routes.calendars) && (
                <CalendarsSettingsSidebarList prefix={prefix} calendarsSection={routes.calendars} />
            )}
            {getIsSectionAvailable(routes.interops) && (
                <SettingsListItem
                    to={getSectionPath(prefix, routes.interops)}
                    icon={routes.interops.icon}
                    notification={routes.interops.notification}
                    key={routes.interops.to}
                >
                    <span className="text-ellipsis" title={routes.interops.text}>
                        {routes.interops.text}
                    </span>
                </SettingsListItem>
            )}
        </SidebarList>
    );
};

export default CalendarSettingsSidebar;
