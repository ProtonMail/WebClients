import { createContext, useCallback, useContext, useState } from 'react';

import { LockedVolumeForRestore, Share, ShareType, ShareWithKey } from './interface';

type SharesState = {
    [shareId: string]: Share | ShareWithKey;
};

/**
 * useSharesStateProvider provides a storage to cache shares.
 */
export function useSharesStateProvider() {
    const [state, setState] = useState<SharesState>({});
    const [lockedVolumesForRestore, setLockedVolumesForRestore] = useState<LockedVolumeForRestore[]>([]);

    const setShares = useCallback((shares: (Share | ShareWithKey)[]) => {
        setState((state) => {
            shares.forEach((share) => {
                state[share.shareId] = share;
            });
            return { ...state };
        });
    }, []);

    const removeShares = useCallback((shareIds: string[]) => {
        setState((state) => {
            return Object.fromEntries(Object.entries(state).filter(([shareId]) => !shareIds.includes(shareId)));
        });
    }, []);

    const getShare = useCallback(
        (shareId: string): Share | ShareWithKey | undefined => {
            return state[shareId];
        },
        [state]
    );

    /**
     * In the past, volume only had a single default share, making it
     * appropriate to match share with volume. However, volume can contain
     * multiple root shares - one default share and any number of devices.
     * Volume has to be unlocked in one request and thus we need to prepare
     * default shares together with devices for the same volume.
     * In the future it makes sense to move this logic fully to volume
     * section.
     */
    const getLockedShares = useCallback((): {
        defaultShare: Share | ShareWithKey;
        devices: (Share | ShareWithKey)[];
    }[] => {
        return Object.values(state)
            .filter((share) => share.isLocked && share.isDefault && !share.isVolumeSoftDeleted)
            .map((defaultShare) => ({
                defaultShare,
                devices: Object.values(state).filter(
                    (share) =>
                        share.isLocked && share.type === ShareType.device && share.volumeId === defaultShare.volumeId
                ),
            }));
    }, [state]);

    const getDefaultShareId = useCallback((): string | undefined => {
        return findDefaultShareId(Object.entries(state).map(([, share]) => share));
    }, [state]);

    return {
        setShares,
        removeShares,
        getShare,
        getLockedShares,
        getDefaultShareId,
        setLockedVolumesForRestore,
        lockedVolumesForRestore,
    };
}

export function findDefaultShareId(shares: (Share | ShareWithKey)[]) {
    const share = shares.find((share) => share.isDefault && !share.isLocked && !share.isVolumeSoftDeleted);
    return share ? share.shareId : undefined;
}

const SharesStateContext = createContext<ReturnType<typeof useSharesStateProvider> | null>(null);

export function SharesStateProvider({ children }: { children: React.ReactNode }) {
    const value = useSharesStateProvider();
    return <SharesStateContext.Provider value={value}>{children}</SharesStateContext.Provider>;
}

export default function useSharesState() {
    const state = useContext(SharesStateContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SharesStateProvider');
    }
    return state;
}
