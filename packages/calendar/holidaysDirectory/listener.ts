import { selectUserSettings } from '@proton/account';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';

import type { HolidaysDirectoryState } from './index';
import { holidaysDirectoryThunk, selectHolidaysDirectory } from './index';

export const startHolidaysDirectoryListener = (startListening: SharedStartListening<HolidaysDirectoryState>) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const currentCalendars = selectHolidaysDirectory(currentState);
            if (!currentCalendars?.value) {
                return false;
            }
            const currentUserSettings = selectUserSettings(currentState).value;
            const previousUserSettings = selectUserSettings(previousState).value;
            return Boolean(previousUserSettings?.Locale && currentUserSettings?.Locale !== previousUserSettings.Locale);
        },
        effect: async (action, listenerApi) => {
            listenerApi.dispatch(holidaysDirectoryThunk({ cache: CacheType.None }));
        },
    });
};
