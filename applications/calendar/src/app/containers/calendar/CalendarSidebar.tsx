import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
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
    useUser,
    Tooltip,
    SimpleDropdown,
    DropdownMenu,
    DropdownMenuButton,
    useNotifications,
    useCalendarSubscribeFeature,
    useModalState,
} from '@proton/components';
import { c } from 'ttag';
import { updateMember } from '@proton/shared/lib/api/calendars';
import { CalendarUserSettings, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import partition from '@proton/utils/partition';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import SubscribeCalendarModal from '@proton/components/containers/calendar/subscribeCalendarModal/SubscribeCalendarModal';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import { getIsCalendarActive } from '@proton/shared/lib/calendar/calendar';
import getHasUserReachedCalendarLimit from '@proton/shared/lib/calendar/getHasUserReachedCalendarLimit';
import { Address, Nullable } from '@proton/shared/lib/interfaces';
import CalendarSidebarListItems from './CalendarSidebarListItems';
import CalendarSidebarVersion from './CalendarSidebarVersion';

export interface CalendarSidebarProps {
    addresses: Address[];
    calendars: VisualCalendar[];
    calendarUserSettings: CalendarUserSettings;
    expanded?: boolean;
    logo?: ReactNode;
    miniCalendar: ReactNode;
    onToggleExpand: () => void;
    onCreateEvent?: () => void;
    onCreateCalendar?: (id: string) => void;
}

const CalendarSidebar = ({
    addresses,
    calendars,
    calendarUserSettings,
    logo,
    expanded = false,
    onToggleExpand,
    miniCalendar,
    onCreateEvent,
    onCreateCalendar,
}: CalendarSidebarProps) => {
    const { call } = useEventManager();
    const api = useApi();
    const [user] = useUser();
    const { enabled, unavailable } = useCalendarSubscribeFeature();

    const [loadingAction, withLoadingAction] = useLoading();
    const { createNotification } = useNotifications();

    const [{ onClose, open, ...modalProps }, setOpen] = useModalState();

    const [isSubscribeCalendarModalOpen, setIsSubscribeCalendarModalOpen] = useState(false);
    const [isLimitReachedModalCopy, setIsLimitReachedModalCopy] = useState<Nullable<string>>(null);

    const [personalCalendars, otherCalendars] = useMemo(
        () => partition<VisualCalendar>(calendars, getIsPersonalCalendar),
        [calendars]
    );

    const { subscribedCalendars, loading: loadingSubscribedCalendars } = useSubscribedCalendars(
        otherCalendars,
        addresses
    );

    const canAddPersonalCalendars = !getHasUserReachedCalendarLimit({
        calendarsLength: personalCalendars.length,
        isFreeUser: !user.hasPaidMail,
        isSubscribedCalendar: false,
    });
    const canAddSubscribedCalendars = !getHasUserReachedCalendarLimit({
        calendarsLength: otherCalendars.length,
        isFreeUser: !user.hasPaidMail,
        isSubscribedCalendar: true,
    });

    const addCalendarText = c('Dropdown action icon tooltip').t`Add calendar`;

    const handleChangeVisibility = async (calendarID: string, checked: boolean) => {
        const members = calendars.find(({ ID }) => ID === calendarID)?.Members || [];
        const [{ ID: memberID }] = getMemberAndAddress(addresses, members);
        await api(updateMember(calendarID, memberID, { Display: checked ? 1 : 0 }));
        await call();
    };

    const handleCreatePersonalCalendar = async () => {
        if (canAddPersonalCalendars) {
            setOpen(true);
        } else {
            setIsLimitReachedModalCopy(
                c('Personal calendar limit reached modal body')
                    .t`Unable to create more calendars. You have reached the maximum of personal calendars within your plan.`
            );
        }
    };

    const handleCreateSubscribedCalendar = () => {
        if (canAddSubscribedCalendars) {
            setIsSubscribeCalendarModalOpen(true);
        } else {
            setIsLimitReachedModalCopy(
                c('Subscribed calendar limit reached modal body')
                    .t`Unable to add more calendars. You have reached the maximum of subscribed calendars within your plan.`
            );
        }
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
                icon="cog-wheel"
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
                            <Tooltip title={addCalendarText}>
                                <SimpleDropdown
                                    as="button"
                                    type="button"
                                    hasCaret={false}
                                    className="navigation-link-header-group-control flex"
                                    content={<Icon name="plus" className="navigation-icon" alt={addCalendarText} />}
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
                            </Tooltip>
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
            <CalendarModal
                open={open}
                onClose={onClose}
                activeCalendars={personalCalendars.filter(getIsCalendarActive)}
                defaultCalendarID={calendarUserSettings.DefaultCalendarID}
                onCreateCalendar={onCreateCalendar}
                {...modalProps}
            />

            <SubscribeCalendarModal
                isOpen={isSubscribeCalendarModalOpen}
                onClose={() => setIsSubscribeCalendarModalOpen(false)}
                onCreateCalendar={onCreateCalendar}
            />

            <CalendarLimitReachedModal
                isOpen={!!isLimitReachedModalCopy}
                onClose={() => setIsLimitReachedModalCopy(null)}
            >
                {isLimitReachedModalCopy}
            </CalendarLimitReachedModal>

            <SidebarNav data-test-id="calendar-sidebar:calendars-list-area">
                <div className="flex-item-noshrink">{miniCalendar}</div>
                {personalCalendarsList}
                {subscribedCalendarsList}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
