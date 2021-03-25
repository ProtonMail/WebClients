import React, { useRef } from 'react';
import { c } from 'ttag';

import { generateProtonWebUID } from 'proton-shared/lib/helpers/uid';

import useModals from './useModals';
import useNotifications from './useNotifications';

import { OAUTH_PROVIDER } from '../containers/import/interfaces';
import ImportMailModal from '../containers/import/modals/ImportMailModal';

export interface OAuthHookContext {
    getRedirectURL: () => string;
    getAuthorizationUrl: () => string;
}

const WINDOW_WIDTH = 500;
const WINDOW_HEIGHT = 600;

const INTERVAL = 100;

const useOAuth = ({ getRedirectURL, getAuthorizationUrl }: OAuthHookContext) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const stateId = useRef<string>();

    const triggerOAuthPopup = (provider: OAUTH_PROVIDER) => {
        let interval: number;
        const redirectURI = getRedirectURL();

        const uid = generateProtonWebUID();
        stateId.current = uid;

        const authWindow = window.open(
            `${getAuthorizationUrl()}&state=${uid}`,
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

                        createModal(<ImportMailModal oauthProps={{ code, provider, redirectURI }} />);
                    }
                } catch (err) {
                    // silent error
                }
            }, INTERVAL);
        }
    };

    return { triggerOAuthPopup };
};

export default useOAuth;
