import { useState } from 'react';

import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';

import { generateGoogleOAuthUrl, getOAuthRedirectURL } from '../hooks/useOAuthPopup.helpers';
import { type EASY_SWITCH_FEATURES, OAUTH_PROVIDER } from '../interface';

const STORAGE_KEY = 'proton:oauth-redirect-state';
const CALLBACK_PARAMS = ['code', 'error', 'state', 'scope', 'authuser', 'prompt', 'hd'];

interface OAuthRedirectState {
    /** Compared against the `state` returned by the provider, to make sure we started this authorization. */
    uid: string;
    /** Whether the user asked to import their existing emails. */
    importEmails: boolean;
    /** Where to send the user once the flow is done. Not validated here. */
    redirect?: string;
}

type OAuthCallbackResult =
    { type: 'none' } | { type: 'error' } | { type: 'code'; code: string; state: OAuthRedirectState };

const readOAuthRedirectState = (): OAuthRedirectState | undefined => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const parsed: Partial<Record<keyof OAuthRedirectState, unknown>> | null = raw ? JSON.parse(raw) : null;

        if (typeof parsed?.uid !== 'string' || typeof parsed.importEmails !== 'boolean') {
            return;
        }

        return {
            uid: parsed.uid,
            importEmails: parsed.importEmails,
            redirect: typeof parsed.redirect === 'string' ? parsed.redirect : undefined,
        };
    } catch {
        return;
    }
};

export const clearOAuthRedirectState = () => {
    sessionStorage.removeItem(STORAGE_KEY);
};

/**
 * Reads the provider's callback from the URL. `none` is an ordinary page load. A callback is `error` when the user
 * declined or when `state` does not match the one stored before leaving. The stored state is single use: it is
 * removed as soon as a callback is read.
 */
export const readOAuthCallback = (searchParams: URLSearchParams): OAuthCallbackResult => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (!code && !error) {
        return { type: 'none' };
    }

    const stored = readOAuthRedirectState();
    clearOAuthRedirectState();

    if (error || !code || !stored || stored.uid !== searchParams.get('state')) {
        return { type: 'error' };
    }

    return { type: 'code', code, state: stored };
};

// The provider's params are removed from the URL as soon as they are read, so that a reload cannot submit the same code twice.
const readCallbackFromUrl = (): OAuthCallbackResult => {
    const url = new URL(window.location.href);
    const result = readOAuthCallback(url.searchParams);

    if (result.type !== 'none') {
        CALLBACK_PARAMS.forEach((param) => url.searchParams.delete(param));
        window.history.replaceState(null, '', url.toString());
    }

    return result;
};

export const storeOAuthRedirectState = (state: OAuthRedirectState) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
