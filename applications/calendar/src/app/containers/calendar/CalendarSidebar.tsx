import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms';
import {
    AppVersion,
    AppsDropdown,
    Icon,
    Sidebar,
    SidebarDrawerItems,
    SidebarLogo,
    SidebarNav,
    useActiveBreakpoint,
    useApi,
    useLocalState,
    useSubscribedCalendars,
} from '@proton/components';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
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
}

const CalendarSidebar = ({
    calendars,
    expanded = false,
    onToggleExpand,
    miniCalendar,
    onCreateEvent,
    onCreateCalendar,
}: CalendarSidebarProps) => {
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
            primary={<PrimaryButton collapsed={collapsed} onCreateEvent={onCreateEvent} />}
            version={<AppVersion />}
            showStorage={showSideBar}
            collapsed={collapsed}
            navigationRef={navigationRef}
        >
            <SidebarNav className="flex *:min-size-auto" data-testid="calendar-sidebar:calendars-list-area">
                {!collapsed && (
                    <>
                        <div className="shrink-0 w-full">{miniCalendar}</div>
                        <div>
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
                            <Bookings headerRef={headerRef} />
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
                                onClick={onClickExpandNav}
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
