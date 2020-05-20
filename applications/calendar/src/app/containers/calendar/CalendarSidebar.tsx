import React, { ReactNode } from 'react';
import {
    MainLogo,
    Hamburger,
    NavMenu,
    PrimaryButton,
    useEventManager,
    useApi,
    useLoading,
    Info,
    MobileAppsLinks,
} from 'react-components';
import { c } from 'ttag';
import { updateCalendar } from 'proton-shared/lib/api/calendars';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import CalendarSidebarList from './CalendarSidebarList';
import CalendarSidebarVersion from './CalendarSidebarVersion';

interface Props {
    expanded?: boolean;
    onToggleExpand: () => void;
    url?: string;
    activeCalendars: Calendar[];
    disabledCalendars: Calendar[];
    miniCalendar: ReactNode;
    onCreateEvent?: () => void;
}

const CalendarSidebar = ({
    expanded = false,
    onToggleExpand,
    url = '',
    activeCalendars = [],
    disabledCalendars = [],
    miniCalendar,
    onCreateEvent,
}: Props) => {
    const { call } = useEventManager();
    const api = useApi();
    const [loadingAction, withLoadingAction] = useLoading();

    const handleChangeVisibility = async (calendarID: string, checked: boolean) => {
        await api(updateCalendar(calendarID, { Display: +checked }));
        await call();
    };

    return (
        <div className="sidebar flex flex-nowrap flex-column noprint" data-expanded={expanded}>
            <div className="nodesktop notablet flex-item-noshrink">
                <div className="flex flex-spacebetween flex-items-center">
                    <MainLogo url={url} />
                    <Hamburger expanded={expanded} onToggle={onToggleExpand} />
                </div>
            </div>
            <div className="nomobile pl1 pr1 pb1 flex-item-noshrink">
                <PrimaryButton
                    data-test-id="calendar-view:new-event-button"
                    className="pm-button--large bold mt0-25 w100"
                    disabled={!onCreateEvent}
                    onClick={onCreateEvent}
                >{c('Action').t`New event`}</PrimaryButton>
            </div>
            <div className="flex-item-fluid flex-nowrap flex flex-column scroll-if-needed customScrollBar-container pb1">
                <div className="flex-item-noshrink">{miniCalendar}</div>
                <nav
                    data-test-id="calendar-sidebar:calendars-list-area"
                    className="navigation mw100 flex-item-fluid-auto"
                >
                    <NavMenu
                        list={[
                            {
                                icon: 'general',
                                text: c('Header').t`Calendars`,
                                link: '/calendar/settings/calendars',
                            },
                        ]}
                        className="mb0"
                    />
                    <CalendarSidebarList
                        calendars={activeCalendars}
                        onChangeVisibility={(calendarID, value) =>
                            withLoadingAction(handleChangeVisibility(calendarID, value))
                        }
                        loading={loadingAction}
                    />
                    {disabledCalendars.length ? (
                        <>
                            <NavMenu
                                list={[
                                    {
                                        text: (
                                            <>
                                                {c('Header').t`Disabled calendars`}
                                                <Info
                                                    buttonClass="ml0-5 inline-flex"
                                                    title={c('Disabled calendars')
                                                        .t`Disabled calendars are linked to disabled email addresses. You can still access your disabled calendar, view its events and delete them.`}
                                                />
                                            </>
                                        ),
                                        link: '/calendar/settings/calendars',
                                    },
                                ]}
                                className="mb0"
                            />
                            <CalendarSidebarList
                                calendars={disabledCalendars}
                                onChangeVisibility={(calendarID, value) =>
                                    withLoadingAction(handleChangeVisibility(calendarID, value))
                                }
                                loading={loadingAction}
                            />
                        </>
                    ) : null}
                </nav>
            </div>
            <CalendarSidebarVersion />
            <MobileAppsLinks />
        </div>
    );
};

export default CalendarSidebar;
