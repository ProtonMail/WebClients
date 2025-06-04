import { c } from 'ttag';

import { getProviderNumber } from '@proton/activation/src/hooks/useOAuthPopup.helpers';
import type { ImportProvider, OAUTH_PROVIDER } from '@proton/activation/src/interface';
import useNotifications from '@proton/components/hooks/useNotifications';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';

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

export const openOAuthPopup = async ({
    provider,
    authorizationUrl,
    redirectUri,
    errorMessage,
    callback,
}: {
    provider: ImportProvider | OAUTH_PROVIDER;
    authorizationUrl: string;
    redirectUri: string;
    errorMessage: string;
    callback: (oauthProps: any) => void | Promise<void>;
}) => {
    let interval: number;

    const uid = generateProtonWebUID();

    await invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupStarted' });

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
        interval = window.setInterval(async () => {
            if (authWindow.closed) {
                await invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupFinished' });
                window.clearInterval(interval);
                return;
            }

            try {
                const url = new URL(authWindow.document.URL);
                const params = new URLSearchParams(url.search);

                if (authWindow.document.URL.startsWith(redirectUri)) {
                    authWindow.close();

                    const error = params.get('error');

                    if (error) {
                        return CreateAuthCancelledError(errorMessage);
                    }

                    const state = params.get('state');

                    // State passthrough mismatch error
                    if (state !== uid) {
                        return CreateAuthError(errorMessage);
                    }

                    const Code = params.get('code');
                    if (!Code) {
                        return;
                    }

                    const providerNum = getProviderNumber(provider);
                    void callback({ Code, Provider: providerNum, RedirectUri: redirectUri });
                }
            } catch (err: any) {
                // silent error
            }
        }, POLLING_INTERVAL);
    }
};
