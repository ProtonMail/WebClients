import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Share, ShareWithKey } from '../../store/_shares/interface';
import { ShareState, ShareType } from '../../store/_shares/interface';
import type { SharesState } from './types';

export const useSharesStore = create<SharesState>()(
    devtools((set, get) => ({
        shares: {},

        loadUserSharesPromise: null,
        defaultSharePromise: null,
        defaultPhotosSharePromise: null,
        isLoadingShares: false,

        setShares: (newShares) =>
            set((state) => {
                const updatedShares = { ...state.shares };
                newShares.forEach((share) => {
                    updatedShares[share.shareId] = share;
                });
                return { shares: updatedShares };
            }),
        getShare: (shareId) => get().shares[shareId],
        getDefaultShareId: () => {
            const { shares } = get();
            return findDefaultShareId(Object.values(shares));
        },
        getDefaultPhotosShareId: () => {
            const { shares } = get();
            return findDefaultPhotosShareId(Object.values(shares));
        },
        getDefaultShareEmail: () => {
            const { shares } = get();
            const share = findDefaultShare(Object.values(shares));
            return share ? share.creator : undefined;
        },
        setLoadUserSharesPromise: (promise) => set({ loadUserSharesPromise: promise }),
        setDefaultSharePromise: (promise) => set({ defaultSharePromise: promise }),
        setDefaultPhotosSharePromise: (promise) => set({ defaultPhotosSharePromise: promise }),
        setIsLoadingShares: (isLoading) => set({ isLoadingShares: isLoading }),
    }))
);

function findDefaultShare(shares: (Share | ShareWithKey)[]) {
    const share = shares.find((share) => share.isDefault && !share.isLocked);
    return share;
}

export function findDefaultShareId(shares: (Share | ShareWithKey)[]) {
    const share = shares.find((share) => share.isDefault && !share.isLocked);
    return share ? share.shareId : undefined;
}

export function findDefaultPhotosShareId(shares: (Share | ShareWithKey)[]) {
    const share = shares.find(
        (share) => share.state === ShareState.active && !share.isLocked && share.type === ShareType.photos
    );
    return share ? share.shareId : undefined;
}
