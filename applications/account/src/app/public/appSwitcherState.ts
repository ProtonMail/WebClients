import { getAvailableAppsForUser, getAvailableAppsWithTiers } from '@proton/account/availableApps/apps';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { getOrganization, getOrganizationSettings } from '@proton/shared/lib/organization/api';

import type { AuthSession } from '../content/authSession';
import { extraThunkArguments } from '../store/public-thunk';
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
    const user = session.data.User;
    const [organization, settings] = await Promise.all([
        // For its name and plan
        user.Subscribed ? getOrganization({ api }).catch(() => undefined) : undefined,
        // For its allowed products, which restrict the apps
        user.Subscribed ? getOrganizationSettings({ api }) : undefined,
    ]);
    const apps = getAvailableAppsForUser({
        user,
        unleashClient: extraThunkArguments.unleashClient,
        organization: settings && { Settings: settings },
    });
    return {
        session: { ...session, data: { ...session.data, Organization: organization } },
        availableApps: getAvailableAppsWithTiers({ apps, user, organization }),
        error,
    };
};
