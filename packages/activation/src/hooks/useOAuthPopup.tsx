import { useRef } from 'react';

import { c } from 'ttag';

import type { ImportProvider } from '@proton/activation/src/interface';
import useApiEnvironmentConfig from '@proton/components/hooks/useApiEnvironmentConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';
import { useFlag } from '@proton/unleash';

import { getOAuthAuthorizationUrl, getOAuthRedirectURL, getProviderNumber } from './useOAuthPopup.helpers';

const WINDOW_WIDTH = 500;
const WINDOW_HEIGHT = 600;

const POLLING_INTERVAL = 100;

const CreateAuthCancelledError = (errorMessage: string) => {
    const { createNotification } = useNotifications();

    createNotification({
        text: (
            <div className="text-center">
                {c('Error').t`Authentication canceled.`}
                <br />
                {errorMessage}
            </div>
        ),
        type: 'error',
    });
};
const CreateAuthError = (errorMessage: string) => {
    const { createNotification } = useNotifications();

    createNotification({
        text: (
            <div className="text-center">
                {c('Error').t`Authentication error.`}
                <br />
                {errorMessage}
            </div>
        ),
        type: 'error',
    });
};

interface Props {
    errorMessage: string;
}

const useOAuthPopup = ({ errorMessage }: Props) => {
    const [config, loadingConfig] = useApiEnvironmentConfig();
    const stateId = useRef<string>();

    // We need to investigage Outlook b2b oAuth modal params
    const consentExperiment = useFlag('EasySwitchConsentExperiment');

    const triggerOAuthPopup = ({
        provider,
        scope,
        loginHint,
        callback,
    }: {
        provider: ImportProvider;
        scope: string;
        loginHint?: string;
        // TODO properly type this
        callback: (oauthProps: any) => void | Promise<void>;
    }) => {
        if (!config) {
            return;
        }
        let interval: number;
        const authorizationUrl = getOAuthAuthorizationUrl({ provider, scope, config, loginHint, consentExperiment });
        const RedirectUri = getOAuthRedirectURL(provider);

        const uid = generateProtonWebUID();
        stateId.current = uid;

        invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupStarted' });

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
                    invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupFinished' });
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
                            return CreateAuthCancelledError(errorMessage);
                        }

                        const state = params.get('state');

                        // State passthrough mismatch error
                        if (state !== stateId.current) {
                            return CreateAuthError(errorMessage);
                        }

                        const Code = params.get('code');
                        if (!Code) {
                            return;
                        }

                        const providerNum = getProviderNumber(provider);
                        void callback({ Code, Provider: providerNum, RedirectUri });
                    }
                } catch (err: any) {
                    // silent error
                }
            }, POLLING_INTERVAL);
        }
    };

    return { triggerOAuthPopup, loadingConfig };
};

export default useOAuthPopup;
