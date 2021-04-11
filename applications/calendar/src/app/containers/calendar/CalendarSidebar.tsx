import { APPS } from 'proton-shared/lib/constants';
import React, { ReactNode, useState } from 'react';
import {
    useEventManager,
    useApi,
    useLoading,
    Sidebar,
    SidebarNav,
    SidebarPrimaryButton,
    SidebarList,
    SidebarListItemHeaderLink,
    SimpleSidebarListItemHeader,
} from 'react-components';
import { c } from 'ttag';
import { updateCalendar } from 'proton-shared/lib/api/calendars';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import CalendarSidebarListItems from './CalendarSidebarListItems';
import CalendarSidebarVersion from './CalendarSidebarVersion';

interface Props {
    expanded?: boolean;
    onToggleExpand: () => void;
    logo?: ReactNode;
    activeCalendars: Calendar[];
    disabledCalendars: Calendar[];
    miniCalendar: ReactNode;
    onCreateEvent?: () => void;
}

const CalendarSidebar = ({
    logo,
    expanded = false,
    onToggleExpand,
    activeCalendars = [],
    disabledCalendars = [],
    miniCalendar,
    onCreateEvent,
}: Props) => {
    const { call } = useEventManager();
    const api = useApi();
    const [loadingAction, withLoadingAction] = useLoading();

    const handleChangeVisibility = async (calendarID: string, checked: boolean) => {
        await api(updateCalendar(calendarID, { Display: checked ? 1 : 0 }));
        await call();
    };

    const primaryAction = (
        <SidebarPrimaryButton
            data-test-id="calendar-view:new-event-button"
            disabled={!onCreateEvent}
            onClick={onCreateEvent}
            className="no-mobile"
        >{c('Action').t`New event`}</SidebarPrimaryButton>
    );

    const [displayCalendars, setDisplayCalendars] = useState(true);
    const [displayDisabledCalendars, setDisplayDisabledCalendars] = useState(true);

    const headerButton = (
        <SidebarListItemHeaderLink
            toApp={APPS.PROTONACCOUNT}
            to="/calendar/calendars"
            target="_self"
            title={c('Info').t`Manage your calendars`}
            icon="settings-singular"
            info={c('Link').t`Calendars`}
        />
    );

    const calendarsList = (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayCalendars}
                onToggle={() => setDisplayCalendars(!displayCalendars)}
                right={headerButton}
                text={c('Link').t`Calendars`}
            />
            {displayCalendars && (
                <CalendarSidebarListItems
                    calendars={activeCalendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingAction(handleChangeVisibility(calendarID, value))
                    }
                    loading={loadingAction}
                />
            )}
        </SidebarList>
    );

    const disabledCalendarsList = disabledCalendars.length ? (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayDisabledCalendars}
                onToggle={() => setDisplayDisabledCalendars(!displayDisabledCalendars)}
                right={headerButton}
                text={c('Header').t`Disabled calendars`}
            />
            {displayDisabledCalendars && (
                <CalendarSidebarListItems
                    calendars={disabledCalendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingAction(handleChangeVisibility(calendarID, value))
                    }
                    loading={loadingAction}
                />
            )}
        </SidebarList>
    ) : null;

    return (
        <Sidebar
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={primaryAction}
            version={<CalendarSidebarVersion />}
        >
            <SidebarNav data-test-id="calendar-sidebar:calendars-list-area">
                <div className="flex-item-noshrink">{miniCalendar}</div>
                {calendarsList}
                {disabledCalendarsList}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
