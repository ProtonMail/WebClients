import type { AuthSession } from '@proton/components/containers/login/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { AppSwitcherState } from '../../public/AppSwitcherContainer';
import { getOrganization } from '../../public/organization';
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
    const organization = await getOrganization({ session, api }).catch(noop);
    const appSwitcherState: AppSwitcherState = {
        session: { ...session, data: { ...session.data, Organization: organization } },
        error: {
            type: 'unsupported-app',
            app,
        },
    };
    return {
        type: 'app-switcher',
        location: paths.appSwitcher,
        payload: appSwitcherState,
    };
};
