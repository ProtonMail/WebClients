import { useCallback, useEffect, useRef } from 'react';

const OPERATION_IN_PROGRESS_MESSAGE = 'Another operation is already in progress';

export const useAbortController = () => {
    const abortControllerRef = useRef<AbortController | null>(null);

    const ensureAbortController = useCallback((): AbortController => {
        if (abortControllerRef.current) {
            throw new Error(OPERATION_IN_PROGRESS_MESSAGE);
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        return abortController;
    }, []);

    const clearAbortController = useCallback(() => {
        abortControllerRef.current = null;
    }, []);

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const isOperationInProgress = useCallback(() => {
        return !!abortControllerRef.current;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        ensureAbortController,
        clearAbortController,
        abort,
        isOperationInProgress,
        abortControllerRef,
    };
};
