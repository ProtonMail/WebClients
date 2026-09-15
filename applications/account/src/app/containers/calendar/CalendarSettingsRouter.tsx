import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { useAddresses } from '@proton/account/addresses/hooks';
import { VideoConferenceToggle } from '@proton/calendar-video-conferencing/zoomIntegration/VideoConferenceToggle';
import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useGetHolidaysDirectory } from '@proton/calendar/holidaysDirectory/hooks';
import CalendarExportSection from '@proton/components/containers/calendar/settings/CalendarExportSection';
import CalendarImportSection from '@proton/components/containers/calendar/settings/CalendarImportSection';
import CalendarInvitationsSection from '@proton/components/containers/calendar/settings/CalendarInvitationsSection';
import CalendarLayoutSection from '@proton/components/containers/calendar/settings/CalendarLayoutSection';
import CalendarOtherPreferencesSection from '@proton/components/containers/calendar/settings/CalendarOtherPreferencesSection';
import CalendarSubpage from '@proton/components/containers/calendar/settings/CalendarSubpage';
import CalendarTimeSection from '@proton/components/containers/calendar/settings/CalendarTimeSection';
import CalendarsSettingsSection from '@proton/components/containers/calendar/settings/CalendarsSettingsSection';
import { InboxDesktopSettingsSection } from '@proton/components/containers/desktop/InboxDesktopSettingsSection';
import { useCalendarsInfoListener } from '@proton/components/containers/eventManager/calendar/useCalendarsInfoListener';
import PrivateMainAreaLoading from '@proton/components/containers/layout/PrivateMainAreaLoading';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import MobileAppSettingsSection from '@proton/components/containers/mobile/MobileAppSettingsSection';
import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';
import { useLoadAllowedTimeZones } from '@proton/components/hooks/useLoadAllowedTimeZones';
import useSubscribedCalendars from '@proton/components/hooks/useSubscribedCalendars';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
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
import type { UserModel } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { getCalendarAppRoutes } from './routes';

interface Props {
    user: UserModel;
    calendarAppRoutes: ReturnType<typeof getCalendarAppRoutes>;
    redirect: ReactNode;
    subscription: MaybeFreeSubscription;
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
                    <VideoConferenceToggle />
                    <CalendarOtherPreferencesSection />
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
