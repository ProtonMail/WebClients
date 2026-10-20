import { useEffect, useRef, useState } from 'react';

import type { LumoAgentItem } from '@proton/llm/lib/lumoAgent/ui/types';

import { findLastAppliedTrashId } from './catActivity';
import { SWEEP_MS } from './catSpriteManifest';

/** True while the cat sweeps envelopes off its table, once per trash applied after mount. */
export const useTrashSweep = (items: LumoAgentItem[]) => {
    const appliedTrashId = findLastAppliedTrashId(items);
    const [isSweeping, setIsSweeping] = useState(false);
    const seenTrashIdRef = useRef(appliedTrashId);

    useEffect(() => {
        const isNewTrash = appliedTrashId !== undefined && appliedTrashId !== seenTrashIdRef.current;
        seenTrashIdRef.current = appliedTrashId;

        if (!isNewTrash) {
            setIsSweeping(false);
            return;
        }

        setIsSweeping(true);
        const timeout = window.setTimeout(() => setIsSweeping(false), SWEEP_MS);
        return () => window.clearTimeout(timeout);
    }, [appliedTrashId]);

    return isSweeping;
};
