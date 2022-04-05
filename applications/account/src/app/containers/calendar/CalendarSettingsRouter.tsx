import { UserModel } from '@proton/shared/lib/interfaces';
import { ReactNode, useMemo } from 'react';
import { Switch, Route, useRouteMatch, useLocation } from 'react-router-dom';
import { c } from 'ttag';
import {
    ButtonLike,
    CalendarImportSection,
    CalendarLayoutSection,
    CalendarShareSection,
    CalendarTimeSection,
    Card,
    PersonalCalendarsSection,
    PrivateMainSettingsArea,
    SettingsLink,
    SettingsSection,
    SubscribedCalendarsSection,
    ThemesSection,
    useAddresses,
    useCalendars,
    useCalendarsInfoListener,
    useCalendarUserSettings,
} from '@proton/components';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getProbablyActiveCalendars,
    getVisualCalendars,
} from '@proton/shared/lib/calendar/calendar';
import { locales } from '@proton/shared/lib/i18n/locales';
import { partition } from '@proton/shared/lib/helpers/array';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';
import CalendarInvitationsSection from '@proton/components/containers/calendar/settings/CalendarInvitationsSection';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import PrivateMainAreaLoading from '../../components/PrivateMainAreaLoading';
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
    const location = useLocation();

    const [addresses, loadingAddresses] = useAddresses();
    const memoizedAddresses = useMemo(() => addresses || [], [addresses]);

    const [calendars, loadingCalendars] = useCalendars();
    const memoizedCalendars = useMemo(
        () => getVisualCalendars(calendars || [], memoizedAddresses),
        [calendars, memoizedAddresses]
    );

    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();
    const { activeCalendars, allCalendarIDs } = useMemo(() => {
        return {
            calendars: memoizedCalendars,
            activeCalendars: getProbablyActiveCalendars(memoizedCalendars),
            allCalendarIDs: memoizedCalendars.map(({ ID }) => ID),
        };
    }, [calendars]);
    const [personalCalendars, otherCalendars] = partition<VisualCalendar>(
        memoizedCalendars || [],
        getIsPersonalCalendar
    );
    const [personalActiveCalendars] = partition<VisualCalendar>(activeCalendars, getIsPersonalCalendar);

    const defaultCalendar = getDefaultCalendar(activeCalendars, calendarUserSettings.DefaultCalendarID);

    useCalendarsInfoListener(allCalendarIDs);

    if (loadingAddresses || loadingCalendars || loadingCalendarUserSettings || loadingFeatures) {
        return <PrivateMainAreaLoading />;
    }

    const {
        routes: { general, calendars: calendarsRoute },
    } = calendarAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                <PrivateMainSettingsArea config={general} location={location}>
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
            <Route path={getSectionPath(path, calendarsRoute)}>
                <PrivateMainSettingsArea config={calendarsRoute} location={location}>
                    <PersonalCalendarsSection
                        addresses={memoizedAddresses}
                        calendars={personalCalendars}
                        activeCalendars={personalActiveCalendars}
                        defaultCalendar={defaultCalendar}
                        user={user}
                    />
                    <SubscribedCalendarsSection
                        addresses={memoizedAddresses}
                        calendars={otherCalendars}
                        user={user}
                        unavailable={calendarSubscribeUnavailable}
                    />
                    <CalendarImportSection
                        activeCalendars={personalActiveCalendars}
                        defaultCalendar={defaultCalendar}
                        user={user}
                    />
                    {user.isFree ? (
                        <SettingsSection>
                            <Card className="mb1" data-test-id="card:upgrade">
                                <div className="flex flex-nowrap flex-align-items-center">
                                    <p className="flex-item-fluid mt0 mb0 pr2">
                                        {c('Upgrade notice')
                                            .t`Upgrade to a paid plan to share your personal calendar via link with anyone.`}
                                    </p>
                                    <ButtonLike
                                        as={SettingsLink}
                                        path="/dashboard"
                                        color="norm"
                                        shape="solid"
                                        size="small"
                                    >
                                        {c('Action').t`Upgrade`}
                                    </ButtonLike>
                                </div>
                            </Card>
                        </SettingsSection>
                    ) : (
                        <CalendarShareSection
                            id="calendar-share-section"
                            calendars={personalCalendars}
                            defaultCalendar={defaultCalendar}
                            user={user}
                        />
                    )}
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default CalendarSettingsRouter;
