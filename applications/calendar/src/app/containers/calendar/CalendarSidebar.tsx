import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import SidebarDrawerItems from '@proton/components/components/drawer/SidebarDrawerItems';
import Icon from '@proton/components/components/icon/Icon';
import Sidebar from '@proton/components/components/sidebar/Sidebar';
import SidebarLogo from '@proton/components/components/sidebar/SidebarLogo';
import SidebarNav from '@proton/components/components/sidebar/SidebarNav';
import AppVersion from '@proton/components/components/version/AppVersion';
import AppsDropdown from '@proton/components/containers/app/AppsDropdown';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useApi from '@proton/components/hooks/useApi';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import useLocalState from '@proton/components/hooks/useLocalState';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import { groupCalendarsByTaxonomy, sortCalendars } from '@proton/shared/lib/calendar/calendar';
import { APPS } from '@proton/shared/lib/constants';
import {
    COLLAPSE_EVENTS,
    SOURCE_EVENT,
    sendRequestCollapsibleSidebarReport,
    useLeftSidebarButton,
} from '@proton/shared/lib/helpers/collapsibleSidebar';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import clsx from '@proton/utils/clsx';

import { useBookingsAvailability } from '../bookings/useBookingsAvailability';
import { CalendarSidebarCollapsedButton } from './CalendarSidebarCollapsedButton';
import { ProtonMeetSpotlightWrapper } from './ProtonMeetSpotlightWrapper';
import { Bookings } from './sidebar/Bookings';
import { MyCalendars } from './sidebar/MyCalendars';
import { OtherCalendars } from './sidebar/OtherCalendars';
import { PrimaryButton } from './sidebar/PrimaryButton';

export interface CalendarSidebarProps {
    calendars: VisualCalendar[];
    expanded?: boolean;
    miniCalendar: ReactNode;
    onToggleExpand: () => void;
    onCreateEvent?: () => void;
    onCreateCalendar?: (id: string) => void;
    utcDate: Date;
}

const CalendarSidebar = ({
    calendars,
    expanded = false,
    onToggleExpand,
    miniCalendar,
    onCreateEvent,
    onCreateCalendar,
    utcDate,
}: CalendarSidebarProps) => {
    const api = useApi();
    const [user] = useUser();

    const [showSideBar, setshowSideBar] = useLocalState(true, `${user.ID}-${APPS.PROTONCALENDAR}-left-nav-opened`);
    const { viewportWidth } = useActiveBreakpoint();
    const collapsed = !showSideBar && !viewportWidth['<=small'];

    const isBookingsEnabled = useBookingsAvailability();

    const onClickExpandNav = (sourceEvent = SOURCE_EVENT.BUTTON_SIDEBAR) => {
        sendRequestCollapsibleSidebarReport({
            api,
            action: showSideBar ? COLLAPSE_EVENTS.COLLAPSE : COLLAPSE_EVENTS.EXPAND,
            application: APPS.PROTONCALENDAR,
            sourceEvent,
        });
        setshowSideBar(!showSideBar);
    };

    const navigationRef = useRef<HTMLDivElement>(null);

    const { isScrollPresent } = useLeftSidebarButton({
        navigationRef,
    });

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

    const displayContactsInHeader = useDisplayContactsWidget();

    const logo = <SidebarLogo collapsed={collapsed} to="/" app={APPS.PROTONCALENDAR} />;

    return (
        <Sidebar
            app={APPS.PROTONCALENDAR}
            appsDropdown={<AppsDropdown app={APPS.PROTONCALENDAR} />}
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            primary={
                <ProtonMeetSpotlightWrapper>
                    <PrimaryButton collapsed={collapsed} onCreateEvent={onCreateEvent} utcDate={utcDate} />
                </ProtonMeetSpotlightWrapper>
            }
            version={<AppVersion />}
            showStorage={showSideBar}
            collapsed={collapsed}
            navigationRef={navigationRef}
        >
            <SidebarNav className="flex *:min-size-auto" data-testid="calendar-sidebar:calendars-list-area">
                {collapsed ? (
                    <>
                        {isBookingsEnabled && (
                            <CalendarSidebarCollapsedButton
                                type="bookings"
                                onClick={() => onClickExpandNav?.(SOURCE_EVENT.BUTTON_BOOKINGS)}
                                title={c('Action').t`Expand navigation bar to see bookings`}
                            />
                        )}
                        <CalendarSidebarCollapsedButton
                            type="calendars"
                            onClick={() => onClickExpandNav?.(SOURCE_EVENT.BUTTON_CALENDARS)}
                            title={c('Action').t`Expand navigation bar to see calendars`}
                        />
                    </>
                ) : (
                    <>
                        <div className="shrink-0 w-full">{miniCalendar}</div>
                        <div>
                            {isBookingsEnabled && (
                                <Bookings headerRef={headerRef} utcDate={utcDate} disabled={!onCreateEvent} />
                            )}
                            <MyCalendars
                                myCalendars={myCalendars}
                                calendars={calendars}
                                holidaysCalendars={holidaysCalendars}
                                dropdownRef={dropdownRef}
                                onCreateCalendar={onCreateCalendar}
                            />
                            <OtherCalendars
                                calendars={calendars}
                                otherCalendars={otherCalendars}
                                headerRef={headerRef}
                                loadingSubscribedCalendars={loadingSubscribedCalendars}
                            />
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
                                onClick={() => onClickExpandNav?.(SOURCE_EVENT.BUTTON_SIDEBAR)}
                                aria-pressed={showSideBar}
                            >
                                <Icon
                                    name={showSideBar ? 'chevrons-left' : 'chevrons-right'}
                                    alt={c('Action').t`Show navigation bar`}
                                />
                            </button>
                        </Tooltip>
                    </span>
                )}
            </SidebarNav>
        </Sidebar>
    );
};

export default CalendarSidebar;
