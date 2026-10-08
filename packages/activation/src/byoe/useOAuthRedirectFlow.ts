import { useState } from 'react';

import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';

import { generateGoogleOAuthUrl, getOAuthRedirectURL } from '../hooks/useOAuthPopup.helpers';
import { type EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '../interface';
import {
    type OAuthCallbackResult,
    type OAuthRedirectState,
    readOAuthCallback,
    removeOAuthCallbackParams,
    storeOAuthRedirectState,
} from './useOAuthRedirectFlow.helpers';

// The provider's params are removed from the URL as soon as they are read, so that a reload cannot submit the same code twice.
const readCallbackFromUrl = (): OAuthCallbackResult => {
    const url = new URL(window.location.href);
    const result = readOAuthCallback(url.searchParams);

    if (result.type !== 'none') {
        window.history.replaceState(null, '', removeOAuthCallbackParams(url).toString());
    }

    return result;
};

interface Props {
    features: EASY_SWITCH_FEATURES[];
    /**
     * Path the provider sends the user back to, in place of the default (empty) `/oauth/callback` page.
     * It must be allowlisted on the provider's OAuth client.
     */
    redirectPath: string;
}

export const useOAuthRedirectFlow = ({ features, redirectPath }: Props) => {
    // Read once on mount: the URL is cleaned right away, so a later read would look like a fresh entry
    const [callback] = useState(readCallbackFromUrl);

    const redirectUri = getOAuthRedirectURL(OAUTH_PROVIDER.GOOGLE, redirectPath);

    const startOAuthFlow = (payload: Omit<OAuthRedirectState, 'uid'>) => {
        const uid = generateProtonWebUID();
        storeOAuthRedirectState({ uid, ...payload });

        const authorizationUrl = new URL(generateGoogleOAuthUrl({ features, redirectUri }));
        authorizationUrl.searchParams.set('state', uid);
        replaceUrl(authorizationUrl.toString());
    };

    return { startOAuthFlow, callback, redirectUri };
};
