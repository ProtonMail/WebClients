import { createSelector } from '@reduxjs/toolkit';

import { omit } from '@proton/shared/lib/helpers/object';

import type { Maybe } from '../../types';
import type { DisallowedDomains } from '../../types/worker/settings';
import type { State } from '../types';
import { selectState } from './utils';

export const selectProxiedSettings = createSelector(selectState, ({ settings }: State) =>
    omit(settings, ['sessionLockTTL', 'sessionLockRegistered'])
);

export const selectCanLoadDomainImages = ({ settings }: State) => settings.loadDomainImages;

export const selectSessionLockSettings = createSelector(selectState, ({ settings }: State) => ({
    sessionLockRegistered: settings.sessionLockRegistered,
    sessionLockTTL: settings.sessionLockTTL,
}));

export const selectHasRegisteredLock = (state: State) => state.settings.sessionLockRegistered;
export const selectSessionLockTTL = ({ settings }: State): Maybe<number> => settings.sessionLockTTL;
export const selectDisallowedDomains = ({ settings }: State): DisallowedDomains => settings.disallowedDomains;
