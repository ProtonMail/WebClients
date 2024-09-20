import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AppVersion,
    AppsDropdown,
    CollapsibleSidebarSpotlight,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    Sidebar,
    SidebarDrawerItems,
    SidebarList,
    SidebarListItemHeaderLink,
    SidebarLogo,
    SidebarNav,
    SidebarPrimaryButton,
    SimpleDropdown,
    SimpleSidebarListItemHeader,
    Tooltip,
    useActiveBreakpoint,
    useApi,
    useEventManager,
    useLocalState,
    useModalState,
    useUser,
} from '@proton/components';
import CalendarLimitReachedModal from '@proton/components/containers/calendar/CalendarLimitReachedModal';
import HolidaysCalendarModal from '@proton/components/containers/calendar/calendarModal/holidaysCalendarModal/HolidaysCalendarModal';
import { PersonalCalendarModal } from '@proton/components/containers/calendar/calendarModal/personalCalendarModal/PersonalCalendarModal';
import SubscribedCalendarModal from '@proton/components/containers/calendar/calendarModal/subscribedCalendarModal/SubscribedCalendarModal';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { useLoadingByKey } from '@proton/hooks/useLoading';
import { updateMember } from '@proton/shared/lib/api/calendars';
import { groupCalendarsByTaxonomy, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import { getCalendarsSettingsPath } from '@proton/shared/lib/calendar/settingsRoutes';
import { APPS } from '@proton/shared/lib/constants';
import {
    COLLAPSE_EVENTS,
    SOURCE_EVENT,
    sendRequestCollapsibleSidebarReport,
    useLeftSidebarButton,
} from '@proton/shared/lib/helpers/collapsibleSidebar';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import type { Address } from '@proton/shared/lib/interfaces';
import type { CalendarUserSettings, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import CalendarSidebarListItems from './CalendarSidebarListItems';

export interface CalendarSidebarProps {
    addresses: Address[];
    calendars: VisualCalendar[];
    calendarUserSettings: CalendarUserSettings;
    expanded?: boolean;
    miniCalendar: ReactNode;
    onToggleExpand: () => void;
    onCreateEvent?: () => void;
    onCreateCalendar?: (id: string) => void;
    isAskUpdateTimezoneModalOpen?: boolean;
}

const CalendarSidebar = ({
    addresses,
    calendars,
    calendarUserSettings,
    expanded = false,
    onToggleExpand,
    miniCalendar,
    onCreateEvent,
    onCreateCalendar,
    isAskUpdateTimezoneModalOpen,
}: CalendarSidebarProps) => {
    const { call } = useEventManager();
    const api = useApi();
    const [user] = useUser();

    const [showSideBar, setshowSideBar] = useLocalState(true, `${user.ID}-${APPS.PROTONCALENDAR}-left-nav-opened`);
    const { viewportWidth } = useActiveBreakpoint();
    const collapsed = !showSideBar && !viewportWidth['<=small'];

    const onClickExpandNav = () => {
        sendRequestCollapsibleSidebarReport({
            api,
            action: showSideBar ? COLLAPSE_EVENTS.COLLAPSE : COLLAPSE_EVENTS.EXPAND,
            application: APPS.PROTONCALENDAR,
            sourceEvent: SOURCE_EVENT.BUTTON_SIDEBAR,
        });
        setshowSideBar(!showSideBar);
    };

    const navigationRef = useRef<HTMLDivElement>(null);

    const { isScrollPresent } = useLeftSidebarButton({
        navigationRef,
    });

    const [loadingVisibility, withLoadingVisibility] = useLoadingByKey();

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
        <Tooltip title={collapsed ? c('Action').t`New event` : null}>
            <SidebarPrimaryButton
                data-testid="calendar-view:new-event-button"
                disabled={!onCreateEvent}
                onClick={onCreateEvent}
                className={clsx('hidden md:flex items-center justify-center flex-nowrap gap-2', collapsed && 'px-0')}
            >
                {collapsed ? (
                    <Icon name="plus" className="flex mx-auto my-0.5" alt={c('Action').t`New event`} />
                ) : (
                    <span className="text-ellipsis">{c('Action').t`New event`}</span>
                )}
            </SidebarPrimaryButton>
        </Tooltip>
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
                alt={c('Link').t`Calendars`}
            />
        </Tooltip>
    );

    const myCalendarsList = (
        <SidebarList>
            <SimpleSidebarListItemHeader
                toggle={displayMyCalendars}
                onToggle={() => setDisplayMyCalendars((prevState) => !prevState)}
                right={
                    <div className="flex flex-nowrap items-center">
                        {!isOtherCalendarsLimitReached ? (
                            <Tooltip title={addCalendarText}>
                                <SimpleDropdown
                                    as="button"
                                    type="button"
                                    hasCaret={false}
                                    className="navigation-link-header-group-control flex"
                                    content={<Icon name="plus" className="navigation-icon" alt={addCalendarText} />}
                                    ref={dropdownRef}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={handleCreatePersonalCalendar}
                                        >
                                            {c('Action').t`Create calendar`}
                                        </DropdownMenuButton>
                                        <DropdownMenuButton className="text-left" onClick={handleAddHolidaysCalendar}>
                                            {c('Action').t`Add public holidays`}
                                        </DropdownMenuButton>
                                        <DropdownMenuButton
                                            className="text-left"
                                            onClick={handleCreateSubscribedCalendar}
                                        >
                                            {c('Calendar sidebar dropdown item').t`Add calendar from URL`}
                                        </DropdownMenuButton>
                                    </DropdownMenu>
                                </SimpleDropdown>
                            </Tooltip>
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
                        withLoadingVisibility(calendarID, handleChangeVisibility(calendarID, value))
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
                        withLoadingVisibility(calendarID, handleChangeVisibility(calendarID, value))
                    }
                    addresses={addresses}
                    loadingVisibility={loadingVisibility}
                />
            )}
        </SidebarList>
    ) : null;

    const displayContactsInHeader = useDisplayContactsWidget();

    const logo = <SidebarLogo collapsed={collapsed} to="/" app={APPS.PROTONCALENDAR} />;

    return (
        <Sidebar
            app={APPS.PROTONCALENDAR}
            appsDropdown={<AppsDropdown app={APPS.PROTONCALENDAR} />}
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={primaryAction}
            version={<AppVersion />}
            showStorage={showSideBar}
            collapsed={collapsed}
            navigationRef={navigationRef}
        >
            {renderCalendarModal && (
                <PersonalCalendarModal
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
                <CalendarLimitReachedModal user={user} {...limitReachedModal} isFreeUser={!user.hasPaidMail} />
            )}

            <SidebarNav className="flex *:min-size-auto" data-testid="calendar-sidebar:calendars-list-area">
                {!collapsed && (
                    <>
                        <div className="shrink-0 w-full">{miniCalendar}</div>
                        <div>
                            {myCalendarsList}
                            {otherCalendarsList}
                        </div>
                        {displayContactsInHeader && <SidebarDrawerItems toggleHeaderDropdown={onToggleExpand} />}
                    </>
                )}

                {!isElectronApp && (
                    <span
                        className={clsx(
                            'mt-auto',
                            !collapsed && 'absolute bottom-0 right-0 mb-11',
                            isScrollPresent && 'sidebar-collapse-button-container--above-scroll'
                        )}
                    >
                        <CollapsibleSidebarSpotlight
                            app={APPS.PROTONCALENDAR}
                            isAskUpdateTimezoneModalOpen={isAskUpdateTimezoneModalOpen}
                        >
                            {collapsed && <div aria-hidden="true" className="border-top my-1 mx-3"></div>}
                            <Tooltip
                                title={
                                    showSideBar
                                        ? c('Action').t`Collapse navigation bar`
                                        : c('Action').t`Display navigation bar`
                                }
                                originalPlacement="right"
                            >
                                <button
                                    className={clsx(
                                        'hidden md:flex mt-auto sidebar-collapse-button navigation-link-header-group-control color-weak shrink-0',
                                        !showSideBar && 'sidebar-collapse-button--collapsed',
                                        collapsed ? 'mx-auto' : 'mr-2 ml-auto',
                                        isScrollPresent && 'sidebar-collapse-button--above-scroll'
                                    )}
                                    onClick={onClickExpandNav}
                                    aria-pressed={showSideBar}
                                >
                                    <Icon
                                        name={showSideBar ? 'chevrons-left' : 'chevrons-right'}
                                        alt={c('Action').t`Show navigation bar`}
                                    />
                                </button>
                            </Tooltip>
                        </CollapsibleSidebarSpotlight>
                    </span>
                )}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
