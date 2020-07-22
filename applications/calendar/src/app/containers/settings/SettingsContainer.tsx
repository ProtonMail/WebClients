import React, { MutableRefObject, useEffect, useState } from 'react';
import * as H from 'history';
import {
    useToggle,
    Sidebar,
    Info,
    PrivateAppContainer,
    useModals,
    SidebarNav,
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemButton,
    SidebarListItemContentIcon,
    SidebarListItemsWithSubsections,
    PrivateHeader,
    SidebarBackButton,
} from 'react-components';
import { Redirect, Route, Switch } from 'react-router';
import { c } from 'ttag';
import { Calendar, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import { Address } from 'proton-shared/lib/interfaces';

import GeneralPage, { getGeneralSettingsPage } from './SettingsGeneralPage';
import CalendarsPage, { getCalendarSettingsPage } from './SettingsCalendarPage';
import CalendarSidebarVersion from '../calendar/CalendarSidebarVersion';
import ImportModal from '../../components/import/ImportModal';
import { CalendarsEventsCache } from '../calendar/eventStore/interface';

const getDisabledCalendarContent = () => {
    return (
        <>
            {c('Action').t`Import`}
            <Info
                buttonClass="ml0-5 inline-flex"
                title={c('Disabled import').t`You need to have an active calendar before importing your events.`}
            />
        </>
    );
};

interface Props {
    history: H.History;
    isNarrow: boolean;
    activeAddresses: Address[];
    calendars: Calendar[];
    activeCalendars: Calendar[];
    disabledCalendars: Calendar[];
    defaultCalendar?: Calendar;
    calendarUserSettings: CalendarUserSettings;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
}

const SettingsContainer = ({
    history,
    isNarrow,
    activeAddresses,
    calendars,
    disabledCalendars,
    defaultCalendar,
    activeCalendars,
    calendarUserSettings,
    calendarsEventsCacheRef,
}: Props) => {
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');

    const { createModal } = useModals();
    const hasActiveCalendars = !!activeCalendars.length;

    useEffect(() => {
        setExpand(false);
    }, [window.location.pathname]);

    const canImport = hasActiveCalendars && defaultCalendar;

    const handleImport =
        canImport && defaultCalendar
            ? () => {
                  createModal(
                      <ImportModal
                          defaultCalendar={defaultCalendar}
                          calendars={activeCalendars}
                          calendarsEventsCacheRef={calendarsEventsCacheRef}
                      />
                  );
              }
            : undefined;

    const base = '/calendar';
    const goBack = () => history.push(base);

    const header = (
        <PrivateHeader
            url={base}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
        />
    );

    const sidebar = (
        <Sidebar
            url={base}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={<SidebarBackButton onClick={goBack}>{c('Action').t`Back to Calendar`}</SidebarBackButton>}
            version={<CalendarSidebarVersion />}
        >
            <SidebarNav>
                <SidebarList>
                    <SidebarListItemsWithSubsections
                        list={[getGeneralSettingsPage(), getCalendarSettingsPage()]}
                        pathname={window.location.pathname}
                        activeSection={activeSection}
                    />
                    <SidebarListItem>
                        <SidebarListItemButton onClick={handleImport}>
                            <SidebarListItemContent left={<SidebarListItemContentIcon name="import" />}>
                                {canImport ? c('Action').t`Import` : getDisabledCalendarContent()}
                            </SidebarListItemContent>
                        </SidebarListItemButton>
                    </SidebarListItem>
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            <Switch>
                <Route
                    path="/calendar/settings/calendars"
                    render={({ location }) => {
                        return (
                            <CalendarsPage
                                activeAddresses={activeAddresses}
                                calendars={calendars}
                                activeCalendars={activeCalendars}
                                disabledCalendars={disabledCalendars}
                                defaultCalendar={defaultCalendar}
                                location={location}
                                setActiveSection={setActiveSection}
                            />
                        );
                    }}
                />
                <Route
                    path="/calendar/settings/general"
                    render={({ location }) => {
                        return (
                            <GeneralPage
                                calendarUserSettings={calendarUserSettings}
                                location={location}
                                setActiveSection={setActiveSection}
                            />
                        );
                    }}
                />
                <Redirect to="/calendar/settings/general" />
            </Switch>
        </PrivateAppContainer>
    );
};

export default SettingsContainer;
