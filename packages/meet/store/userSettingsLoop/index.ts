import { CacheType } from '@proton/redux-utilities/interface';

import type { MeetEventLoopCallback } from '../meetEventLoop/interface';
import { selectUserSettings, userSettingsThunk } from '../slices/userSettings';

export const userSettingsLoop: MeetEventLoopCallback = ({ event, state, dispatch }) => {
    if (event.MeetUserSettings?.length && selectUserSettings(state)?.value) {
        return dispatch(userSettingsThunk({ cache: CacheType.None }));
    }
};
