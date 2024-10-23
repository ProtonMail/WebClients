import { MINUTE } from '@proton/shared/lib/constants';
import { getHostname } from '@proton/shared/lib/helpers/url';

export class ExternalSSOError extends Error {}

export const handleExternalSSOLogin = ({
    token,
    signal,
    finalRedirectBaseUrl,
}: {
    token: string;
    signal: AbortSignal;
    finalRedirectBaseUrl?: string;
}) => {
    if (!token) {
        throw new Error('Unexpected response');
    }

    const url = new URL(`${window.location.origin}/api/auth/sso/${token}`);

    if (finalRedirectBaseUrl) {
        url.searchParams.set('FinalRedirectBaseUrl', finalRedirectBaseUrl);
    }

    const handleMessage = (event: MessageEvent) => {
        if (event.data.action === 'sso' && event.data.payload) {
            const uid: string = event.data.payload.uid;
            const token: string = event.data.payload.token;
            return {
                action: 'resolve' as const,
                payload: { uid, token },
            };
        }
    };

    const tab = window.open(url);

    if (!tab) {
        throw new ExternalSSOError('Unable to open tab');
    }

    return new Promise<{ uid: string; token: string }>((resolve, reject) => {
        let openHandle: ReturnType<typeof setInterval> | undefined = undefined;
        let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
        let reset: () => void;

        const assertOpen = () => {
            if (!tab || tab.closed) {
                reset();
                reject(new ExternalSSOError('Process closed'));
            }
        };

        const onMessage = (event: MessageEvent) => {
            if (event.source !== tab && getHostname(event.origin) !== window.location.origin) {
                return;
            }

            const result = handleMessage(event);
            if (!result) {
                return;
            }

            if (result.action === 'resolve') {
                resolve(result.payload);
            } else if (result.action === 'reject') {
                reject(result.payload);
            }

            reset();
            tab?.close?.();
        };

        const abort = () => {
            reset();
            tab?.close?.();
            reject(new ExternalSSOError('Process aborted'));
        };

        reset = () => {
            clearTimeout(timeoutHandle);
            clearInterval(openHandle);
            window.removeEventListener('message', onMessage, false);
            signal.removeEventListener('abort', abort);
        };

        signal.addEventListener('abort', abort);
        window.addEventListener('message', onMessage, false);
        openHandle = setInterval(() => {
            assertOpen();
        }, 2500);
        timeoutHandle = setTimeout(() => {
            abort();
        }, 10 * MINUTE);
    });
};
