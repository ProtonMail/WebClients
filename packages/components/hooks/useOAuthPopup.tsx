import React, { useRef } from 'react';
import { c } from 'ttag';

import { generateProtonWebUID } from 'proton-shared/lib/helpers/uid';

import useNotifications from './useNotifications';

import { OAuthProps, OAUTH_PROVIDER } from '../containers/importAssistant/interfaces';
import { G_OAUTH_CLIENT_ID, G_OAUTH_REDIRECT_PATH } from '../containers/importAssistant/constants';

const WINDOW_WIDTH = 500;
const WINDOW_HEIGHT = 600;

const POLLING_INTERVAL = 100;

const getOAuthRedirectURL = () => {
    const { protocol, host } = window.location;
    return `${protocol}//${host}${G_OAUTH_REDIRECT_PATH}`;
};

export const getOAuthAuthorizationUrl = ({ scope, login_hint }: { scope: string; login_hint?: string }) => {
    const params = new URLSearchParams();

    params.append('redirect_uri', getOAuthRedirectURL());
    params.append('response_type', 'code');
    params.append('access_type', 'offline');
    params.append('client_id', G_OAUTH_CLIENT_ID);
    params.append('scope', scope);
    params.append('prompt', 'consent');

    if (login_hint) {
        params.append('login_hint', login_hint);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

interface OAuthHookContext {
    authorizationUrl: string;
}

const useOAuthPopup = ({ authorizationUrl }: OAuthHookContext) => {
    const { createNotification } = useNotifications();
    const stateId = useRef<string>();

    const triggerOAuthPopup = (
        provider: OAUTH_PROVIDER,
        callback: (oauthProps: OAuthProps) => void | Promise<void>
    ) => {
        let interval: number;
        const redirectURI = getOAuthRedirectURL();

        const uid = generateProtonWebUID();
        stateId.current = uid;

        const authWindow = window.open(
            `${authorizationUrl}&state=${uid}`,
            'oauthPopup',
            `height=${WINDOW_HEIGHT},width=${WINDOW_WIDTH},top=${window.screen.height / 2 - WINDOW_HEIGHT / 2},left=${
                window.screen.width / 2 - WINDOW_WIDTH / 2
            }`
        );

        if (authWindow) {
            authWindow.focus();

            /*
                To be changed by a proper callback URL that will
                communicate with this component via `window.postMessage()`
                We can then move the following logic to a `onmessage` listener
            */
            interval = window.setInterval(() => {
                if (authWindow.closed) {
                    window.clearInterval(interval);
                    return;
                }

                try {
                    const url = new URL(authWindow.document.URL);
                    const params = new URLSearchParams(url.search);

                    if (authWindow.document.URL.startsWith(redirectURI)) {
                        authWindow.close();

                        const error = params.get('error');

                        if (error) {
                            createNotification({
                                text: (
                                    <div className="text-center">
                                        {c('Error').t`Authentication canceled.`}
                                        <br />
                                        {c('Error').t`Your import will not be processed.`}
                                    </div>
                                ),
                                type: 'error',
                            });
                            return;
                        }

                        const state = params.get('state');

                        // State passthrough mismatch error
                        if (state !== stateId.current) {
                            createNotification({
                                text: (
                                    <div className="text-center">
                                        {c('Error').t`Authentication error.`}
                                        <br />
                                        {c('Error').t`Your import will not be processed.`}
                                    </div>
                                ),
                                type: 'error',
                            });
                            return;
                        }

                        const code = params.get('code');

                        if (!code) {
                            return;
                        }

                        void callback({ code, provider, redirectURI });
                    }
                } catch (err) {
                    // silent error
                }
            }, POLLING_INTERVAL);
        }
    };

    return { triggerOAuthPopup };
};

export default useOAuthPopup;
