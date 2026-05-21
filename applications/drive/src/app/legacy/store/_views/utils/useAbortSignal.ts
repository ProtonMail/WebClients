import { useEffect, useRef } from 'react';

/**
 * useAbortSignal returns signal which is aborted when `dependencies` changes.
 */
export default function useAbortSignal(dependencies?: any[]) {
    const abortController = useRef(new AbortController());

    useEffect(() => {
        return () => {
            abortController.current.abort();
            abortController.current = new AbortController();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    return abortController.current.signal;
}
