import React, { useEffect, useRef } from 'react';
import {
    useToggle,
    useActiveBreakpoint,
    useCalendarUserSettings,
    AppsSidebar,
    Sidebar,
    StorageSpaceStatus,
    Href
} from 'react-components';
import { Redirect, Route, Switch } from 'react-router';
import { c } from 'ttag';

import PrivateHeader from '../../components/layout/PrivateHeader';
import GeneralPage from './SettingsGeneralPage';
import CalendarsPage from './SettingsCalendarPage';
import PropTypes from 'prop-types';
import CalendarSidebarVersion from '../calendar/CalendarSidebarVersion';

const SettingsContainer = ({ calendars = [] }) => {
    const mainAreaRef = useRef();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { isNarrow } = useActiveBreakpoint();
    const [calendarUserSettings = {}, loading] = useCalendarUserSettings();

    useEffect(() => {
        setExpand(false);
        mainAreaRef.current.scrollTop = 0;
    }, [location.pathname]);

    useEffect(() => {
        document.title = c('Page title').t`Calendar settings - ProtonCalendar`;
    }, []);

    const list = [
        { link: '/calendar/settings/general', icon: 'settings-master', text: c('Link').t`General` },
        { link: '/calendar/settings/calendars', icon: 'calendar', text: c('Link').t`Calendars` }
    ];

    const mobileLinks = [
        { to: '/inbox', icon: 'protonmail', external: true, current: false },
        { to: '/contacts', icon: 'protoncontacts', external: true, current: false },
        { to: '/calendar', icon: 'protoncalendar', external: false, current: true }
    ].filter(Boolean);

    return (
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar
                items={[
                    <StorageSpaceStatus
                        key="storage"
                        upgradeButton={
                            <Href url="/settings/subscription" target="_self" className="pm-button pm-button--primary">
                                {c('Action').t`Upgrade`}
                            </Href>
                        }
                    />
                ]}
            />
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader
                    url="/calendar"
                    inSettings={true}
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
                        mobileLinks={mobileLinks}
                        version={<CalendarSidebarVersion />}
                    />
                    <div className="main flex-item-fluid main-area main-area--paddingFix" ref={mainAreaRef}>
                        <Switch>
                            <Route
                                path="/calendar/settings/calendars"
                                render={() => {
                                    return (
                                        <CalendarsPage
                                            calendars={calendars}
                                            calendarUserSettings={calendarUserSettings}
                                            loading={loading}
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

SettingsContainer.propTypes = {
    calendars: PropTypes.array
};

export default SettingsContainer;
