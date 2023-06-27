import type { ActiveSessionData } from '@proton/components/containers/app/SSOForkProducer';
import { SSOType } from '@proton/components/containers/app/SSOForkProducer';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { stringifySearchParams } from '@proton/shared/lib/helpers/url';

export const getSignupUrl = (forkState: ActiveSessionData | undefined) => {
    const { path, params } = (() => {
        if (forkState?.type === SSOType.OAuth) {
            return { path: SSO_PATHS.SIGNUP, params: {} };
        }

        if (forkState?.type === SSOType.Proton) {
            const params = { plan: forkState.payload.plan || undefined };
            if (
                [APPS.PROTONPASS, APPS.PROTONEXTENSION, APPS.PROTONPASSBROWSEREXTENSION].includes(
                    forkState.payload.app as any
                )
            ) {
                return { path: SSO_PATHS.PASS_SIGNUP, params };
            }

            return { path: SSO_PATHS.SIGNUP, params };
        }

        return { path: SSO_PATHS.SIGNUP, params: {} };
    })();

    return `${path}${stringifySearchParams(params, '?')}`;
};
