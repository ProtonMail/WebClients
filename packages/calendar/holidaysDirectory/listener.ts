import { selectUserSettings } from '@proton/account';
import type { SharedStartListening } from '@proton/redux-shared-store-types';

import { HolidaysDirectoryState, holidaysDirectoryThunk, selectHolidaysDirectory } from './index';

export const startHolidaysDirectoryListener = (startListening: SharedStartListening<HolidaysDirectoryState>) => {
    startListening({
        predicate: (action, currentState, nextState) => {
            const currentCalendars = selectHolidaysDirectory(currentState);
            if (!currentCalendars?.value) {
                return false;
            }
            const currentUserSettings = selectUserSettings(currentState).value;
            const nextUserSettings = selectUserSettings(nextState).value;
            return Boolean(currentUserSettings?.Locale && currentUserSettings.Locale !== nextUserSettings?.Locale);
        },
        effect: async (action, listenerApi) => {
            listenerApi.dispatch(holidaysDirectoryThunk({ cache: 'no-cache' }));
        },
    });
};
