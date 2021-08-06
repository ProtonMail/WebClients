import { UserModel } from '@proton/shared/lib/interfaces';
import { useMemo } from 'react';
import { Switch, Route, Redirect, useRouteMatch, useLocation } from 'react-router-dom';
import {
    useAddresses,
    useCalendars,
    useCalendarsKeysSettingsListener,
    useCalendarUserSettings,
} from '@proton/components';
import {
    DEFAULT_CALENDAR_USER_SETTINGS,
    getDefaultCalendar,
    getProbablyActiveCalendars,
} from '@proton/shared/lib/calendar/calendar';

import { getActiveAddresses } from '@proton/shared/lib/helpers/address';

import PrivateMainAreaLoading from '../../components/PrivateMainAreaLoading';

import CalendarCalendarsSettings from './CalendarCalendarsSettings';
import CalendarGeneralSettings from './CalendarGeneralSettings';

interface Props {
    user: UserModel;
}

const CalendarSettingsRouter = ({ user }: Props) => {
    const { path } = useRouteMatch();
    const location = useLocation();

    const [addresses, loadingAddresses] = useAddresses();
    const memoizedAddresses = useMemo(() => addresses || [], [addresses]);

    const [calendars, loadingCalendars] = useCalendars();
    const memoizedCalendars = useMemo(() => calendars || [], [calendars]);

    const [calendarUserSettings = DEFAULT_CALENDAR_USER_SETTINGS, loadingCalendarUserSettings] =
        useCalendarUserSettings();
    const { activeCalendars, allCalendarIDs } = useMemo(() => {
        return {
            calendars: memoizedCalendars,
            activeCalendars: getProbablyActiveCalendars(memoizedCalendars),
            allCalendarIDs: memoizedCalendars.map(({ ID }) => ID),
        };
    }, [calendars]);

    const defaultCalendar = getDefaultCalendar(activeCalendars, calendarUserSettings.DefaultCalendarID);

    const activeAddresses = useMemo(() => {
        return getActiveAddresses(memoizedAddresses);
    }, [memoizedAddresses]);

    useCalendarsKeysSettingsListener(allCalendarIDs);

    if (loadingAddresses || loadingCalendars || loadingCalendarUserSettings) {
        return <PrivateMainAreaLoading />;
    }

    return (
        <Switch>
            <Route path={`${path}/general`}>
                <CalendarGeneralSettings calendarUserSettings={calendarUserSettings} location={location} />
            </Route>
            <Route path={`${path}/calendars`}>
                <CalendarCalendarsSettings
                    activeAddresses={activeAddresses}
                    calendars={memoizedCalendars}
                    activeCalendars={activeCalendars}
                    defaultCalendar={defaultCalendar}
                    location={location}
                    user={user}
                />
            </Route>
            <Redirect to={`${path}/dashboard`} />
        </Switch>
    );
};

export default CalendarSettingsRouter;
