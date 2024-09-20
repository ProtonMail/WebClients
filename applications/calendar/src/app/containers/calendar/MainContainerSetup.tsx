import { useMemo, useRef, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router';

import {
    ContactEmailsProvider,
    useActiveBreakpoint,
    useCalendarUserSettings,
    useUserSettings,
} from '@proton/components';
import { useCalendarsInfoListener } from '@proton/components/containers/eventManager/calendar';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getPreferredActiveWritableCalendar,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import { getDefaultTzid } from '@proton/shared/lib/calendar/getSettings';
import { getTimezone } from '@proton/shared/lib/date/timezone';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';
import type { Address, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { useGetOpenedMailEvents } from '../../hooks/useGetOpenedMailEvents';
import EncryptedSearchLibraryProvider from '../EncryptedSearchLibraryProvider';
import AlarmContainer from '../alarms/AlarmContainer';
import type { CalendarsAlarmsCache } from '../alarms/CacheInterface';
import useCalendarsAlarmsEventListeners from '../alarms/useCalendarAlarmsEventListener';
import { getCalendarsAlarmsCache } from '../alarms/useCalendarsAlarms';
import CalendarContainer from './CalendarContainer';
import CalendarStartupModals from './CalendarStartupModals';
import EventActionContainer from './EventActionContainer';
import ShareInvitationContainer from './ShareInvitationContainer';
import getCalendarsEventCache from './eventStore/cache/getCalendarsEventCache';
import type { CalendarsEventsCache } from './eventStore/interface';
import useCalendarsEventsEventListener from './eventStore/useCalendarsEventsEventListener';
import type { EventTargetAction } from './interface';
import CalendarSearchProvider from './search/CalendarSearchProvider';

interface Props {
    calendars: VisualCalendar[];
    addresses: Address[];
    user: UserModel;
    subscription?: Subscription;
    drawerView?: VIEWS;
    hasReactivatedCalendarsRef: React.MutableRefObject<boolean>;
}

const MainContainerSetup = ({
    user,
    subscription,
    addresses,
    calendars,
    drawerView,
    hasReactivatedCalendarsRef,
}: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const [userSettings] = useUserSettings();
    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS] = useCalendarUserSettings();

    const { activeCalendars, visibleCalendars, allCalendarIDs } = useMemo(() => {
        return {
            activeCalendars: getProbablyActiveCalendars(calendars),
            visibleCalendars: calendars.filter(({ Display }) => !!Display),
            allCalendarIDs: calendars.map(({ ID }) => ID),
        };
    }, [calendars]);

    useCalendarsInfoListener(allCalendarIDs);

    const getOpenedMailEvents = useGetOpenedMailEvents(drawerView);
    const calendarsEventsCacheRef = useRef<CalendarsEventsCache>(getCalendarsEventCache());
    useCalendarsEventsEventListener(calendarsEventsCacheRef, allCalendarIDs, getOpenedMailEvents);

    const calendarAlarmsCacheRef = useRef<CalendarsAlarmsCache>(getCalendarsAlarmsCache());
    useCalendarsAlarmsEventListeners(calendarAlarmsCacheRef, allCalendarIDs);

    const [eventTargetAction, setEventTargetAction] = useState<EventTargetAction>();
    const shareCalendarInvitationRef = useRef<{ calendarID: string; invitationID: string }>();

    const activeAddresses = useMemo(() => {
        return getActiveAddresses(addresses);
    }, [addresses]);

    const preferredPersonalActiveCalendar = getPreferredActiveWritableCalendar(
        activeCalendars,
        calendarUserSettings.DefaultCalendarID
    );

    const [localTzid] = useState(() => getTimezone());
    const [customTzid, setCustomTzid] = useState('');
    const defaultTzid = getDefaultTzid(calendarUserSettings, localTzid);

    // In the drawer the time zone selector won't be visible. We want to force using the browser time zone
    // We have to do it here, so that we use the correct timezone in EventActionContainer and in CalendarContainer
    const tzid = drawerView ? getTimezone() : customTzid || defaultTzid;

    const [startupModalState, setStartupModalState] = useState<{ hasModal?: boolean; isOpen: boolean }>({
        isOpen: false,
    });

    return (
        <ContactEmailsProvider>
            <EncryptedSearchLibraryProvider
                calendarIDs={allCalendarIDs}
                hasReactivatedCalendarsRef={hasReactivatedCalendarsRef}
            >
                <CalendarStartupModals setStartupModalState={setStartupModalState} />
                <Switch>
                    <Route path={['/:appName/event', '/event']}>
                        <EventActionContainer
                            drawerView={drawerView}
                            tzid={tzid}
                            addresses={addresses}
                            calendars={calendars}
                            setEventTargetAction={setEventTargetAction}
                        />
                    </Route>
                    <Route path={'/share'}>
                        <ShareInvitationContainer shareCalendarInvitationRef={shareCalendarInvitationRef} />
                    </Route>
                    <Route path="/">
                        <CalendarSearchProvider>
                            <CalendarContainer
                                tzid={tzid}
                                setCustomTzid={setCustomTzid}
                                isSmallViewport={viewportWidth['<=small']}
                                drawerView={drawerView}
                                user={user}
                                subscription={subscription}
                                addresses={addresses}
                                activeAddresses={activeAddresses}
                                visibleCalendars={visibleCalendars}
                                activeCalendars={activeCalendars}
                                calendars={calendars}
                                createEventCalendar={preferredPersonalActiveCalendar}
                                calendarsEventsCacheRef={calendarsEventsCacheRef}
                                calendarUserSettings={calendarUserSettings}
                                userSettings={userSettings}
                                eventTargetAction={eventTargetAction}
                                setEventTargetAction={setEventTargetAction}
                                shareCalendarInvitationRef={shareCalendarInvitationRef}
                                startupModalState={startupModalState}
                                getOpenedMailEvents={getOpenedMailEvents}
                            />
                        </CalendarSearchProvider>
                    </Route>
                    <Redirect to="/" />
                </Switch>
                <AlarmContainer
                    calendars={visibleCalendars}
                    tzid={tzid}
                    calendarsEventsCacheRef={calendarsEventsCacheRef}
                    calendarsAlarmsCacheRef={calendarAlarmsCacheRef}
                />
            </EncryptedSearchLibraryProvider>
        </ContactEmailsProvider>
    );
};

export default MainContainerSetup;
