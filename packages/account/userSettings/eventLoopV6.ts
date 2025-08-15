import { CacheType } from '@proton/redux-utilities';

import type { CoreEventLoopV6Callback } from '../coreEventLoop/interface';
import { selectUserSettings, userSettingsThunk } from './index';

export const userSettingsLoop: CoreEventLoopV6Callback = ({ event, state, dispatch }) => {
    if (event.UserSettings && selectUserSettings(state)?.value) {
        return dispatch(userSettingsThunk({ cache: CacheType.None }));
    }
};
