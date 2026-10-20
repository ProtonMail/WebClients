import { useEffect, useRef, useState } from 'react';

import type { LumoAgentItem } from '@proton/llm/lib/lumoAgent/ui/types';

import { selectCatActivity } from './catActivity';
import type { CatActivity } from './catPose';

export const MIN_ACTIVITY_MS = 1500;

/** Holds each activity for a minimum time, so a quick read still gets its moment. */
export const useCatActivity = (items: LumoAgentItem[], isBusy: boolean): CatActivity | null => {
    const activity = selectCatActivity(items, isBusy);
    const [lingeringActivity, setLingeringActivity] = useState(activity);
    const startedAtRef = useRef(0);

    useEffect(() => {
        if (activity) {
            startedAtRef.current = Date.now();
            setLingeringActivity(activity);
            return;
        }
        const remainingMs = startedAtRef.current + MIN_ACTIVITY_MS - Date.now();
        if (remainingMs <= 0) {
            setLingeringActivity(null);
            return;
        }
        const timeout = window.setTimeout(() => setLingeringActivity(null), remainingMs);
        return () => window.clearTimeout(timeout);
    }, [activity]);

    return activity ?? lingeringActivity;
};
