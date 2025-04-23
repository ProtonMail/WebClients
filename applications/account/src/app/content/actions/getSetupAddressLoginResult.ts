import type { AuthSession } from '@proton/components/containers/login/interface';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, type APP_NAMES, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';

import type { LoginResult } from './interface';

export const getSetupAddressLoginResult = ({
    blob,
    session,
    app,
    from = 'switch',
}: {
    blob?: string;
    session: AuthSession;
    app: APP_NAMES;
    from?: string;
}): LoginResult => {
    const url = new URL(getAppHref(SETUP_ADDRESS_PATH, APPS.PROTONACCOUNT, session.data.localID));
    url.searchParams.set('to', app);
    url.searchParams.set('from', from);
    if (blob) {
        url.hash = blob;
    }
    return {
        type: 'done',
        payload: {
            session,
            url,
        },
    };
};
