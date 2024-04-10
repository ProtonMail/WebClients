import type { Reducer } from 'redux';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/generator';
import { toggleCriteria } from '@proton/pass/lib/settings/criteria';
import {
    itemCreationSuccess,
    lockCreateSuccess,
    lockSync,
    offlineDisable,
    offlineSetupSuccess,
    settingsEditSuccess,
    updatePauseListItem,
    userEvent,
} from '@proton/pass/store/actions';
import { passwordOptionsEdit } from '@proton/pass/store/actions/creators/password';
import type { MaybeNull, Unpack } from '@proton/pass/types';
import type {
    AutoFillSettings,
    AutoSaveSettings,
    AutoSuggestSettings,
    DomainCriterias,
    PasskeySettings,
} from '@proton/pass/types/worker/settings';
import { or } from '@proton/pass/utils/fp/predicates';
import { partialMerge } from '@proton/pass/utils/object/merge';

export type SettingsState = {
    autofill: AutoFillSettings;
    autosave: AutoSaveSettings;
    autosuggest: AutoSuggestSettings;
    beta?: boolean;
    createdItemsCount: number /* explicitly created, not including import */;
    disallowedDomains: DomainCriterias;
    loadDomainImages: boolean;
    locale?: string;
    lockMode: LockMode;
    lockTTL?: number;
    offlineEnabled?: boolean;
    passkeys: PasskeySettings;
    passwordOptions: MaybeNull<GeneratePasswordConfig>;
};

export const EXCLUDED_SETTINGS_KEYS = ['createdItemsCount', 'lockMode'] as const;
export type ExcludedProxiedSettingsKeys = Unpack<typeof EXCLUDED_SETTINGS_KEYS>;

/* proxied settings will also be copied on local
 * storage in order to access them before the booting
 * sequence  (ie: if the user has been logged out) */
export type ProxiedSettings = Omit<SettingsState, ExcludedProxiedSettingsKeys>;

export const INITIAL_SETTINGS: ProxiedSettings = {
    autofill: { inject: true, openOnFocus: true },
    autosave: { prompt: true, passwordSuggest: false },
    autosuggest: { password: true, email: true },
    disallowedDomains: {},
    loadDomainImages: true,
    passkeys: { get: true, create: true },
    passwordOptions: null,
};

const INITIAL_STATE: SettingsState = {
    createdItemsCount: 0,
    lockMode: LockMode.NONE,
    lockTTL: undefined,
    ...INITIAL_SETTINGS,
};

const reducer: Reducer<SettingsState> = (state = INITIAL_STATE, action) => {
    if (passwordOptionsEdit.match(action)) return { ...state, passwordOptions: action.payload };

    if (itemCreationSuccess.match(action)) {
        return partialMerge(state, { createdItemsCount: state.createdItemsCount + 1 });
    }

    if (or(lockCreateSuccess.match, lockSync.match)(action)) {
        return partialMerge(state, { lockMode: action.payload.lock.mode, lockTTL: action.payload.lock.ttl });
    }

    if (settingsEditSuccess.match(action)) {
        const update = { ...state };

        /* `disallowedDomains` update should act as a setter */
        if ('disallowedDomains' in action.payload) update.disallowedDomains = {};
        return partialMerge<SettingsState>(update, action.payload);
    }

    if (userEvent.match(action)) {
        const locale = action.payload.UserSettings?.Locale;
        return locale ? partialMerge(state, { locale }) : state;
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

    if (offlineSetupSuccess.match(action)) return partialMerge<SettingsState>(state, { offlineEnabled: true });

    if (offlineDisable.match(action)) {
        const hasSessionLock = state.lockMode === LockMode.SESSION;
        return { ...state, offlineEnabled: false, lockMode: hasSessionLock ? state.lockMode : LockMode.NONE };
    }

    return state;
};

export default reducer;
