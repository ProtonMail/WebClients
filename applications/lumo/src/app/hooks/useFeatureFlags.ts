import { useCallback } from 'react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { dismissFeatureFlag, resetFeatureFlags, updateFeatureFlags } from '../redux/slices/featureFlags';
import type { FeatureFlag } from '../redux/slices/featureFlags';

export function useFeatureFlags() {
    const dispatch = useLumoDispatch();
    const featureFlags = useLumoSelector((state) => state.featureFlags);

    const dismissFlag = useCallback(
        (id: string, versionId: string, wasDeclined: boolean) => {
            dispatch(dismissFeatureFlag({ id, versionId, wasDeclined }));
        },
        [dispatch]
    );

    const setFeatureFlags = useCallback(
        (flags: FeatureFlag[]) => {
            dispatch(updateFeatureFlags(flags));
        },
        [dispatch]
    );

    const resetFlags = useCallback(() => {
        dispatch(resetFeatureFlags());
    }, [dispatch]);

    const isDismissed = useCallback(
        (id: string, versionId: string) => {
            return featureFlags.some((flag) => flag.id === id && flag.versionId === versionId);
        },
        [featureFlags]
    );

    const isDeclined = useCallback(
        (id: string, versionId: string) => {
            return featureFlags.some((flag) => flag.id === id && flag.versionId === versionId && flag.wasDeclined);
        },
        [featureFlags]
    );

    return {
        featureFlags,
        dismissFlag,
        setFeatureFlags,
        resetFlags,
        isDismissed,
        isDeclined,
    };
}
