import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { LockedVolumeForRestore, Share, ShareWithKey } from '../../../legacy/store/_shares';
import { ShareState, ShareType } from '../../../legacy/store/_shares';

interface SharesState {
    shares: Record<string, Share | ShareWithKey>;
    lockedVolumesForRestore: LockedVolumeForRestore[];
    setShares: (shares: (Share | ShareWithKey)[]) => void;
    removeShares: (shareIds: string[]) => void;
    getShare: (shareId: string) => Share | ShareWithKey | undefined;
    getLockedSharesByVolume: () => Map<
        string,
        {
            defaultShares: (Share | ShareWithKey)[];
            devices: (Share | ShareWithKey)[];
            photos: (Share | ShareWithKey)[];
        }
    >;
    getDefaultShareId: () => string | undefined;
    getDefaultPhotosShareId: () => string | undefined;
    getDefaultShareEmail: () => string | undefined;
    getRestoredPhotosShares: () => (Share | ShareWithKey)[];
    setLockedVolumesForRestore: (volumes: LockedVolumeForRestore[]) => void;

    // This set of actions are to ensure we load default shares and photo shares only once
    loadUserSharesPromise: Promise<{ defaultShareId?: string; shares: Share[] }> | null;
    defaultSharePromise: Promise<ShareWithKey> | null;
    defaultPhotosSharePromise: Promise<ShareWithKey | undefined> | null;
    isLoadingShares: boolean;
    setLoadUserSharesPromise: (promise: Promise<{ defaultShareId?: string; shares: Share[] }>) => void;
    clearLoadUserSharesPromise: () => void;
    setDefaultSharePromise: (promise: Promise<ShareWithKey>) => void;
    clearDefaultSharePromise: () => void;
    setDefaultPhotosSharePromise: (promise: Promise<ShareWithKey | undefined>) => void;
    clearDefaultPhotosSharePromise: () => void;
    setIsLoadingShares: (isLoading: boolean) => void;
}
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
        getLockedSharesByVolume: () => {
            const { shares } = get();
            const lockedShares = Object.values(shares).filter((share) => share.isLocked);

            const lockedSharesByVolume = new Map<
                string,
                {
                    defaultShares: (Share | ShareWithKey)[];
                    devices: (Share | ShareWithKey)[];
                    photos: (Share | ShareWithKey)[];
                }
            >();
            lockedShares.forEach((share) => {
                const currentShares = lockedSharesByVolume.get(share.volumeId) || {
                    defaultShares: [],
                    devices: [],
                    photos: [],
                };
                if (share.type === ShareType.default) {
                    lockedSharesByVolume.set(share.volumeId, {
                        ...currentShares,
                        defaultShares: [...currentShares.defaultShares, share],
                    });
                } else if (share.type === ShareType.device) {
                    lockedSharesByVolume.set(share.volumeId, {
                        ...currentShares,
                        devices: [...currentShares.devices, share],
                    });
                } else if (share.type === ShareType.photos) {
                    lockedSharesByVolume.set(share.volumeId, {
                        ...currentShares,
                        photos: [...currentShares.photos, share],
                    });
                }
            });

            return lockedSharesByVolume;
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
