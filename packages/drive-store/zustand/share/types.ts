import type { LockedVolumeForRestore, Share, ShareWithKey } from '../../store';

export interface SharesState {
    shares: Record<string, Share | ShareWithKey>;
    lockedVolumesForRestore: LockedVolumeForRestore[];
    setShares: (shares: (Share | ShareWithKey)[]) => void;
    removeShares: (shareIds: string[]) => void;
    getShare: (shareId: string) => Share | ShareWithKey | undefined;
    getLockedShares: () => {
        defaultShares: (Share | ShareWithKey)[];
        devices: (Share | ShareWithKey)[];
        photos: (Share | ShareWithKey)[];
    }[];
    haveLockedOrRestoredOldPhotosShare: () => boolean;
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
