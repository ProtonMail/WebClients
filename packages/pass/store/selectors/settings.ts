import { createSelector } from '@reduxjs/toolkit';

import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { EXCLUDED_SETTINGS_KEYS } from '@proton/pass/store/reducers/settings';
import type { State } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import type { DomainCriterias } from '@proton/pass/types/worker/settings';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { omit } from '@proton/shared/lib/helpers/object';

import { selectState } from './utils';

export const selectProxiedSettings = createSelector(selectState, ({ settings }: State) =>
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
export const selectShowUsernameField = ({ settings }: State) => settings.showUsernameField;
