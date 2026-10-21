import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { getAppSwitcherState } from '../../public/appSwitcherState';
import type { AuthSession } from '../authSession';
import type { Paths } from '../helper';
import type { LoginResult } from './interface';

export const getProductDisabledLoginResult = async ({
    app,
    session,
    api,
    paths,
}: {
    app: APP_NAMES;
    session: AuthSession;
    api: Api;
    paths: Paths;
    message?: string;
}): Promise<LoginResult> => {
    return {
        type: 'app-switcher',
        location: paths.appSwitcher,
        payload: await getAppSwitcherState({ session, api, error: { type: 'unsupported-app', app } }),
    };
};
