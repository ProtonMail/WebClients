import React, { ReactNode, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AppsDropdown,
    DropdownMenu,
    DropdownMenuButton,
    FeatureCode,
    Icon,
    Sidebar,
    SidebarList,
    SidebarListItemHeaderLink,
    SidebarNav,
    SidebarPrimaryButton,
    SimpleDropdown,
    SimpleSidebarListItemHeader,
    Spotlight,
    Tooltip,
    useApi,
    useEventManager,
    useFeature,
    useModalState,
    useSpotlightOnFeature,
    useSpotlightShow,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import { CalendarModal } from '@proton/components/containers/calendar/calendarModal/CalendarModal';
import HolidaysCalendarModal from '@proton/components/containers/calendar/holidaysCalendarModal/HolidaysCalendarModal';
import SubscribedCalendarModal from '@proton/components/containers/calendar/subscribedCalendarModal/SubscribedCalendarModal';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { useLoading } from '@proton/hooks';
import { updateMember } from '@proton/shared/lib/api/calendars';
import { groupCalendarsByTaxonomy, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces';
import { CalendarUserSettings, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import CalendarSidebarListItems from './CalendarSidebarListItems';
import CalendarSidebarVersion from './CalendarSidebarVersion';

export interface CalendarSidebarProps {
    addresses: Address[];
    calendars: VisualCalendar[];
    calendarUserSettings: CalendarUserSettings;
    expanded?: boolean;
    isNarrow: boolean;
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
    isNarrow,
    onToggleExpand,
    miniCalendar,
    onCreateEvent,
    onCreateCalendar,
}: CalendarSidebarProps) => {
    const { call } = useEventManager();
    const api = useApi();
    const [user] = useUser();
    const [{ isWelcomeFlow }] = useWelcomeFlags();

    const [loadingVisibility, withLoadingVisibility] = useLoading();
    const holidaysCalendarsEnabled = !!useFeature(FeatureCode.HolidaysCalendars)?.feature?.Value;

    const [calendarModal, setIsCalendarModalOpen, renderCalendarModal] = useModalState();
    const [holidaysCalendarModal, setIsHolidaysCalendarModalOpen, renderHolidaysCalendarModal] = useModalState();
    const [subscribedCalendarModal, setIsSubscribedCalendarModalOpen, renderSubscribedCalendarModal] = useModalState();
    const [limitReachedModal, setIsLimitReachedModalOpen, renderLimitReachedModal] = useModalState();

    const headerRef = useRef(null);
    const dropdownRef = useRef(null);

    const {
        ownedPersonalCalendars: myCalendars,
        sharedCalendars,
        subscribedCalendars: subscribedCalendarsWithoutParams,
        holidaysCalendars,
        unknownCalendars,
    } = useMemo(() => {
        return groupCalendarsByTaxonomy(calendars);
    }, [calendars]);
    const { subscribedCalendars, loading: loadingSubscribedCalendars } = useSubscribedCalendars(
        subscribedCalendarsWithoutParams
    );
    const otherCalendars = sortCalendars([
        ...(loadingSubscribedCalendars ? subscribedCalendarsWithoutParams : subscribedCalendars),
        ...sharedCalendars,
        ...holidaysCalendars,
        ...unknownCalendars,
    ]);

    const { isCalendarsLimitReached, isOtherCalendarsLimitReached } = getHasUserReachedCalendarsLimit(
        calendars,
        !user.hasPaidMail
    );

    const {
        show: showHolidaysSpotlight,
        onDisplayed: onHolidaysSpotlightDisplayed,
        onClose: onCloseHolidaysSpotlight,
    } = useSpotlightOnFeature(
        FeatureCode.HolidaysCalendarsSpotlight,
        !isWelcomeFlow && !isNarrow && !holidaysCalendars.length,
        {
            alpha: Date.UTC(2023, 4, 25, 12),
            beta: Date.UTC(2023, 7, 7, 12),
            default: Date.UTC(2023, 7, 10, 12),
        }
    );
    const shouldShowHolidaysSpotlight = useSpotlightShow(showHolidaysSpotlight);

    const addCalendarText = c('Dropdown action icon tooltip').t`Add calendar`;

    const handleChangeVisibility = async (calendarID: string, checked: boolean) => {
        const members = calendars.find(({ ID }) => ID === calendarID)?.Members || [];
        const [{ ID: memberID }] = getMemberAndAddress(addresses, members);
        await api(updateMember(calendarID, memberID, { Display: checked ? 1 : 0 }));
        await call();
    };

    const handleCreatePersonalCalendar = () => {
        if (!isCalendarsLimitReached) {
            setIsCalendarModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const handleAddHolidaysCalendar = () => {
        if (!isCalendarsLimitReached) {
            setIsHolidaysCalendarModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const handleCreateSubscribedCalendar = () => {
        if (!isOtherCalendarsLimitReached) {
            setIsSubscribedCalendarModalOpen(true);
        } else {
            setIsLimitReachedModalOpen(true);
        }
    };

    const primaryAction = (
        <SidebarPrimaryButton
            data-testid="calendar-view:new-event-button"
            disabled={!onCreateEvent}
            onClick={onCreateEvent}
            className="no-mobile"
        >{c('Action').t`New event`}</SidebarPrimaryButton>
    );

    const [displayMyCalendars, setDisplayMyCalendars] = useState(true);
    const [displayOtherCalendars, setDisplayOtherCalendars] = useState(true);

    const headerButton = (
        <Tooltip title={c('Info').t`Manage your calendars`}>
            <SidebarListItemHeaderLink
                toApp={APPS.PROTONACCOUNT}
                to={getCalendarsSettingsPath({ fullPath: true })}
                target="_self"
                icon="cog-wheel"
                info={c('Link').t`Calendars`}
            />
        </Tooltip>
    );
    const handleClickPlusButton = () => {
        // close spotlight if it's on display
        if (shouldShowHolidaysSpotlight) {
            onCloseHolidaysSpotlight();
        }
    };

    const myCalendarsList = (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayMyCalendars}
                onToggle={() => setDisplayMyCalendars((prevState) => !prevState)}
                right={
                    <div className="flex flex-nowrap flex-align-items-center">
                        {!isOtherCalendarsLimitReached ? (
                            <Spotlight
                                show={shouldShowHolidaysSpotlight}
                                onDisplayed={onHolidaysSpotlightDisplayed}
                                type="new"
                                content={
                                    <>
                                        <div className="text-lg text-bold mb-1">{
                                            // translator: A holidays calendar includes bank holidays and observances
                                            c('Spotlight').t`Public holidays are here!`
                                        }</div>
                                        <p className="m-0">{
                                            // translator: A holidays calendar includes bank holidays and observances
                                            c('Spotlight').t`Add your country's public holidays to your calendar.`
                                        }</p>
                                    </>
                                }
                                anchorRef={dropdownRef}
                            >
                                <Tooltip title={addCalendarText}>
                                    <SimpleDropdown
                                        as="button"
                                        type="button"
                                        hasCaret={false}
                                        className="navigation-link-header-group-control flex"
                                        content={<Icon name="plus" className="navigation-icon" alt={addCalendarText} />}
                                        ref={dropdownRef}
                                        onClick={handleClickPlusButton}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuButton
                                                className="text-left"
                                                onClick={handleCreatePersonalCalendar}
                                            >
                                                {c('Action').t`Create calendar`}
                                            </DropdownMenuButton>
                                            {holidaysCalendarsEnabled && (
                                                <DropdownMenuButton
                                                    className="text-left"
                                                    onClick={handleAddHolidaysCalendar}
                                                >
                                                    {c('Action').t`Add public holidays`}
                                                </DropdownMenuButton>
                                            )}
                                            <DropdownMenuButton
                                                className="text-left"
                                                onClick={handleCreateSubscribedCalendar}
                                            >
                                                {c('Calendar sidebar dropdown item').t`Add calendar from URL`}
                                            </DropdownMenuButton>
                                        </DropdownMenu>
                                    </SimpleDropdown>
                                </Tooltip>
                            </Spotlight>
                        ) : (
                            <Button
                                shape="ghost"
                                color="weak"
                                size="medium"
                                icon
                                className="navigation-link-header-group-control"
                                onClick={handleCreatePersonalCalendar}
                            >
                                <Tooltip title={addCalendarText}>
                                    <Icon name="plus" className="navigation-icon" alt={addCalendarText} />
                                </Tooltip>
                            </Button>
                        )}
                        {headerButton}
                    </div>
                }
                text={c('Link').t`My calendars`}
                testId="calendar-sidebar:my-calendars-button"
            />
            {displayMyCalendars && (
                <CalendarSidebarListItems
                    calendars={myCalendars}
                    allCalendars={calendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingVisibility(handleChangeVisibility(calendarID, value))
                    }
                    addresses={addresses}
                    loadingVisibility={loadingVisibility}
                />
            )}
        </SidebarList>
    );

    const otherCalendarsList = otherCalendars.length ? (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayOtherCalendars}
                onToggle={() => setDisplayOtherCalendars((prevState) => !prevState)}
                text={c('Link').t`Other calendars`}
                testId="calendar-sidebar:other-calendars-button"
                headerRef={headerRef}
                spaceAbove
            />
            {displayOtherCalendars && (
                <CalendarSidebarListItems
                    loadingSubscriptionParameters={loadingSubscribedCalendars}
                    calendars={otherCalendars}
                    allCalendars={calendars}
                    onChangeVisibility={(calendarID, value) =>
                        withLoadingVisibility(handleChangeVisibility(calendarID, value))
                    }
                    addresses={addresses}
                    loadingVisibility={loadingVisibility}
                />
            )}
        </SidebarList>
    ) : null;

    return (
        <Sidebar
            appsDropdown={<AppsDropdown app={APPS.PROTONCALENDAR} />}
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={primaryAction}
            version={<CalendarSidebarVersion />}
        >
            {renderCalendarModal && (
                <CalendarModal
                    {...calendarModal}
                    calendars={calendars}
                    defaultCalendarID={calendarUserSettings.DefaultCalendarID}
                    onCreateCalendar={onCreateCalendar}
                />
            )}
            {renderSubscribedCalendarModal && (
                <SubscribedCalendarModal {...subscribedCalendarModal} onCreateCalendar={onCreateCalendar} />
            )}
            {renderHolidaysCalendarModal && (
                <HolidaysCalendarModal {...holidaysCalendarModal} holidaysCalendars={holidaysCalendars} />
            )}
            {renderLimitReachedModal && (
                <CalendarLimitReachedModal {...limitReachedModal} isFreeUser={!user.hasPaidMail} />
            )}

            <SidebarNav data-testid="calendar-sidebar:calendars-list-area">
                <div className="flex-item-noshrink">{miniCalendar}</div>
                {myCalendarsList}
                {otherCalendarsList}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
