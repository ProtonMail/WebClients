import type { Reducer } from 'redux';

import type {
    AutoFillSettings,
    AutoSaveSettings,
    AutoSuggestSettings,
    DisallowedAutoDomainsSettings,
} from '@proton/pass/types/worker/settings';
import { partialMerge } from '@proton/pass/utils/object';

import { SessionLockStatus } from '../../types';
import {
    itemCreationSuccess,
    sessionLockDisableSuccess,
    sessionLockEnableSuccess,
    settingEditSuccess,
    syncLock,
} from '../actions';

export type SettingsState = {
    sessionLockRegistered: boolean;
    sessionLockTTL?: number;
    autofill: AutoFillSettings;
    autosave: AutoSaveSettings;
    autosuggest: AutoSuggestSettings;
    loadDomainImages: boolean;
    disallowedDomains: DisallowedAutoDomainsSettings;
    /* explicitly created, not including import */
    createdItemsCount: number;
};

/* proxied settings will also be copied on local
 * storage in order to access them before the booting
 * sequence  (ie: if the user has been logged out) */
export type ProxiedSettings = Omit<SettingsState, 'sessionLockRegistered' | 'sessionLockTTL'>;

const INITIAL_STATE: SettingsState = {
    sessionLockRegistered: false,
    sessionLockTTL: undefined,
    autofill: { inject: true, openOnFocus: true },
    autosave: { prompt: true },
    autosuggest: { password: true, email: true },
    createdItemsCount: 0,
    loadDomainImages: true,
    disallowedDomains: {
        noAutoFill: ['accounts.google.com', 'account.proton.me'],
        noAutoSave: [],
        noAutoSuggestion: ['google.com'],
        noAuto2FA: ['gitlab.protontech.ch'],
    },
};

const reducer: Reducer<SettingsState> = (state = INITIAL_STATE, action) => {
    if (sessionLockEnableSuccess.match(action)) {
        return partialMerge(state, {
            sessionLockRegistered: true,
            sessionLockTTL: action.payload.ttl,
        });
    }

    if (sessionLockDisableSuccess.match(action)) {
        return partialMerge(state, { sessionLockRegistered: false, sessionLockTTL: undefined });
    }

    if (syncLock.match(action)) {
        return partialMerge(state, {
            sessionLockTTL: action.payload.ttl,
            sessionLockRegistered: action.payload.status !== SessionLockStatus.NONE,
        });
    }

    if (settingEditSuccess.match(action)) {
        return partialMerge<SettingsState>(state, action.payload);
    }

    if (itemCreationSuccess.match(action)) {
        return partialMerge(state, { createdItemsCount: state.createdItemsCount + 1 });
    }

    return state;
};

export default reducer;
