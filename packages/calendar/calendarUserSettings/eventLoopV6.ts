import { CacheType } from '@proton/redux-utilities/interface';

import type { CalendarEventLoopV6Callback } from '../calendarEventLoop/interface';
import { calendarSettingsThunk, selectCalendarUserSettings } from './index';

export const calendarUserSettingsLoop: CalendarEventLoopV6Callback = ({ event, state, dispatch }) => {
    if (event.CalendarUserSettings?.length && selectCalendarUserSettings(state)?.value) {
        return dispatch(calendarSettingsThunk({ cache: CacheType.None }));
    }
};
