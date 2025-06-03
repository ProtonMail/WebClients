import { getDefaultLocalID, getPersistedSessions } from 'proton-pass-web/lib/sessions';
import { settings } from 'proton-pass-web/lib/settings';

import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { authStore } from '@proton/pass/lib/auth/store';
import type { Maybe } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import noop from '@proton/utils/noop';

export const getThemeForLocalID = async (localID?: number): Promise<Maybe<PassThemeOption>> =>
    settings.read(localID).then(prop('theme')).catch(noop);

export const getTheme = async (): Promise<Maybe<PassThemeOption>> => {
    const localID = authStore.getLocalID() ?? getDefaultLocalID(getPersistedSessions());
    return getThemeForLocalID(localID);
};
