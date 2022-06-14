import { ReactNode, useMemo } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import {
    CalendarExportSection,
    CalendarImportSection,
    CalendarLayoutSection,
    CalendarSettingsSection,
    CalendarShareSection,
    CalendarTimeSection,
    PersonalCalendarsSection,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    SubscribedCalendarsSection,
    ThemesSection,
    useAddresses,
    useCalendarUserSettings,
    useCalendars,
    useCalendarsInfoListener,
    useSubscribedCalendars,
} from '@proton/components';
import CalendarInvitationsSection from '@proton/components/containers/calendar/settings/CalendarInvitationsSection';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getProbablyActiveCalendars,
    getVisualCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import { locales } from '@proton/shared/lib/i18n/locales';
import { UserModel } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import partition from '@proton/utils/partition';

import { getCalendarAppRoutes } from './routes';

interface Props {
    user: UserModel;
    loadingFeatures: boolean;
    calendarAppRoutes: ReturnType<typeof getCalendarAppRoutes>;
    redirect: ReactNode;
    calendarSubscribeUnavailable: boolean;
    hasInviteLocaleFeature: boolean;
    hasAutoImportInviteFeature: boolean;
}

const CalendarSettingsRouter = ({
    user,
    calendarSubscribeUnavailable,
    hasInviteLocaleFeature,
    hasAutoImportInviteFeature,
    loadingFeatures,
    calendarAppRoutes,
    redirect,
}: Props) => {
    const { path } = useRouteMatch();

    const [addresses, loadingAddresses] = useAddresses();
    const memoizedAddresses = useMemo(() => addresses || [], [addresses]);

    const [calendars, loadingCalendars] = useCalendars();
    const {
        visualCalendars,
        personalCalendars,
        otherCalendars,
        activeCalendars,
        allCalendarIDs,
        personalActiveCalendars,
    } = useMemo(() => {
        const visualCalendars = getVisualCalendars(calendars || [], memoizedAddresses);
        const [personalCalendars, otherCalendars] = partition<VisualCalendar>(
            visualCalendars || [],
            getIsPersonalCalendar
        );
        const activeCalendars = getProbablyActiveCalendars(visualCalendars);

        return {
            visualCalendars,
            personalCalendars,
            otherCalendars,
            activeCalendars,
            personalActiveCalendars: activeCalendars.filter((calendar) => getIsPersonalCalendar(calendar)),
            allCalendarIDs: visualCalendars.map(({ ID }) => ID),
        };
    }, [calendars, memoizedAddresses]);
    const { subscribedCalendars, loading: loadingSubscribedCalendars } = useSubscribedCalendars(
        otherCalendars,
        memoizedAddresses,
        loadingCalendars
    );

    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();

    const defaultCalendar = getDefaultCalendar(activeCalendars, calendarUserSettings.DefaultCalendarID);

    useCalendarsInfoListener(allCalendarIDs);

    if (
        loadingAddresses ||
        loadingCalendars ||
        loadingCalendarUserSettings ||
        loadingFeatures ||
        loadingSubscribedCalendars
    ) {
        return <PrivateMainAreaLoading />;
    }

    const {
        routes: { general, calendars: calendarsRoute, interops: interopsRoute },
    } = calendarAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                <PrivateMainSettingsArea config={general}>
                    <CalendarTimeSection calendarUserSettings={calendarUserSettings} />
                    <CalendarLayoutSection calendarUserSettings={calendarUserSettings} />
                    <CalendarInvitationsSection
                        calendarUserSettings={calendarUserSettings}
                        locales={locales}
                        hasInviteLocaleFeature={hasInviteLocaleFeature}
                        hasAutoImportInviteFeature={hasAutoImportInviteFeature}
                    />
                    <ThemesSection />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, calendarsRoute)} exact>
                <PrivateMainSettingsArea config={calendarsRoute}>
                    <PersonalCalendarsSection
                        addresses={memoizedAddresses}
                        calendars={personalCalendars}
                        activeCalendars={personalActiveCalendars}
                        defaultCalendar={defaultCalendar}
                        user={user}
                    />
                    <SubscribedCalendarsSection
                        addresses={memoizedAddresses}
                        calendars={subscribedCalendars}
                        user={user}
                        unavailable={calendarSubscribeUnavailable}
                    />
                    <CalendarShareSection
                        id="calendar-share-section"
                        calendars={personalCalendars}
                        defaultCalendar={defaultCalendar}
                        user={user}
                    />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={`${getSectionPath(path, calendarsRoute)}/:calendarId`}>
                <CalendarSettingsSection
                    calendars={visualCalendars}
                    personalActiveCalendars={personalActiveCalendars}
                    subscribedCalendars={subscribedCalendars}
                    defaultCalendar={defaultCalendar}
                />
            </Route>
            <Route path={getSectionPath(path, interopsRoute)} exact>
                <PrivateMainSettingsArea config={interopsRoute}>
                    <CalendarImportSection
                        addresses={addresses}
                        personalActiveCalendars={personalActiveCalendars}
                        defaultCalendar={defaultCalendar}
                        user={user}
                    />
                    <CalendarExportSection personalCalendars={personalCalendars} defaultCalendar={defaultCalendar} />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default CalendarSettingsRouter;
