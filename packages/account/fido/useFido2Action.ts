import { useCallback, useEffect, useRef, useState } from 'react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { useAwaitingTouch } from './useAwaitingTouch';

export type Fido2ActionContext = 'auth' | 'registration';

const SENTRY_MESSAGE: Record<Fido2ActionContext, string> = {
    auth: 'Security key auth',
    registration: 'Security key registration',
};

const reportFido2Error = (error: unknown, context: Fido2ActionContext) => {
    captureMessage(SENTRY_MESSAGE[context], { level: 'error', extra: { error } });
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

            try {
                setFidoError(false);
                startAwaitingTouch();
                return await fn(abortController.signal);
            } catch (error) {
                if (isCurrent()) {
                    setFidoError(true);
                    reportFido2Error(error, context);
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
