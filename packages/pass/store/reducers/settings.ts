import type { Reducer } from 'redux';

import type { AutoFillSettings, AutoSaveSettings, AutoSuggestSettings } from '@proton/pass/types/worker/settings';
import { or } from '@proton/pass/utils/fp';
import { partialMerge } from '@proton/pass/utils/object';

import {
    sessionLockDisableSuccess,
    sessionLockEnableSuccess,
    sessionLockSync,
    sessionUnlockSuccess,
    settingEditSuccess,
} from '../actions';

export type SettingsState = {
    sessionLockToken?: string;
    sessionLockTTL?: number;
    autofill: AutoFillSettings;
    autosave: AutoSaveSettings;
    autosuggest: AutoSuggestSettings;
    loadDomainImages: boolean;
};

/* proxied settings will also be copied on local
 * storage in order to access them before the booting
 * sequence  (ie: if the user has been logged out) */
export type ProxiedSettings = Omit<SettingsState, 'sessionLockToken' | 'sessionLockTTL'>;

const INITIAL_STATE: SettingsState = {
    autofill: { inject: true, openOnFocus: true },
    autosave: { prompt: true, browserDefault: true },
    autosuggest: { password: true, email: true },
    loadDomainImages: true,
};

const reducer: Reducer<SettingsState> = (state = INITIAL_STATE, action) => {
    if (or(sessionLockEnableSuccess.match, sessionLockSync.match)(action)) {
        /* on sessionLockSync we might not have a storageToken
         * available - this will most likely happen if a user
         * has registered a session lock but cannot boot from
         * cache - we fallback to an empty string for the user
         * settings to be in sync. In that case, the storage
         * token will be hydrated during the next unlock */
        return partialMerge(state, {
            sessionLockToken: action.payload.storageToken ?? '',
            sessionLockTTL: action.payload.ttl,
        });
    }

    if (sessionUnlockSuccess.match(action)) {
        return partialMerge(state, {
            sessionLockToken: action.payload.storageToken,
        });
    }

    if (sessionLockDisableSuccess.match(action)) {
        return partialMerge(state, { sessionLockToken: undefined, sessionLockTTL: undefined });
    }

    if (settingEditSuccess.match(action)) {
        return partialMerge(state, action.payload);
    }

    return state;
};

export default reducer;
