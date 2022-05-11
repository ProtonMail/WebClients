import { ReactNode, useMemo } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import {
    CalendarExportSection,
    CalendarImportSection,
    CalendarLayoutSection,
    CalendarSettingsSection,
    CalendarTimeSection,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    ThemesSection,
    useAddresses,
    useCalendarUserSettings,
    useCalendars,
    useCalendarsInfoListener,
    useSubscribedCalendars,
} from '@proton/components';
import CalendarInvitationsSection from '@proton/components/containers/calendar/settings/CalendarInvitationsSection';
import CalendarsSettingsSection from '@proton/components/containers/calendar/settings/CalendarsSettingsSection';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getIsPersonalCalendar,
    getVisualCalendars,
} from '@proton/shared/lib/calendar/calendar';
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

    const { visualCalendars, personalCalendars, otherCalendars, allCalendarIDs } = useMemo(() => {
        const visualCalendars = getVisualCalendars(calendars || []);
        const [personalCalendars, otherCalendars] = partition<VisualCalendar>(
            visualCalendars || [],
            getIsPersonalCalendar
        );

        return {
            visualCalendars,
            personalCalendars,
            otherCalendars,
            allCalendarIDs: visualCalendars.map(({ ID }) => ID),
        };
    }, [calendars, memoizedAddresses]);
    const { subscribedCalendars, loading: loadingSubscribedCalendars } = useSubscribedCalendars(
        otherCalendars,
        loadingCalendars || loadingAddresses
    );

    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();

    const defaultCalendar = getDefaultCalendar(visualCalendars, calendarUserSettings.DefaultCalendarID);

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
                <CalendarsSettingsSection
                    config={calendarsRoute}
                    user={user}
                    addresses={memoizedAddresses}
                    personalCalendars={personalCalendars}
                    subscribedCalendars={subscribedCalendars}
                    defaultCalendar={defaultCalendar}
                    calendarSubscribeUnavailable={calendarSubscribeUnavailable}
                />
            </Route>
            <Route path={`${getSectionPath(path, calendarsRoute)}/:calendarId`}>
                <CalendarSettingsSection
                    calendars={visualCalendars}
                    addresses={addresses}
                    subscribedCalendars={subscribedCalendars}
                    defaultCalendar={defaultCalendar}
                    user={user}
                />
            </Route>
            <Route path={getSectionPath(path, interopsRoute)} exact>
                <PrivateMainSettingsArea config={interopsRoute}>
                    <CalendarImportSection
                        addresses={addresses}
                        calendars={visualCalendars}
                        defaultCalendar={defaultCalendar}
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
