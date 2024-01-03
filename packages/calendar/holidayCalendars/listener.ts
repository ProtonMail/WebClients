import { selectUserSettings } from '@proton/account';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';

import { HolidayCalendarsState, holidayCalendarsThunk, selectHolidayCalendars } from './index';

export const startHolidayCalendarsListener = (startListening: SharedStartListening<HolidayCalendarsState>) => {
    startListening({
        predicate: (action, currentState, nextState) => {
            const currentCalendars = selectHolidayCalendars(currentState);
            if (!currentCalendars?.value) {
                return false;
            }
            const currentUserSettings = selectUserSettings(currentState).value;
            const nextUserSettings = selectUserSettings(nextState).value;
            return Boolean(currentUserSettings?.Locale && currentUserSettings.Locale !== nextUserSettings?.Locale);
        },
        effect: async (action, listenerApi) => {
            listenerApi.dispatch(holidayCalendarsThunk({ forceFetch: true }));
        },
    });
};
