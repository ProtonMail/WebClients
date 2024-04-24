import { createContext, useContext, useRef } from 'react';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';

/**
 * volumeId -> [shareId01, shareId02]
 */
export type VolumesState = Map<string, Set<string>>;

/**
 * Stores volume -> share associations.
 */
export function useVolumesStateProvider() {
    const state = useRef<VolumesState>(new Map());

    const setVolumeShareIds = (volumeId: string, shareIds: string[]) => {
        const shareIdsSet = state.current.get(volumeId) || new Set();

        for (const shareId of shareIds) {
            shareIdsSet.add(shareId);
        }

        state.current.set(volumeId, shareIdsSet);
    };

    const findVolumeId = (shareId: string) => {
        let volumeId: string | undefined;

        for (const [currVolumeId, shareIds] of state.current) {
            if (shareIds.has(shareId)) {
                volumeId = currVolumeId;
                break;
            }
        }

        if (!volumeId) {
            captureMessage('Trying to find missing volume');
        }

        return volumeId;
    };

    const getVolumeShareIds = (volumeId: string) => {
        const shareIdsSet = state.current.get(volumeId) || new Set();
        return Array.from(shareIdsSet);
    };

    const clear = () => {
        state.current.clear();
    };

    return {
        findVolumeId,
        setVolumeShareIds,
        getVolumeShareIds,
        clear,
    };
}

const VolumesStateContext = createContext<ReturnType<typeof useVolumesStateProvider> | null>(null);

export function VolumesStateProvider({ children }: { children: React.ReactNode }) {
    const value = useVolumesStateProvider();
    return <VolumesStateContext.Provider value={value}>{children}</VolumesStateContext.Provider>;
}

export default function useVolumesState() {
    const state = useContext(VolumesStateContext);
    if (!state) {
        throw new Error('Trying to use uninitialized state provider');
    }
    return state;
}
