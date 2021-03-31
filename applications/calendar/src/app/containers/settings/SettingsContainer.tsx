import React, { MutableRefObject, useEffect, useState } from 'react';
import {
    useToggle,
    Sidebar,
    PrivateAppContainer,
    SidebarNav,
    SidebarList,
    SidebarListItemsWithSubsections,
    PrivateHeader,
    SidebarBackButton,
    MainLogo,
    useEarlyAccess,
} from 'react-components';
import { useLocation, Redirect, Route, Switch } from 'react-router-dom';
import { c } from 'ttag';
import { Calendar, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import { Address, UserModel } from 'proton-shared/lib/interfaces';

import OverviewPage, { getOverviewSettingsPage } from './SettingsOverviewPage';
import GeneralPage, { getGeneralSettingsPage } from './SettingsGeneralPage';
import CalendarsPage, { getCalendarSettingsPage } from './SettingsCalendarPage';
import CalendarSidebarVersion from '../calendar/CalendarSidebarVersion';

import { CalendarsEventsCache } from '../calendar/eventStore/interface';

interface Props {
    isNarrow: boolean;
    activeAddresses: Address[];
    calendars: Calendar[];
    activeCalendars: Calendar[];
    disabledCalendars: Calendar[];
    defaultCalendar?: Calendar;
    calendarUserSettings: CalendarUserSettings;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    user: UserModel;
}

const SettingsContainer = ({
    isNarrow,
    activeAddresses,
    calendars,
    disabledCalendars,
    defaultCalendar,
    activeCalendars,
    calendarUserSettings,
    calendarsEventsCacheRef,
    user,
}: Props) => {
    const location = useLocation();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');
    const { hasEarlyAccess } = useEarlyAccess();

    useEffect(() => {
        setExpand(false);
    }, [location.pathname]);

    const logo = <MainLogo to="/" />;

    const header = (
        <PrivateHeader
            logo={logo}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
        />
    );

    const sidebar = (
        <Sidebar
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={<SidebarBackButton to="/">{c('Action').t`Back to Calendar`}</SidebarBackButton>}
            version={<CalendarSidebarVersion />}
        >
            <SidebarNav>
                <SidebarList>
                    <SidebarListItemsWithSubsections
                        list={[
                            getOverviewSettingsPage(),
                            getGeneralSettingsPage({ hasEarlyAccess }),
                            getCalendarSettingsPage(),
                        ]}
                        pathname={location.pathname}
                        activeSection={activeSection}
                    />
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            <Switch>
                <Route path="/settings/overview">
                    <OverviewPage />
                </Route>
                <Route path="/settings/calendars">
                    <CalendarsPage
                        activeAddresses={activeAddresses}
                        calendars={calendars}
                        activeCalendars={activeCalendars}
                        disabledCalendars={disabledCalendars}
                        defaultCalendar={defaultCalendar}
                        location={location}
                        setActiveSection={setActiveSection}
                        calendarsEventsCacheRef={calendarsEventsCacheRef}
                        user={user}
                    />
                </Route>
                <Route path="/settings/general">
                    <GeneralPage
                        calendarUserSettings={calendarUserSettings}
                        location={location}
                        setActiveSection={setActiveSection}
                    />
                </Route>
                <Redirect to="/settings/overview" />
            </Switch>
        </PrivateAppContainer>
    );
};

export default SettingsContainer;
