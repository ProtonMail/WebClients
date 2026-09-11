import { generateProtonWebUID } from '@proton/shared/lib/helpers/uid';

import { notifyDesktopOAuthPopupFinished, notifyDesktopOAuthPopupStarted } from '../helpers/oauthDesktopSession';

const WINDOW_WIDTH = 500;
const WINDOW_HEIGHT = 600;

const POLLING_INTERVAL = 50;

/**
 * Opens a provider's admin consent page in a popup and resolves once the admin is done with it,
 * either because it came back to `redirectUri`, because they closed it, or because the caller
 * aborted. Unlike `openOAuthPopup` this exchanges nothing / stores no tokens, so whether it
 * worked is answered only by the connectivity endpoint (which itself may be delayed depending on
 * how the end provider implements it).
 */
export const openAdminConsentPopup = async ({
    url,
    redirectUri,
    signal,
}: {
    url: string;
    redirectUri: string;
    signal?: AbortSignal;
}): Promise<void> => {
    if (signal?.aborted) {
        return;
    }

    const sessionId = generateProtonWebUID();

    // Let the desktop (Electron) app know an OAuth-style popup is opening so
    // it renders it as a native window rather than the system browser
    await notifyDesktopOAuthPopupStarted(url, sessionId);

    if (signal?.aborted) {
        // Lost interest during the up-to-5s IPC wait: don't open a popup, and balance `Started` above.
        void notifyDesktopOAuthPopupFinished(sessionId);
        return;
    }

    return new Promise((resolve) => {
        const consentWindow = window.open(
            url,
            'adminConsentPopup',
            `height=${WINDOW_HEIGHT},width=${WINDOW_WIDTH},top=${window.screen.height / 2 - WINDOW_HEIGHT / 2},left=${
                window.screen.width / 2 - WINDOW_WIDTH / 2
            }`
        );

        if (!consentWindow) {
            void notifyDesktopOAuthPopupFinished(sessionId);
            resolve();
            return;
        }

        consentWindow.focus();

        let interval: number;

        const listenerCleanup = new AbortController();

        const finish = () => {
            window.clearInterval(interval);
            listenerCleanup.abort();
            void notifyDesktopOAuthPopupFinished(sessionId);
            resolve();
        };

        signal?.addEventListener(
            'abort',
            () => {
                consentWindow.close();
                finish();
            },
            { once: true, signal: listenerCleanup.signal }
        );

        interval = window.setInterval(() => {
            if (consentWindow.closed) {
                return finish();
            }

            try {
                if (!consentWindow.location.href.startsWith(redirectUri)) {
                    return;
                }
            } catch {
                // Throws while the popup is still on the provider's origin
                return;
            }

            consentWindow.close();
            finish();
        }, POLLING_INTERVAL);
    });
};
