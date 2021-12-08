import { createContext, useContext, useCallback, useState } from 'react';

import { Share, ShareWithKey, LockedVolumeForRestore } from './interface';

type SharesState = {
    [shareId: string]: Share | ShareWithKey;
};

/**
 * useSharesStateProvider provides a storage to cache shares.
 */
function useSharesStateProvider() {
    const [state, setState] = useState<SharesState>({});
    const [lockedVolumesForRestore, setLockedVolumesForRestore] = useState<LockedVolumeForRestore[]>();

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

    const getLockedShares = useCallback((): (Share | ShareWithKey)[] => {
        return Object.values(state).filter((share) => share.isLocked && !share.isVolumeSoftDeleted);
    }, [state]);

    const getDefaultShareId = useCallback((): string | undefined => {
        const share = Object.entries(state)
            .map(([, share]) => share)
            .find((share) => share.isDefault && !share.isLocked && !share.isVolumeSoftDeleted);
        return share ? share.shareId : undefined;
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
