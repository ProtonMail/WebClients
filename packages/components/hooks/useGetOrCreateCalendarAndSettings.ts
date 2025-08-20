import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useGetCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getOwnedPersonalCalendars, getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import { getHasUserReachedCalendarsLimit } from '@proton/shared/lib/calendar/calendarLimits';
import setupCalendarHelper from '@proton/shared/lib/calendar/crypto/keys/setupCalendarHelper';
import noop from '@proton/utils/noop';

import useApi from './useApi';
import useEventManager from './useEventManager';

const useGetOrCreateCalendarAndSettings = () => {
    const api = useApi();
    const { call } = useEventManager();
    const silentApi = getSilentApi(api);
    const getAddressKeys = useGetAddressKeys();
    const getCalendars = useGetCalendars();
    const getCalendarUserSettings = useGetCalendarUserSettings();
    const [user] = useUser();
    const getAddresses = useGetAddresses();

    return async () => {
        const [calendarsWithOwnMembers = [], calendarUserSettings] = await Promise.all([
            getCalendars(),
            getCalendarUserSettings(),
        ]);

        const addresses = await getAddresses();

        const calendars = getVisualCalendars(calendarsWithOwnMembers);

        const isFreeUser = !user.hasPaidMail;
        const { isCalendarsLimitReached } = getHasUserReachedCalendarsLimit(calendars, isFreeUser);

        if (!getOwnedPersonalCalendars(calendars).length && !isCalendarsLimitReached) {
            // create a calendar automatically
            try {
                const { calendar, updatedCalendarUserSettings } = await setupCalendarHelper({
                    api: silentApi,
                    addresses,
                    getAddressKeys,
                });
                // refresh list of calendars without awaiting
                // (the refresh is just in case another widget gets opened quickly after, so that it knows there's a new calendar)
                void call();
                return {
                    calendars: getVisualCalendars([calendar]),
                    calendarUserSettings: { ...calendarUserSettings, ...updatedCalendarUserSettings },
                };
            } catch {
                // fail silently
                noop();
            }
        }
        return { calendars, calendarUserSettings };
    };
};

export default useGetOrCreateCalendarAndSettings;
