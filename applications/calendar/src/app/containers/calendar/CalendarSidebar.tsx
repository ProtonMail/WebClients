import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { APPS } from '@proton/shared/lib/constants';
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
    Icon,
    useModals,
    useGetCalendarUserSettings,
    useUser,
    Tooltip,
} from '@proton/components';
import { c } from 'ttag';
import { updateCalendar } from '@proton/shared/lib/api/calendars';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { partition } from '@proton/shared/lib/helpers/array';
import { CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import { getIsCalendarActive } from '@proton/shared/lib/calendar/calendar';
import getHasUserReachedCalendarLimit from '@proton/shared/lib/calendar/getHasUserReachedCalendarLimit';
import CalendarSidebarListItems from './CalendarSidebarListItems';
import CalendarSidebarVersion from './CalendarSidebarVersion';

interface Props {
    expanded?: boolean;
    onToggleExpand: () => void;
    logo?: ReactNode;
    calendars: Calendar[];
    miniCalendar: ReactNode;
    onCreateEvent?: () => void;
}

const CalendarSidebar = ({
    logo,
    expanded = false,
    onToggleExpand,
    calendars = [],
    miniCalendar,
    onCreateEvent,
}: Props) => {
    const { call } = useEventManager();
    const api = useApi();
    const [loadingAction, withLoadingAction] = useLoading();

    const { createModal } = useModals();

    const [user] = useUser();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const [personalCalendars, otherCalendars] = partition<Calendar>(calendars, getIsPersonalCalendar);

    const canAddPersonalCalendars = !getHasUserReachedCalendarLimit({
        calendarsLength: personalCalendars.length,
        isFreeUser: user.isFree,
        isSubscribedCalendar: false,
    });

    const handleChangeVisibility = async (calendarID: string, checked: boolean) => {
        await api(updateCalendar(calendarID, { Display: checked ? 1 : 0 }));
        await call();
    };

    const handleCreate = async () => {
        const calendarUserSettings = await getCalendarUserSettings();

        return createModal(
            <CalendarModal
                activeCalendars={personalCalendars.filter(getIsCalendarActive)}
                defaultCalendarID={calendarUserSettings.DefaultCalendarID}
            />
        );
    };

    const primaryAction = (
        <SidebarPrimaryButton
            data-test-id="calendar-view:new-event-button"
            disabled={!onCreateEvent}
            onClick={onCreateEvent}
            className="no-mobile"
        >{c('Action').t`New event`}</SidebarPrimaryButton>
    );

    const [displayPersonalCalendars, setDisplayPersonalCalendars] = useState(true);
    const [displayOtherCalendars, setDisplayOtherCalendars] = useState(true);

    const headerButton = (
        <Tooltip title={c('Info').t`Manage your calendars`}>
            <SidebarListItemHeaderLink
                toApp={APPS.PROTONACCOUNT}
                to="/calendar/calendars"
                target="_self"
                icon="settings"
                info={c('Link').t`Calendars`}
            />
        </Tooltip>
    );

    const personalCalendarsList = (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayPersonalCalendars}
                onToggle={() => setDisplayPersonalCalendars((prevState) => !prevState)}
                right={
                    <div className="flex flex-nowrap flex-align-items-center">
                        {canAddPersonalCalendars && (
                            <button
                                className="navigation-link-header-group-control flex cursor-pointer"
                                onClick={handleCreate}
                                type="button"
                            >
                                <Tooltip title={c('Add calendar icon tooltip').t`Create calendar`}>
                                    <Icon
                                        name="plus"
                                        className="navigation-icon"
                                        alt={c('Add calendar icon tooltip').t`Create calendar`}
                                    />
                                </Tooltip>
                            </button>
                        )}
                        {headerButton}
                    </div>
                }
                text={c('Link').t`My calendars`}
            />
            {displayPersonalCalendars && (
                <CalendarSidebarListItems
                    calendars={personalCalendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingAction(handleChangeVisibility(calendarID, value))
                    }
                    loading={loadingAction}
                />
            )}
        </SidebarList>
    );

    const otherCalendarsList = otherCalendars.length ? (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayOtherCalendars}
                onToggle={() => setDisplayOtherCalendars((prevState) => !prevState)}
                right={headerButton}
                text={c('Link').t`Other calendars`}
            />
            {displayOtherCalendars && (
                <CalendarSidebarListItems
                    calendars={otherCalendars}
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
                {personalCalendarsList}
                {otherCalendarsList}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
