import { createSelector } from '@reduxjs/toolkit';

import { type PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { DEFAULT_LOCK_TTL } from '@proton/pass/constants';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { EXCLUDED_SETTINGS_KEYS } from '@proton/pass/store/reducers/settings';
import { selectOrganizationSettings } from '@proton/pass/store/selectors/organization';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { DomainCriterias } from '@proton/pass/types/worker/settings';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { omit } from '@proton/shared/lib/helpers/object';

const selectSettings = ({ settings }: State) => settings;
export const selectProxiedSettings = createSelector(selectSettings, (settings) =>
    omit(settings, EXCLUDED_SETTINGS_KEYS)
);

export const selectCanLoadDomainImages = ({ settings }: State) => settings.loadDomainImages;
export const selectLockTTL = ({ settings }: State): Maybe<number> => settings.lockTTL;
export const selectDisallowedDomains = ({ settings }: State): DomainCriterias => settings.disallowedDomains;
export const selectLocale = ({ settings }: State) => settings.locale;
export const selectPasswordOptions = (state: State) => state.settings.passwordOptions;
export const selectAutosuggestCopyToClipboard = ({ settings }: State) => settings.autosuggest.passwordCopy;
export const selectCreatedItemsCount = ({ settings }: State) => settings.createdItemsCount;
export const selectOfflineEnabled = ({ settings }: State) => settings.offlineEnabled ?? false;
export const selectExtraPasswordEnabled = ({ settings }: State) => settings.extraPassword ?? false;
export const selectBetaEnabled = ({ settings }: State) => settings.beta ?? false;
export const selectLockMode = ({ settings }: State) => settings.lockMode ?? LockMode.NONE;
export const selectLockEnabled = pipe(selectLockMode, (mode) => mode !== LockMode.NONE);
export const selectShowUsernameField = ({ settings }: State) => settings.showUsernameField ?? false;
export const selectTheme = ({ settings }: State): Maybe<PassThemeOption> => settings?.theme;
export const selectClipboardTTL = ({ settings }: State) => settings.clipboard?.timeoutMs;
export const selectAliasTrashAcknowledged = ({ settings }: State) => settings.aliasTrashAcknowledged;

export const selectLockSetupRequired = createSelector(
    [selectLockMode, selectOrganizationSettings],
    (lockMode, orgSettings) =>
        Boolean(orgSettings?.ForceLockSeconds && orgSettings.ForceLockSeconds > 0 && lockMode === LockMode.NONE)
);

export const selectSanitizedLockTTL = createSelector(
    [selectLockTTL, selectOrganizationSettings],
    (ttl, orgSettings) => orgSettings?.ForceLockSeconds ?? ttl ?? DEFAULT_LOCK_TTL
);
