import { useCallback, useEffect, useRef, useState } from 'react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { useAwaitingTouch } from './useAwaitingTouch';

export type Fido2ActionContext = 'auth' | 'registration';

const SENTRY_MESSAGE: Record<Fido2ActionContext, string> = {
    auth: 'Security key auth',
    registration: 'Security key registration',
};

const getFido2ErrorName = (error: unknown) => (error instanceof Error ? error.name : 'unknown');

const reportFido2Error = (
    error: unknown,
    context: Fido2ActionContext,
    durationMs: number,
    hasFocusAtStart: boolean
) => {
    const name = getFido2ErrorName(error);
    // Browsers merge cancels, timeouts and missing keys into NotAllowedError, timing separates refused requests
    const timing = durationMs < 1000 ? 'instant' : 'user';
    const extension =
        error instanceof Error &&
        (/-extension:\/\/|webkit-masked-url:\/\//.test(error.stack || '') ||
            // Chrome's extension messaging errors have no extension URL in their stack
            /Receiving end does not exist|message channel closed/.test(error.message));
    // Cancelled or timed out registrations are measured by the backend's fido2_registration_* metrics instead
    const isRegistrationCancel = context === 'registration' && name === 'NotAllowedError' && timing === 'user';
    if (!isRegistrationCancel) {
        captureMessage(SENTRY_MESSAGE[context], {
            level: 'error',
            // Password manager extensions throw plain errors too, keep them apart from ours
            fingerprint: [SENTRY_MESSAGE[context], extension ? 'extension' : name, timing],
            tags: { fido2Error: name, fido2Timing: timing, fido2Extension: extension },
            extra: { error, durationMs, hasFocusAtStart, visibility: document.visibilityState },
        });
    }
    // Purposefully logging the error for somewhat easier debugging
    // eslint-disable-next-line no-console
    console.error(error);
};

export const useFido2Action = () => {
    // Name of the last error, e.g. NotAllowedError
    const [fidoError, setFidoError] = useState<string | null>(null);
    const { awaitingTouch, startAwaitingTouch, stopAwaitingTouch } = useAwaitingTouch();
    const abortControllerRef = useRef<AbortController | null>(null);

    const abort = useCallback(() => {
        const aborted = Boolean(abortControllerRef.current);
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        return aborted;
    }, []);

    useEffect(() => {
        return () => {
            abort();
        };
    }, []);

    const runFido2Action = useCallback(
        async <T>(fn: (signal: AbortSignal) => Promise<T>, context: Fido2ActionContext): Promise<T> => {
            abort();
            const abortController = new AbortController();
            abortControllerRef.current = abortController;
            const isCurrent = () => abortControllerRef.current === abortController;
            const start = Date.now();
            // The browser's security key prompt takes focus, so read it before the prompt opens
            const hasFocusAtStart = document.hasFocus();

            try {
                setFidoError(null);
                startAwaitingTouch();
                return await fn(abortController.signal);
            } catch (error) {
                if (isCurrent()) {
                    setFidoError(getFido2ErrorName(error));
                    reportFido2Error(error, context, Date.now() - start, hasFocusAtStart);
                }
                throw error;
            } finally {
                if (isCurrent()) {
                    stopAwaitingTouch();
                    abortControllerRef.current = null;
                }
                // It's important that it's aborted after failure/success so that extensions (LastPass) function correctly
                // without a `OperationError: A request is already pending.`.
                abortController.abort();
            }
        },
        [abort, startAwaitingTouch, stopAwaitingTouch]
    );

    return { fidoError, awaitingTouch, runFido2Action, abort };
};
