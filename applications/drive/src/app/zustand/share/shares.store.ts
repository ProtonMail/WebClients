import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { Share, ShareWithKey } from '../../store';
import { ShareState, ShareType } from '../../store';
import type { SharesState } from './types';

export const useSharesStore = create<SharesState>()(
    devtools((set, get) => ({
        shares: {},
        lockedVolumesForRestore: [],

        setShares: (newShares) =>
            set((state) => {
                const updatedShares = { ...state.shares };
                newShares.forEach((share) => {
                    updatedShares[share.shareId] = share;
                });
                return { shares: updatedShares };
            }),

        removeShares: (shareIds) =>
            set((state) => ({
                shares: Object.fromEntries(
                    Object.entries(state.shares).filter(([shareId]) => !shareIds.includes(shareId))
                ),
            })),

        getShare: (shareId) => get().shares[shareId],

        getLockedShares: () => {
            const { shares } = get();
            return Object.values(shares)
                .filter((share) => share.isLocked && share.isDefault && !share.isVolumeSoftDeleted)
                .map((defaultShare) => ({
                    defaultShare,
                    devices: Object.values(shares).filter(
                        (share) =>
                            share.isLocked &&
                            share.type === ShareType.device &&
                            share.volumeId === defaultShare.volumeId
                    ),
                    photos: Object.values(shares).filter(
                        (share) =>
                            share.isLocked &&
                            share.type === ShareType.photos &&
                            share.volumeId === defaultShare.volumeId
                    ),
                }));
        },

        getDefaultShareId: () => {
            const { shares } = get();
            return findDefaultShareId(Object.values(shares));
        },

        getDefaultPhotosShareId: () => {
            const { shares } = get();
            return findDefaultPhotosShareId(Object.values(shares));
        },

        getRestoredPhotosShares: () => {
            const { shares } = get();
            return Object.values(shares).filter(
                (share) => share.state === ShareState.restored && !share.isLocked && share.type === ShareType.photos
            );
        },

        setLockedVolumesForRestore: (volumes) => set({ lockedVolumesForRestore: volumes }),
    }))
);

export function findDefaultShareId(shares: (Share | ShareWithKey)[]) {
    const share = shares.find((share) => share.isDefault && !share.isLocked && !share.isVolumeSoftDeleted);
    return share ? share.shareId : undefined;
}

export function findDefaultPhotosShareId(shares: (Share | ShareWithKey)[]) {
    const share = shares.find(
        (share) => share.state === ShareState.active && !share.isLocked && share.type === ShareType.photos
    );
    return share ? share.shareId : undefined;
}
