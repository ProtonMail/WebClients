import type { Reducer } from 'redux';

import type { GeneratePasswordOptions } from '@proton/pass/lib/password/generator';
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
import { passwordOptionsEdit } from '@proton/pass/store/actions/creators/password';
import type { MaybeNull } from '@proton/pass/types';
import { SessionLockStatus } from '@proton/pass/types';
import type {
    AutoFillSettings,
    AutoSaveSettings,
    AutoSuggestSettings,
    DomainCriterias,
} from '@proton/pass/types/worker/settings';
import { partialMerge } from '@proton/pass/utils/object/merge';

export type SettingsState = {
    autofill: AutoFillSettings;
    autosave: AutoSaveSettings;
    autosuggest: AutoSuggestSettings;
    createdItemsCount: number /* explicitly created, not including import */;
    disallowedDomains: DomainCriterias;
    loadDomainImages: boolean;
    locale?: string;
    passwordOptions: MaybeNull<GeneratePasswordOptions>;
    sessionLockRegistered: boolean;
    sessionLockTTL?: number;
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
    passwordOptions: null,
};

const INITIAL_STATE: SettingsState = {
    sessionLockRegistered: false,
    sessionLockTTL: undefined,
    ...INITIAL_SETTINGS,
};

const reducer: Reducer<SettingsState> = (state = INITIAL_STATE, action) => {
    if (syncLocalSettings.match(action)) return partialMerge<SettingsState>(state, action.payload);
    if (passwordOptionsEdit.match(action)) return { ...state, passwordOptions: action.payload };
    if (itemCreationSuccess.match(action)) partialMerge(state, { createdItemsCount: state.createdItemsCount + 1 });

    if (sessionLockEnableSuccess.match(action)) {
        return partialMerge(state, {
            sessionLockRegistered: true,
            sessionLockTTL: action.payload.ttl,
        });
    }

    if (sessionLockDisableSuccess.match(action)) {
        return partialMerge(state, {
            sessionLockRegistered: false,
            sessionLockTTL: undefined,
        });
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

    return state;
};

export default reducer;
