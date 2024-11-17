import type { Reducer } from 'redux';

import { type PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/types';
import { toggleCriteria } from '@proton/pass/lib/settings/criteria';
import {
    extraPasswordToggle,
    itemCreationSuccess,
    lockCreateSuccess,
    lockSync,
    offlineToggle,
    settingsEditSuccess,
    updatePauseListItem,
    userEvent,
} from '@proton/pass/store/actions';
import { passwordOptionsEdit } from '@proton/pass/store/actions/creators/password';
import type { ClipboardStoreProperties, MaybeNull, Unpack } from '@proton/pass/types';
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
    aliasTrashAcknowledged?: boolean;
    autofill: AutoFillSettings;
    autosave: AutoSaveSettings;
    autosuggest: AutoSuggestSettings;
    beta?: boolean;
    clipboard?: ClipboardStoreProperties;
    createdItemsCount: number /* explicitly created, not including import */;
    disallowedDomains: DomainCriterias;
    extraPassword?: boolean;
    loadDomainImages: boolean;
    locale?: string;
    lockMode: LockMode;
    lockTTL?: number;
    offlineEnabled?: boolean;
    passkeys: PasskeySettings;
    passwordOptions: MaybeNull<GeneratePasswordConfig>;
    showUsernameField?: boolean;
    theme?: PassThemeOption;
};

export const EXCLUDED_SETTINGS_KEYS = ['createdItemsCount', 'lockMode', 'extraPassword'] as const;
export type ExcludedProxiedSettingsKeys = Unpack<typeof EXCLUDED_SETTINGS_KEYS>;

/* proxied settings will also be copied on local
 * storage in order to access them before the booting
 * sequence  (ie: if the user has been logged out) */
export type ProxiedSettings = Omit<SettingsState, ExcludedProxiedSettingsKeys>;

export const getInitialSettings = (): ProxiedSettings => ({
    autofill: { identity: true, twofa: true },
    autosave: { prompt: true, passwordSuggest: true },
    autosuggest: { password: true, email: true, passwordCopy: false },
    disallowedDomains: {},
    loadDomainImages: true,
    passkeys: { get: true, create: true },
    passwordOptions: null,
    showUsernameField: false,
    /* Theme is set to undefined so we can prompt <ThemeOnboardingModal> for discovery.
     * Once we decide to no longer display that modal (e.g theme feature is not considered new anymore)
     * then change value to PassThemeOption.OS */
    theme: undefined,
});

const getInitialState = (): SettingsState => ({
    createdItemsCount: 0,
    lockMode: LockMode.NONE,
    lockTTL: undefined,
    ...getInitialSettings(),
});

const reducer: Reducer<SettingsState> = (state = getInitialState(), action) => {
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

    if (offlineToggle.success.match(action)) {
        return partialMerge<SettingsState>(state, { offlineEnabled: action.payload });
    }

    if (extraPasswordToggle.success.match(action)) {
        return partialMerge<SettingsState>(state, { extraPassword: action.payload });
    }

    return state;
};

export default reducer;
