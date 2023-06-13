import { isEmptyString } from '@proton/pass/utils/string';
import { omit } from '@proton/shared/lib/helpers/object';

import type { ProxiedSettings } from '../reducers/settings';
import type { State } from '../types';

export const selectProxiedSettings = ({ settings }: State): ProxiedSettings =>
    omit(settings, ['sessionLockTTL', 'sessionLockToken']);

export const selectCanLoadDomainImages = ({ settings }: State) => settings.loadDomainImages;

export const selectSessionLockToken = ({ settings }: State) => settings.sessionLockToken ?? undefined;

export const selectCanLockSession = (state: State) => {
    const sessionLockToken = selectSessionLockToken(state);
    return sessionLockToken !== undefined && !isEmptyString(sessionLockToken);
};
export const selectSessionLockSettings = ({ settings }: State) => ({
    sessionLockToken: settings.sessionLockToken,
    sessionLockTTL: settings.sessionLockTTL,
});
