import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';

import type { LoginCompleteState } from './interface';

export const handleRedirectLogin = async ({
    authentication,
    result,
}: {
    authentication: AuthenticationStore;
    result: LoginCompleteState;
}) => {
    const url = result.payload.url;

    if (url.hostname === window.location.hostname || authentication.mode !== 'sso') {
        const pathWithBasename = authentication.login({
            ...result.payload.session,
            path: getPathFromLocation(url),
        });
        replaceUrl(pathWithBasename);
        return;
    }

    replaceUrl(url.toString());
};
