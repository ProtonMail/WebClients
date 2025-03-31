import { useCallback } from 'react';

import { queryUserShares } from '@proton/shared/lib/api/drive/share';
import type { UserShareResult } from '@proton/shared/lib/interfaces/drive/share';

import { findDefaultPhotosShareId, findDefaultShareId, useSharesStore } from '../../zustand/share/shares.store';
import { shareMetaShortToShare, useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { useDebouncedFunction } from '../_utils';
import { useVolumesState } from '../_volumes';
import type { Share, ShareWithKey } from './interface';
import useShare from './useShare';
import useVolume from './useVolume';

/**
 * useDefaultShare provides access to main default user's share.
 */
export function useDefaultShare() {
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();

    const sharesState = useSharesStore((state) => ({
        setShares: state.setShares,
        getDefaultShareId: state.getDefaultShareId,
        getDefaultPhotosShareId: state.getDefaultPhotosShareId,
        loadUserSharesPromise: state.loadUserSharesPromise,
        defaultSharePromise: state.defaultSharePromise,
        defaultPhotosSharePromise: state.defaultPhotosSharePromise,
        isLoadingShares: state.isLoadingShares,
        setLoadUserSharesPromise: state.setLoadUserSharesPromise,
        setDefaultSharePromise: state.setDefaultSharePromise,
        setDefaultPhotosSharePromise: state.setDefaultPhotosSharePromise,
        setIsLoadingShares: state.setIsLoadingShares,
    }));

    const { getShare, getShareWithKey } = useShare();
    const { createVolume } = useVolume();
    const volumesState = useVolumesState();
    const { getOwnAddressAndPrimaryKeys } = useDriveCrypto();

    const loadUserShares = useCallback(async (): Promise<Share[]> => {
        if (sharesState.loadUserSharesPromise) {
            return sharesState.loadUserSharesPromise;
        }

        // Wait if another component is in the process of loading shares
        // If we go in that condition that means another component is already loading user shares
        // so we're just waiting for the Zustand to update with the promise
        if (sharesState.isLoadingShares) {
            await new Promise<void>((resolve) => {
                const unsubscribe = useSharesStore.subscribe((state) => {
                    if (!state.isLoadingShares) {
                        unsubscribe();
                        resolve();
                    }
                });

                if (!useSharesStore.getState().isLoadingShares) {
                    unsubscribe();
                    resolve();
                }
            });

            const cachedPromise = useSharesStore.getState().loadUserSharesPromise;
            if (cachedPromise) {
                return cachedPromise;
            }
        }

        sharesState.setIsLoadingShares(true);

        try {
            const sharesPromise = (async () => {
                const { Shares } = await debouncedRequest<UserShareResult>(queryUserShares());
                const shares = Shares.map(shareMetaShortToShare);
                shares.forEach(({ volumeId, shareId }) => {
                    volumesState.setVolumeShareIds(volumeId, [shareId]);
                });
                sharesState.setShares(shares);
                return shares;
            })();

            sharesState.setLoadUserSharesPromise(sharesPromise);

            const shares = await sharesPromise;
            return shares;
        } finally {
            sharesState.setIsLoadingShares(false);
        }
    }, []);

    const getDefaultShare = useCallback(
        async (abortSignal?: AbortSignal): Promise<ShareWithKey> => {
            if (sharesState.defaultSharePromise) {
                return sharesState.defaultSharePromise;
            }

            const promise = debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    let defaultShareId = sharesState.getDefaultShareId();
                    // First try to load fresh list of shares from API to make sure
                    // we don't create second default share.
                    if (!defaultShareId) {
                        const shares = await loadUserShares();
                        // Do not use sharesState.getDefaultShareId as useState
                        // is not sync operation and thus the new state might
                        // not be set just yet.
                        defaultShareId = findDefaultShareId(shares);
                    }
                    if (!defaultShareId) {
                        const { shareId } = await createVolume();
                        defaultShareId = shareId;
                        // Load shares to the cache.
                        await loadUserShares();
                    }
                    const share = await getShareWithKey(abortSignal || new AbortController().signal, defaultShareId);
                    return share;
                },
                ['getDefaultShare'],
                abortSignal
            );

            sharesState.setDefaultSharePromise(promise);

            return promise;
        },
        [sharesState.getDefaultShareId, getShareWithKey, loadUserShares]
    );

    const getDefaultShareAddressEmail = useCallback(
        async (abortSignal?: AbortSignal): Promise<string> => {
            const share = await getDefaultShare(abortSignal);
            const { address } = await getOwnAddressAndPrimaryKeys(share.addressId);
            return address.Email;
        },
        [getDefaultShare, getOwnAddressAndPrimaryKeys]
    );

    const getDefaultPhotosShare = useCallback(
        async (abortSignal?: AbortSignal): Promise<ShareWithKey | undefined> => {
            if (sharesState.defaultPhotosSharePromise) {
                return sharesState.defaultPhotosSharePromise;
            }

            const promise = debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    let defaultPhotosShareId = sharesState.getDefaultPhotosShareId();
                    // First try to load fresh list of shares from API
                    if (!defaultPhotosShareId) {
                        const shares = await loadUserShares();
                        // Do not use sharesState.getDefaultPhotosShare as useState
                        // is not sync operation and thus the new state might
                        // not be set just yet.
                        defaultPhotosShareId = findDefaultPhotosShareId(shares);
                    }
                    // We currently don't support photos share creation on web
                    const share = defaultPhotosShareId
                        ? await getShareWithKey(abortSignal || new AbortController().signal, defaultPhotosShareId)
                        : undefined;
                    return share;
                },
                ['getDefaultPhotosShare'],
                abortSignal
            );

            sharesState.setDefaultPhotosSharePromise(promise);

            return promise;
        },
        [sharesState.getDefaultPhotosShareId, getShareWithKey, loadUserShares]
    );

    const isShareAvailable = useCallback(
        (abortSignal: AbortSignal, shareId: string): Promise<boolean> => {
            return debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    const share = await getShare(abortSignal, shareId);
                    return !share.isLocked;
                },
                ['isShareAvailable', shareId],
                abortSignal
            );
        },
        [getShare]
    );

    return {
        getDefaultShare,
        getDefaultShareAddressEmail,
        getDefaultPhotosShare,
        isShareAvailable,
    };
}

export default useDefaultShare;
