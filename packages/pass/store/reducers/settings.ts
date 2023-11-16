import type { Reducer } from 'redux';

import { toggleCriteria } from '@proton/pass/lib/settings/criteria';
import {
    itemCreationSuccess,
    sessionLockDisableSuccess,
    sessionLockEnableSuccess,
    sessionLockSync,
    settingsEditSuccess,
    syncLocalSettings,
    updatePauseListItem,
} from '@proton/pass/store/actions';
import { SessionLockStatus } from '@proton/pass/types';
import type {
    AutoFillSettings,
    AutoSaveSettings,
    AutoSuggestSettings,
    DomainCriterias,
} from '@proton/pass/types/worker/settings';
import { partialMerge } from '@proton/pass/utils/object/merge';

export type SettingsState = {
    locale?: string;
    sessionLockRegistered: boolean;
    sessionLockTTL?: number;
    autofill: AutoFillSettings;
    autosave: AutoSaveSettings;
    autosuggest: AutoSuggestSettings;
    loadDomainImages: boolean;
    disallowedDomains: DomainCriterias;
    createdItemsCount: number /* explicitly created, not including import */;
};

/* proxied settings will also be copied on local
 * storage in order to access them before the booting
 * sequence  (ie: if the user has been logged out) */
export type ProxiedSettings = Omit<SettingsState, 'sessionLockRegistered' | 'sessionLockTTL'>;

export const INITIAL_SETTINGS: ProxiedSettings = {
    autofill: { inject: true, openOnFocus: true },
    autosave: { prompt: true },
    autosuggest: { password: true, email: true },
    createdItemsCount: 0,
    disallowedDomains: {},
    loadDomainImages: true,
};

const INITIAL_STATE: SettingsState = {
    sessionLockRegistered: false,
    sessionLockTTL: undefined,
    ...INITIAL_SETTINGS,
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

    if (sessionLockSync.match(action)) {
        return partialMerge(state, {
            sessionLockTTL: action.payload.ttl,
            sessionLockRegistered: action.payload.status !== SessionLockStatus.NONE,
        });
    }

    if (settingsEditSuccess.match(action)) {
        const update = { ...state };

        /* `disallowedDomains` update should act as a setter */
        if ('disallowedDomains' in action.payload) update.disallowedDomains = {};
        return partialMerge<SettingsState>(update, action.payload);
    }

    if (updatePauseListItem.match(action)) {
        const { hostname, criteria } = action.payload;
        const criteriasSetting = state.disallowedDomains[hostname] ?? 0;

        return partialMerge<SettingsState>(state, {
            disallowedDomains: {
                [hostname]: toggleCriteria(criteriasSetting, criteria),
            },
        });
    }

    if (itemCreationSuccess.match(action)) {
        return partialMerge(state, { createdItemsCount: state.createdItemsCount + 1 });
    }

    if (syncLocalSettings.match(action)) {
        return partialMerge<SettingsState>(state, action.payload);
    }

    return state;
};

export default reducer;
