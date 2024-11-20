import type { AuthSession } from '@proton/components/containers/login/interface';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { joinPaths } from '@proton/shared/lib/helpers/url';

import type { LocalRedirect } from '../localRedirect';

export const getLocalRedirect = ({
    localRedirect: maybeLocalRedirect,
    session,
    toApp,
}: {
    localRedirect?: LocalRedirect;
    session: AuthSession;
    toApp: APP_NAMES;
}): LocalRedirect | undefined => {
    // Handle special case going for internal vpn on account settings.
    if (maybeLocalRedirect) {
        if (maybeLocalRedirect.toApp) {
            return maybeLocalRedirect;
        }
        return {
            path: joinPaths(getSlugFromApp(toApp), maybeLocalRedirect.path),
            toApp: toApp,
        };
    }
    if (toApp === APPS.PROTONVPN_SETTINGS) {
        const path = session.flow === 'signup' ? '/vpn-apps?prompt=true' : '/';
        return {
            path: joinPaths(getSlugFromApp(toApp), path),
            toApp: toApp,
        };
    }
};
