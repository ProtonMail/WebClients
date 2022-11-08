import { createContext, useContext, useRef } from 'react';

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

    const getVolumeShareIds = (volumeId: string) => {
        const shareIdsSet = state.current.get(volumeId) || new Set();
        return Array.from(shareIdsSet);
    };

    return {
        setVolumeShareIds,
        getVolumeShareIds,
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
