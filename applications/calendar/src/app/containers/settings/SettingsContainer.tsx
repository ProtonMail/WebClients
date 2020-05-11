import React, { useEffect, useRef } from 'react';
import { useToggle, useModals, AppsSidebar, Sidebar, StorageSpaceStatus, Href, Info } from 'react-components';
import { Redirect, Route, Switch } from 'react-router';
import { c } from 'ttag';
import { Calendar, CalendarUserSettings } from 'proton-shared/lib/interfaces/calendar';
import { Address } from 'proton-shared/lib/interfaces';

import PrivateHeader from '../../components/layout/PrivateHeader';
import GeneralPage from './SettingsGeneralPage';
import CalendarsPage from './SettingsCalendarPage';
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
    calendarUserSettings
}: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { createModal } = useModals();

    const hasActiveCalendars = !!activeCalendars.length;

    useEffect(() => {
        setExpand(false);
        if (mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    useEffect(() => {
        document.title = c('Page title').t`Calendar settings - ProtonCalendar`;
    }, []);

    const list = [
        { link: '/calendar/settings/general', icon: 'settings-master', text: c('Link').t`General` },
        { link: '/calendar/settings/calendars', icon: 'calendar', text: c('Link').t`Calendars` },
        hasActiveCalendars && defaultCalendar
            ? {
                  type: 'button',
                  className: 'alignleft',
                  icon: 'import',
                  onClick() {
                      createModal(
                          <ImportModal
                              defaultCalendar={defaultCalendar}
                              calendars={activeCalendars}
                              calendarUserSettings={calendarUserSettings}
                          />
                      );
                  },
                  text: c('Action').t`Import`
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
                  )
              }
    ];

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
