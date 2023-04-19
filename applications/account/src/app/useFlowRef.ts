import { useRef } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';

export const useFlowRef = () => {
    const flow = useRef({});
    const mounted = useIsMounted();

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
