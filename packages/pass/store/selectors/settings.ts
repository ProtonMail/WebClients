import { createSelector } from '@reduxjs/toolkit';

import { omit } from '@proton/shared/lib/helpers/object';

import type { PassThemeOption } from '../../components/Layout/Theme/types';
import { DEFAULT_LOCK_TTL } from '../../constants';
import { LockMode } from '../../lib/auth/lock/types';
import { type DomainCriterias, mergePauseCriterias } from '../../lib/settings/pause-list';
import type { Maybe } from '../../types';
import { pipe } from '../../utils/fp/pipe';
import { EXCLUDED_SETTINGS_KEYS } from '../reducers/settings';
import type { State } from '../types';
import { selectOrganizationSettings } from './organization';

export const selectSettings = ({ settings }: State) => settings;
export const selectProxiedSettings = createSelector(selectSettings, (settings) => omit(settings, EXCLUDED_SETTINGS_KEYS));

export const selectCanLoadDomainImages = ({ settings }: State) => settings.loadDomainImages;
export const selectDisallowedDomains = ({ settings }: State): DomainCriterias => settings.disallowedDomains;
export const selectOrgDomains = ({ settings }: State): Maybe<DomainCriterias> => settings?.orgDomains;
export const selectPauseListEntries = createSelector([selectDisallowedDomains, selectOrgDomains], (disallowedDomains, orgDomains) => {
    const domains = orgDomains ? mergePauseCriterias(disallowedDomains, orgDomains) : disallowedDomains;
    return Object.entries(domains);
});

export const selectLocale = ({ settings }: State) => settings.locale;
export const selectPasswordOptions = (state: State) => state.settings.passwordOptions;
export const selectAutosuggestCopyToClipboard = ({ settings }: State) => settings.autosuggest.passwordCopy;
export const selectCreatedItemsCount = ({ settings }: State) => settings.createdItemsCount;
export const selectBetaEnabled = ({ settings }: State) => settings.beta ?? false;
export const selectShowUsernameField = ({ settings }: State) => settings.showUsernameField ?? false;
export const selectTheme = ({ settings }: State): Maybe<PassThemeOption> => settings?.theme;
export const selectClipboardTTL = ({ settings }: State) => settings.clipboard?.timeoutMs;
export const selectAliasTrashAcknowledged = ({ settings }: State) => settings.aliasTrashAcknowledged;
export const selectAutofillSettings = ({ settings }: State) => settings.autofill;
export const selectPendingBrowserAutofill = ({ settings }: State) => settings.pendingBrowserAutofill;
export const selectSyncStrategy = ({ settings }: State) => settings.syncStrategy;

export const selectOfflineEnabled = ({ settings }: State) => settings.offlineEnabled ?? false;
export const selectExtraPasswordEnabled = ({ settings }: State) => settings.extraPassword ?? false;

export const selectLockTTL = ({ settings }: State): Maybe<number> => settings.lockTTL;
export const selectLockMode = ({ settings }: State) => settings.lockMode ?? LockMode.NONE;
export const selectLockEnabled = pipe(selectLockMode, (mode) => mode !== LockMode.NONE);
export const selectLockSetupRequired = createSelector([selectLockMode, selectOrganizationSettings], (lockMode, orgSettings) =>
    Boolean(orgSettings?.ForceLockSeconds && orgSettings.ForceLockSeconds > 0 && lockMode === LockMode.NONE)
);

export const selectSanitizedLockTTL = createSelector(
    [selectLockTTL, selectOrganizationSettings],
    (ttl, orgSettings) => orgSettings?.ForceLockSeconds ?? ttl ?? DEFAULT_LOCK_TTL
);
