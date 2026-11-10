import { useCallback, useEffect, useRef, useState } from 'react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { useAwaitingTouch } from './useAwaitingTouch';

export type Fido2ActionContext = 'auth' | 'registration';

const SENTRY_MESSAGE: Record<Fido2ActionContext, string> = {
    auth: 'Security key auth',
    registration: 'Security key registration',
};

const reportFido2Error = (error: unknown, context: Fido2ActionContext, durationMs: number) => {
    const name = error instanceof Error ? error.name : 'unknown';
    // Browsers merge cancels, timeouts and missing keys into NotAllowedError, timing separates refused requests
    const timing = durationMs < 2000 ? 'instant' : 'user';
    const extension = error instanceof Error && /-extension:\/\/|webkit-masked-url:\/\//.test(error.stack || '');
    captureMessage(SENTRY_MESSAGE[context], {
        level: 'error',
        fingerprint: [SENTRY_MESSAGE[context], name, timing],
        tags: { fido2Error: name, fido2Timing: timing, fido2Extension: extension },
        extra: { error, durationMs, hasFocus: document.hasFocus(), visibility: document.visibilityState },
    });
    // Purposefully logging the error for somewhat easier debugging
    // eslint-disable-next-line no-console
    console.error(error);
};

export const useFido2Action = () => {
    const [fidoError, setFidoError] = useState(false);
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

            try {
                setFidoError(false);
                startAwaitingTouch();
                return await fn(abortController.signal);
            } catch (error) {
                if (isCurrent()) {
                    setFidoError(true);
                    reportFido2Error(error, context, Date.now() - start);
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
