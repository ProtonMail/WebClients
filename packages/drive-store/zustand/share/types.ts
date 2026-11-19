import type { Share, ShareWithKey } from '../../store/_shares/interface';

export interface SharesState {
    shares: Record<string, Share | ShareWithKey>;
    setShares: (shares: (Share | ShareWithKey)[]) => void;
    getShare: (shareId: string) => Share | ShareWithKey | undefined;
    getDefaultShareId: () => string | undefined;
    getDefaultPhotosShareId: () => string | undefined;
    getDefaultShareEmail: () => string | undefined;

    // This set of actions are to ensure we load default shares and photo shares only once
    loadUserSharesPromise: Promise<{ defaultShareId?: string; shares: Share[] }> | null;
    defaultSharePromise: Promise<ShareWithKey> | null;
    defaultPhotosSharePromise: Promise<ShareWithKey | undefined> | null;
    isLoadingShares: boolean;
    setLoadUserSharesPromise: (promise: Promise<{ defaultShareId?: string; shares: Share[] }>) => void;
    setDefaultSharePromise: (promise: Promise<ShareWithKey>) => void;
    setDefaultPhotosSharePromise: (promise: Promise<ShareWithKey | undefined>) => void;
    setIsLoadingShares: (isLoading: boolean) => void;
}
