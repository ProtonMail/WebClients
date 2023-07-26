import { createSelector } from '@reduxjs/toolkit';

import { omit } from '@proton/shared/lib/helpers/object';

import type { Maybe } from '../../types';
import type { State } from '../types';
import { selectState } from './utils';

export const selectProxiedSettings = createSelector(selectState, ({ settings }: State) =>
    omit(settings, ['sessionLockTTL', 'sessionLockToken'])
);

export const selectCanLoadDomainImages = ({ settings }: State) => settings.loadDomainImages;

export const selectSessionLockToken = ({ settings }: State) => settings.sessionLockToken;

export const selectCanLockSession = (state: State) => Boolean(selectSessionLockToken(state));

export const selectSessionLockSettings = createSelector(selectState, ({ settings }: State) => ({
    sessionLockToken: settings.sessionLockToken,
    sessionLockTTL: settings.sessionLockTTL,
}));

export const selectSessionLockTTL = ({ settings }: State): Maybe<number> => settings.sessionLockTTL;
