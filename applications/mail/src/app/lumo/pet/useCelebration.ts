import { useEffect, useRef, useState } from 'react';

import { LumoChainEnd } from '@proton/llm/lib/lumoAgent/ui/types';

const CELEBRATION_MS = 2000;

/** True for a moment after Lumo finishes a turn with a reply, not after a stop, cancel or failure. */
export const useCelebration = (isBusy: boolean, lastChainEnd: LumoChainEnd | null) => {
    const [isCelebrating, setIsCelebrating] = useState(false);
    const wasBusyRef = useRef(isBusy);

    useEffect(() => {
        const hasSucceeded = wasBusyRef.current && !isBusy && lastChainEnd === LumoChainEnd.SUCCEEDED;
        wasBusyRef.current = isBusy;

        if (!hasSucceeded) {
            setIsCelebrating(false);
            return;
        }

        setIsCelebrating(true);
        const timeout = window.setTimeout(() => setIsCelebrating(false), CELEBRATION_MS);
        return () => window.clearTimeout(timeout);
    }, [isBusy, lastChainEnd]);

    return isCelebrating;
};
