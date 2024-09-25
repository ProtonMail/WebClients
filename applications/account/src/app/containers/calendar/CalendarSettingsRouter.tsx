import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { useGetHolidaysDirectory } from '@proton/calendar/holidaysDirectory/hooks';
import { useLoadAllowedTimeZones } from '@proton/calendar/timezones';
import {
    CalendarExportSection,
    CalendarImportSection,
    CalendarInvitationsSection,
    CalendarLayoutSection,
    CalendarSubpage,
    CalendarTimeSection,
    CalendarsSettingsSection,
    InboxDesktopSettingsSection,
    MobileAppSettingsSection,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    useAddresses,
    useCalendarUserSettings,
    useCalendars,
    useCalendarsInfoListener,
    useIsInboxElectronApp,
    useSubscribedCalendars,
} from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getPersonalCalendars,
    getPreferredActiveWritableCalendar,
    getVisualCalendars,
    groupCalendarsByTaxonomy,
    sortCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { locales } from '@proton/shared/lib/i18n/locales';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { getCalendarAppRoutes } from './routes';

interface Props {
    user: UserModel;
    calendarAppRoutes: ReturnType<typeof getCalendarAppRoutes>;
    redirect: ReactNode;
    subscription?: Subscription;
}

const CalendarSettingsRouter = ({ user, subscription, calendarAppRoutes, redirect }: Props) => {
    const { path } = useRouteMatch();
    useLoadAllowedTimeZones();

    const [addresses, loadingAddresses] = useAddresses();
    const memoizedAddresses = useMemo(() => addresses || [], [addresses]);

    const [calendars, loadingCalendars] = useCalendars();
    const getHolidaysDirectory = useGetHolidaysDirectory();

    useEffect(() => {
        getHolidaysDirectory().catch(noop);
    }, []);

    const { isElectronEnabled } = useIsInboxElectronApp();

    const {
        allCalendarIDs,
        visualCalendars,
        personalCalendars,
        ownedPersonalCalendars: myCalendars,
        sharedCalendars,
        subscribedCalendars: subscribedCalendarsWithoutParams,
        holidaysCalendars,
        unknownCalendars,
    } = useMemo(() => {
        const visualCalendars = sortCalendars(getVisualCalendars(calendars || []));
        const personalCalendars = getPersonalCalendars(visualCalendars);

        return {
            allCalendarIDs: visualCalendars.map(({ ID }) => ID),
            visualCalendars,
            personalCalendars,
            ...groupCalendarsByTaxonomy(visualCalendars),
        };
    }, [calendars]);
    const { subscribedCalendars, loading: loadingSubscribedCalendars } = useSubscribedCalendars(
        subscribedCalendarsWithoutParams,
        loadingCalendars || loadingAddresses
    );

    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();

    const defaultCalendar = getDefaultCalendar(myCalendars, calendarUserSettings.DefaultCalendarID);
    const preferredPersonalActiveCalendar = getPreferredActiveWritableCalendar(
        visualCalendars,
        calendarUserSettings.DefaultCalendarID
    );

    useCalendarsInfoListener(allCalendarIDs);

    if (loadingAddresses || loadingCalendars || loadingCalendarUserSettings || loadingSubscribedCalendars) {
        return <PrivateMainAreaLoading />;
    }

    const {
        routes: { general, calendars: calendarsRoute, interops: interopsRoute, desktop },
    } = calendarAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                <PrivateMainSettingsArea config={general}>
                    <CalendarTimeSection calendarUserSettings={calendarUserSettings} />
                    <CalendarLayoutSection calendarUserSettings={calendarUserSettings} />
                    <CalendarInvitationsSection calendarUserSettings={calendarUserSettings} locales={locales} />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, desktop)}>
                <PrivateMainSettingsArea config={desktop}>
                    <MobileAppSettingsSection />
                    {isElectronEnabled && <InboxDesktopSettingsSection />}
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, calendarsRoute)} exact>
                <CalendarsSettingsSection
                    config={calendarsRoute}
                    user={user}
                    subscription={subscription}
                    addresses={memoizedAddresses}
                    calendars={visualCalendars}
                    myCalendars={myCalendars}
                    subscribedCalendars={subscribedCalendars}
                    sharedCalendars={sharedCalendars}
                    holidaysCalendars={holidaysCalendars}
                    unknownCalendars={unknownCalendars}
                    defaultCalendar={defaultCalendar}
                />
            </Route>
            <Route path={`${getSectionPath(path, calendarsRoute)}/:calendarId`}>
                <CalendarSubpage
                    calendars={visualCalendars}
                    addresses={addresses}
                    subscribedCalendars={subscribedCalendars}
                    holidaysCalendars={holidaysCalendars}
                    defaultCalendar={defaultCalendar}
                    user={user}
                    subscription={subscription}
                />
            </Route>
            <Route path={getSectionPath(path, interopsRoute)} exact>
                <PrivateMainSettingsArea config={interopsRoute}>
                    <CalendarImportSection
                        calendars={visualCalendars}
                        initialCalendar={preferredPersonalActiveCalendar}
                        user={user}
                    />
                    <CalendarExportSection
                        personalCalendars={personalCalendars}
                        fallbackCalendar={defaultCalendar || personalCalendars[0]}
                    />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default CalendarSettingsRouter;
