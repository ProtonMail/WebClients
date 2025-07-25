import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import type { Share, ShareWithKey } from '../../store/_shares';
import { ShareState, ShareType } from '../../store/_shares';
import type { SharesState } from './types';

export const useSharesStore = create<SharesState>()(
    devtools((set, get) => ({
        shares: {},
        lockedVolumesForRestore: [],

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
        removeShares: (shareIds) =>
            set((state) => ({
                shares: Object.fromEntries(
                    Object.entries(state.shares).filter(([shareId]) => !shareIds.includes(shareId))
                ),
            })),
        getShare: (shareId) => get().shares[shareId],
        getLockedShares: () => {
            const { shares } = get();
            const shareValues = Object.values(shares);
            const lockedDefaultShares = shareValues.filter(
                (share) => share.isLocked && (share.isDefault || share.volumeType === VolumeType.Photos)
            );

            // Group by volume ID
            const volumeGroups = new Map<string, typeof lockedDefaultShares>();
            lockedDefaultShares.forEach((share) => {
                if (!volumeGroups.has(share.volumeId)) {
                    volumeGroups.set(share.volumeId, []);
                }
                volumeGroups.get(share.volumeId)!.push(share);
            });

            return Array.from(volumeGroups.entries()).map(([volumeId, defaultShares]) => ({
                defaultShares,
                devices: shareValues.filter(
                    (share) => share.isLocked && share.type === ShareType.device && share.volumeId === volumeId
                ),
                photos: shareValues.filter(
                    (share) => share.isLocked && share.type === ShareType.photos && share.volumeId === volumeId
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
        haveLockedOrRestoredOldPhotosShare: () => {
            const { shares } = get();
            const sharesValues = Object.values(shares);
            return sharesValues
                .filter((share) => share.isDefault)
                .some((defaultShare) =>
                    sharesValues.some(
                        (share) =>
                            (share.state === ShareState.restored || share.isLocked) &&
                            share.type === ShareType.photos &&
                            share.volumeId === defaultShare.volumeId
                    )
                );
        },
        getRestoredPhotosShares: () => {
            const { shares } = get();
            return Object.values(shares).filter(
                (share) => share.state === ShareState.restored && !share.isLocked && share.type === ShareType.photos
            );
        },
        getDefaultShareEmail: () => {
            const { shares } = get();
            const share = findDefaultShare(Object.values(shares));
            return share ? share.creator : undefined;
        },
        setLockedVolumesForRestore: (volumes) => set({ lockedVolumesForRestore: volumes }),
        setLoadUserSharesPromise: (promise) => set({ loadUserSharesPromise: promise }),
        clearLoadUserSharesPromise: () => set({ loadUserSharesPromise: null }),
        setDefaultSharePromise: (promise) => set({ defaultSharePromise: promise }),
        clearDefaultSharePromise: () => set({ defaultSharePromise: null }),
        setDefaultPhotosSharePromise: (promise) => set({ defaultPhotosSharePromise: promise }),
        clearDefaultPhotosSharePromise: () => set({ defaultPhotosSharePromise: null }),
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
