import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { APPS } from '@proton/shared/lib/constants';
import React, { ReactNode, useMemo, useState } from 'react';
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
    SimpleDropdown,
    DropdownMenu,
    DropdownMenuButton,
    useNotifications,
    useCalendarSubscribeFeature,
} from '@proton/components';
import { c, msgid } from 'ttag';
import { updateCalendar } from '@proton/shared/lib/api/calendars';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import { partition } from '@proton/shared/lib/helpers/array';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import SubscribeCalendarModal from '@proton/components/containers/calendar/subscribeCalendarModal/SubscribeCalendarModal';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import { getIsCalendarActive } from '@proton/shared/lib/calendar/calendar';
import getHasUserReachedCalendarLimit from '@proton/shared/lib/calendar/getHasUserReachedCalendarLimit';
import {
    MAX_CALENDARS_PER_FREE_USER,
    MAX_CALENDARS_PER_USER,
    MAX_SUBSCRIBED_CALENDARS_PER_USER,
} from '@proton/shared/lib/calendar/constants';
import CalendarSidebarListItems from './CalendarSidebarListItems';
import CalendarSidebarVersion from './CalendarSidebarVersion';

export interface CalendarSidebarProps {
    expanded?: boolean;
    onToggleExpand: () => void;
    logo?: ReactNode;
    calendars: Calendar[];
    miniCalendar: ReactNode;
    onCreateEvent?: () => void;
    onCreateCalendar?: (id: string) => void;
}

const CalendarSidebar = ({
    logo,
    expanded = false,
    onToggleExpand,
    calendars = [],
    miniCalendar,
    onCreateEvent,
    onCreateCalendar,
}: CalendarSidebarProps) => {
    const { call } = useEventManager();
    const { createModal } = useModals();
    const api = useApi();
    const [user] = useUser();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const [loadingAction, withLoadingAction] = useLoading();
    const { enabled, unavailable } = useCalendarSubscribeFeature();

    const { createNotification } = useNotifications();

    const [personalCalendars, otherCalendars] = useMemo(
        () => partition<Calendar>(calendars, getIsPersonalCalendar),
        [calendars]
    );

    const { subscribedCalendars, loading: loadingSubscribedCalendars } = useSubscribedCalendars(otherCalendars);

    const canAddPersonalCalendars = !getHasUserReachedCalendarLimit({
        calendarsLength: personalCalendars.length,
        isFreeUser: user.isFree,
        isSubscribedCalendar: false,
    });
    const canAddSubscribedCalendars = !getHasUserReachedCalendarLimit({
        calendarsLength: otherCalendars.length,
        isFreeUser: user.isFree,
        isSubscribedCalendar: true,
    });

    const addCalendarText = c('Dropwdown action icon tooltip').t`Add calendar`;

    const handleChangeVisibility = async (calendarID: string, checked: boolean) => {
        await api(updateCalendar(calendarID, { Display: checked ? 1 : 0 }));
        await call();
    };

    const handleCreatePersonalCalendar = async () => {
        const calendarUserSettings = await getCalendarUserSettings();
        const personalCalendarLimit = user.isFree ? MAX_CALENDARS_PER_FREE_USER : MAX_CALENDARS_PER_USER;

        return canAddPersonalCalendars
            ? createModal(
                  <CalendarModal
                      activeCalendars={personalCalendars.filter(getIsCalendarActive)}
                      defaultCalendarID={calendarUserSettings.DefaultCalendarID}
                      onCreateCalendar={onCreateCalendar}
                  />
              )
            : createModal(
                  <CalendarLimitReachedModal>
                      {c('Subscribed calendar limit reached modal body').ngettext(
                          msgid`You have reached the maximum of ${personalCalendarLimit} personal calendar.`,
                          `You have reached the maximum of ${personalCalendarLimit} personal calendars.`,
                          personalCalendarLimit
                      )}
                  </CalendarLimitReachedModal>
              );
    };

    const handleCreateSubscribedCalendar = () =>
        canAddSubscribedCalendars
            ? createModal(<SubscribeCalendarModal onCreateCalendar={onCreateCalendar} />)
            : createModal(
                  <CalendarLimitReachedModal>
                      {c('Subscribed calendar limit reached modal body').ngettext(
                          msgid`You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS_PER_USER} subscribed calendar.`,
                          `You have reached the maximum of ${MAX_SUBSCRIBED_CALENDARS_PER_USER} subscribed calendars.`,
                          MAX_SUBSCRIBED_CALENDARS_PER_USER
                      )}
                  </CalendarLimitReachedModal>
              );

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
                icon="gear"
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
                        {enabled ? (
                            <SimpleDropdown
                                as="button"
                                type="button"
                                hasCaret={false}
                                content={
                                    <div className="navigation-link-header-group-control flex cursor-pointer">
                                        <Tooltip title={addCalendarText}>
                                            <Icon name="plus" className="navigation-icon" alt={addCalendarText} />
                                        </Tooltip>
                                    </div>
                                }
                            >
                                <DropdownMenu>
                                    <DropdownMenuButton
                                        className="text-left"
                                        onClick={() => handleCreatePersonalCalendar()}
                                    >
                                        {c('Action').t`Create calendar`}
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="text-left"
                                        onClick={() =>
                                            unavailable
                                                ? createNotification({
                                                      type: 'error',
                                                      text: c('Subscribed calendar feature unavailable error')
                                                          .t`Subscribing to a calendar is unavailable at the moment`,
                                                  })
                                                : handleCreateSubscribedCalendar()
                                        }
                                    >
                                        {c('Calendar sidebar dropdown item').t`Add calendar from URL`}
                                    </DropdownMenuButton>
                                </DropdownMenu>
                            </SimpleDropdown>
                        ) : (
                            <div className="navigation-link-header-group-control flex cursor-pointer">
                                <Tooltip title={addCalendarText}>
                                    <Icon
                                        onClick={() => handleCreatePersonalCalendar()}
                                        name="plus"
                                        className="navigation-icon"
                                        alt={addCalendarText}
                                    />
                                </Tooltip>
                            </div>
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

    const subscribedCalendarsList = otherCalendars.length ? (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayOtherCalendars}
                onToggle={() => setDisplayOtherCalendars((prevState) => !prevState)}
                text={c('Link').t`Subscribed calendars`}
            />
            {displayOtherCalendars && (
                <CalendarSidebarListItems
                    actionsDisabled={loadingSubscribedCalendars}
                    calendars={loadingSubscribedCalendars ? otherCalendars : subscribedCalendars}
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
                {subscribedCalendarsList}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
