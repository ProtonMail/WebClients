import React, { useEffect, useRef } from 'react';
import { useToggle, Sidebar, Info, TopBanners } from 'react-components';
import { Redirect, Route, Switch } from 'react-router';
import { c } from 'ttag';
import { Calendar, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import { Address } from 'proton-shared/lib/interfaces';

import PrivateHeader from '../../components/layout/PrivateHeader';
import GeneralPage from './SettingsGeneralPage';
import CalendarsPage from './SettingsCalendarPage';
import CalendarSidebarVersion from '../calendar/CalendarSidebarVersion';

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
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();

    useEffect(() => {
        setExpand(false);
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [window.location.pathname]);

    useEffect(() => {
        document.title = c('Page title').t`Calendar settings - ProtonCalendar`;
    }, []);

    const list = [
        { link: '/calendar/settings/general', icon: 'settings-master', text: c('Link').t`General` },
        { link: '/calendar/settings/calendars', icon: 'calendar', text: c('Link').t`Calendars` },
        {
            type: 'button',
            className: 'alignleft',
            icon: 'import',
            disabled: true,
            text: (
                <>
                    {c('Action').t`Import`}
                    <Info buttonClass="ml0-5 inline-flex" title={c('Info').t`Feature coming soon`} />
                </>
            ),
        },
    ];

    return (
        <div className="flex flex-column flex-nowrap no-scroll">
            <TopBanners />
            <div className="content flex-item-fluid-auto reset4print">
                <PrivateHeader
                    url="/calendar"
                    inSettings
                    title={c('Title').t`Settings`}
                    expanded={expanded}
                    onToggleExpand={onToggleExpand}
                    isNarrow={isNarrow}
                />
                <div className="flex flex-nowrap">
                    <Sidebar
                        url="/calendar"
                        list={list}
                        expanded={expanded}
                        onToggleExpand={onToggleExpand}
                        version={<CalendarSidebarVersion />}
                    />
                    <div className="main flex-item-fluid main-area main-area--paddingFix" ref={mainAreaRef}>
                        <Switch>
                            <Route
                                path="/calendar/settings/calendars"
                                render={() => {
                                    return (
                                        <CalendarsPage
                                            activeAddresses={activeAddresses}
                                            calendars={calendars}
                                            activeCalendars={activeCalendars}
                                            disabledCalendars={disabledCalendars}
                                            defaultCalendar={defaultCalendar}
                                        />
                                    );
                                }}
                            />
                            <Route
                                path="/calendar/settings/general"
                                render={() => {
                                    return <GeneralPage calendarUserSettings={calendarUserSettings} />;
                                }}
                            />
                            <Redirect to="/calendar/settings/general" />
                        </Switch>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsContainer;
