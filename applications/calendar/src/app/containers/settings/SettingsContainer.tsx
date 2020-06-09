import React, { useEffect, useState } from 'react';
import { useToggle, Sidebar, Info, getSectionConfigProps, PrivateAppContainer, useModals } from 'react-components';
import { Redirect, Route, Switch } from 'react-router';
import { c } from 'ttag';
import { Calendar, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import { Address } from 'proton-shared/lib/interfaces';

import PrivateHeader from '../../components/layout/PrivateHeader';
import GeneralPage, { getGeneralSettingsPage } from './SettingsGeneralPage';
import CalendarsPage, { getCalendarSettingsPage } from './SettingsCalendarPage';
import CalendarSidebarVersion from '../calendar/CalendarSidebarVersion';
import ImportModal from '../../components/import/ImportModal';

interface Props {
    isNarrow: boolean;
    activeAddresses: Address[];
    calendars: Calendar[];
    activeCalendars: Calendar[];
    disabledCalendars: Calendar[];
    defaultCalendar?: Calendar;
    calendarUserSettings: CalendarUserSettings;
}

const SettingsContainer = ({
    isNarrow,
    activeAddresses,
    calendars,
    disabledCalendars,
    defaultCalendar,
    activeCalendars,
    calendarUserSettings,
}: Props) => {
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');

    const { createModal } = useModals();
    const hasActiveCalendars = !!activeCalendars.length;

    useEffect(() => {
        setExpand(false);
    }, [window.location.pathname]);

    const list = [
        ...getSectionConfigProps(
            [getGeneralSettingsPage(), getCalendarSettingsPage()],
            window.location.pathname,
            activeSection
        ),
        hasActiveCalendars && defaultCalendar
            ? {
                type: 'button',
                className: 'alignleft',
                icon: 'import',
                onClick() {
                    createModal(<ImportModal defaultCalendar={defaultCalendar} calendars={activeCalendars} />);
                },
                text: c('Action').t`Import`,
            }
            : {
                type: 'button',
                className: 'alignleft',
                icon: 'import',
                text: (
                    <>
                        {c('Action').t`Import`}
                        <Info
                            buttonClass="ml0-5 inline-flex"
                            title={c('Disabled import')
                                .t`You need to have an active calendar before importing your events.`}
                        />
                    </>
                ),
            },
    ];

    const header = (
        <PrivateHeader
            url="/calendar"
            inSettings
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
        />
    );

    const sidebar = (
        <Sidebar
            url="/calendar"
            list={list}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            version={<CalendarSidebarVersion />}
        />
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
