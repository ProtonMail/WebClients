import { useRef } from 'react';
import { c } from 'ttag';

import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';
import { OAuthProps, OAUTH_PROVIDER } from '@proton/shared/lib/interfaces/EasySwitch';

import useNotifications from './useNotifications';

import { G_OAUTH_REDIRECT_PATH } from '../containers/easySwitch/constants';

const WINDOW_WIDTH = 500;
const WINDOW_HEIGHT = 600;

const POLLING_INTERVAL = 100;

const getOAuthRedirectURL = () => {
    const { protocol, host } = window.location;
    return `${protocol}//${host}${G_OAUTH_REDIRECT_PATH}`;
};

export const getOAuthAuthorizationUrl = ({
    scope,
    clientID,
    loginHint,
}: {
    scope: string;
    clientID: string;
    loginHint?: string;
}) => {
    const params = new URLSearchParams();

    params.append('redirect_uri', getOAuthRedirectURL());
    params.append('response_type', 'code');
    params.append('access_type', 'offline');
    params.append('client_id', clientID);
    params.append('scope', scope);
    params.append('prompt', 'consent');

    if (loginHint) {
        params.append('login_hint', loginHint);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const useOAuthPopup = () => {
    const { createNotification } = useNotifications();
    const stateId = useRef<string>();

    const triggerOAuthPopup = ({
        provider,
        scope,
        clientID,
        loginHint,
        callback,
    }: {
        provider: OAUTH_PROVIDER;
        scope: string;
        clientID: string;
        loginHint?: string;
        callback: (oauthProps: OAuthProps) => void | Promise<void>;
    }) => {
        let interval: number;
        const authorizationUrl = getOAuthAuthorizationUrl({ scope, clientID, loginHint });
        const RedirectUri = getOAuthRedirectURL();

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

                    if (authWindow.document.URL.startsWith(RedirectUri)) {
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

                        const Code = params.get('code');

                        if (!Code) {
                            return;
                        }

                        void callback({ Code, Provider: provider, RedirectUri });
                    }
                } catch (err: any) {
                    // silent error
                }
            }, POLLING_INTERVAL);
        }
    };

    return { triggerOAuthPopup };
};

export default useOAuthPopup;
