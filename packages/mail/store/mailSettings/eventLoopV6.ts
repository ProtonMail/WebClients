import { CacheType } from '@proton/redux-utilities';

import type { MailEventLoopV6Callback } from '../mailEventLoop/interface';
import { mailSettingsThunk, selectMailSettings } from './index';

export const mailSettingsLoop: MailEventLoopV6Callback = ({ event, state, dispatch }) => {
    if (event.MailSettings && selectMailSettings(state)?.value) {
        return dispatch(mailSettingsThunk({ cache: CacheType.None }));
    }
};
