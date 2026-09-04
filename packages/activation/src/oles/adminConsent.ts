const WINDOW_WIDTH = 500;
const WINDOW_HEIGHT = 600;

const POLLING_INTERVAL = 50;

/**
 * Opens a provider's admin consent page in a popup and resolves once the admin is done with it,
 * either because it came back to `redirectUri`, because they closed it, or because the caller
 * aborted through `signal` (in which case the popup is closed for them).
 *
 * Unlike `openOAuthPopup` this exchanges nothing and stores no token: consent is granted to our
 * app on the admin's tenant, so whether it worked is only ever answered by the connectivity
 * endpoint. Callers should verify regardless of how this resolves, unless it was aborted.
 */
export const openAdminConsentPopup = ({
    url,
    redirectUri,
    signal,
}: {
    url: string;
    redirectUri: string;
    signal?: AbortSignal;
}): Promise<void> =>
    new Promise((resolve) => {
        if (signal?.aborted) {
            resolve();
            return;
        }

        const consentWindow = window.open(
            url,
            'adminConsentPopup',
            `height=${WINDOW_HEIGHT},width=${WINDOW_WIDTH},top=${window.screen.height / 2 - WINDOW_HEIGHT / 2},left=${
                window.screen.width / 2 - WINDOW_WIDTH / 2
            }`
        );

        if (!consentWindow) {
            resolve();
            return;
        }

        consentWindow.focus();

        let interval: number;

        /** Drops our `abort` listener from the caller's signal once we're done with it */
        const listenerCleanup = new AbortController();

        const finish = () => {
            window.clearInterval(interval);
            listenerCleanup.abort();
            resolve();
        };

        signal?.addEventListener(
            'abort',
            () => {
                // The caller lost interest (e.g. the step unmounted): close the popup and stop polling
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
                // Throws while the popup is still on the provider's origin
                if (!consentWindow.location.href.startsWith(redirectUri)) {
                    return;
                }
            } catch {
                return;
            }

            consentWindow.close();
            finish();
        }, POLLING_INTERVAL);
    });
