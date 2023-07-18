import type { ActiveSessionData } from '@proton/components/containers/app/SSOForkProducer';
import { SSOType } from '@proton/components/containers/app/SSOForkProducer';
import { getIsPassApp, getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import { APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import { stringifySearchParams } from '@proton/shared/lib/helpers/url';

export const getSignupUrl = (forkState: ActiveSessionData | undefined, app: APP_NAMES | undefined) => {
    const { path, params } = (() => {
        if (forkState?.type === SSOType.OAuth) {
            return { path: SSO_PATHS.SIGNUP, params: {} };
        }

        if (forkState?.type === SSOType.Proton) {
            const params = { plan: forkState.payload.plan || undefined };

            if (getIsPassApp(forkState.payload.app)) {
                return { path: SSO_PATHS.PASS_SIGNUP, params };
            }

            if (getIsVPNApp(forkState.payload.app)) {
                return { path: SSO_PATHS.VPN_SIGNUP, params };
            }

            return { path: SSO_PATHS.SIGNUP, params };
        }

        if (getIsPassApp(app)) {
            return { path: SSO_PATHS.PASS_SIGNUP, params: {} };
        }

        if (getIsVPNApp(app)) {
            return { path: SSO_PATHS.VPN_SIGNUP, params: {} };
        }

        return { path: SSO_PATHS.SIGNUP, params: {} };
    })();

    return `${path}${stringifySearchParams(params, '?')}`;
};
