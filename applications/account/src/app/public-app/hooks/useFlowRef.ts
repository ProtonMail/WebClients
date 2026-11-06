import { useRef } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';

/**
 * Tracks async flows so you can ignore stale results. Call at flow start to get a validator;
 * after await, call the validator and only proceed if it returns true (mounted + still current flow).
 * Returned function has `.reset()` to clear the current flow.
 *
 * @example
 * const createFlow = useFlowRef();
 * const validateFlow = createFlow();
 * const result = await someAsyncAction();
 * if (validateFlow()) handleResult(result);
 */
export const useFlowRef = () => {
    const flow = useRef({});
    const mounted = useIsMounted();

    /** Starts a new flow; returns a validator that is true iff still mounted and this flow is still current. */
    const startFlow = () => {
        const start = (flow.current = {});
        return () => {
            return mounted() && start === flow.current;
        };
    };

    startFlow.reset = () => {
        flow.current = {};
    };

    return startFlow;
};
