import { queryAvailableAppsWithTiers, unauthenticatedApps } from '@proton/account/availableApps/apps';
import { getForbiddenApps } from '@proton/shared/lib/apps/apps';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { getOrganization } from '@proton/shared/lib/organization/api';

import type { AuthSession } from '../authSession';
import type { AppSwitcherState } from './AppSwitcherContainer';

/** `api` must be bound to the session's UID */
export const getAppSwitcherState = async ({
    session,
    api,
    error,
}: {
    session: AuthSession;
    api: Api;
    error?: AppSwitcherState['error'];
}): Promise<AppSwitcherState> => {
    const [organization, availableApps] = await Promise.all([
        // Only for its name, so its settings aren't needed
        session.data.User.Subscribed ? getOrganization({ api }).catch(() => undefined) : undefined,
        // Rather than blocking sign in, list the apps anyone sees. Forking to one the user can't access lands back
        // here with an unsupported app error.
        queryAvailableAppsWithTiers({ api, user: session.data.User }).catch(() => {
            // Without the forbidden apps, which the app switcher shows disabled
            const forbiddenApps = getForbiddenApps(session.data.User);
            return unauthenticatedApps.filter((app) => !forbiddenApps.has(app)).map((app) => ({ app, tier: null }));
        }),
    ]);
    return {
        session: { ...session, data: { ...session.data, Organization: organization } },
        availableApps,
        error,
    };
};
