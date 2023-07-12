import { useCallback } from 'react';

import { queryUserShares } from '@proton/shared/lib/api/drive/share';
import { UserShareResult } from '@proton/shared/lib/interfaces/drive/share';

import { shareMetaShortToShare, useDebouncedRequest } from '../_api';
import { useDebouncedFunction } from '../_utils';
import { useVolumesState } from '../_volumes';
import { Share, ShareWithKey } from './interface';
import useShare from './useShare';
import useSharesState, { findDefaultShareId } from './useSharesState';
import useVolume from './useVolume';

/**
 * useDefaultShare provides access to main default user's share.
 */
export default function useDefaultShare() {
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();
    const sharesState = useSharesState();
    const { getShare, getShareWithKey } = useShare();
    const { createVolume } = useVolume();
    const volumesState = useVolumesState();

    const loadUserShares = useCallback(async (): Promise<Share[]> => {
        const { Shares } = await debouncedRequest<UserShareResult>(queryUserShares());
        const shares = Shares.map(shareMetaShortToShare);

        shares.forEach(({ volumeId, shareId }) => {
            volumesState.setVolumeShareIds(volumeId, [shareId]);
        });
        sharesState.setShares(shares);
        return shares;
    }, []);

    const getDefaultShare = useCallback(
        async (abortSignal?: AbortSignal): Promise<ShareWithKey> => {
            return debouncedFunction(
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

                    return getShareWithKey(abortSignal || new AbortController().signal, defaultShareId);
                },
                ['getDefaultShare'],
                abortSignal
            );
        },
        [sharesState.getDefaultShareId, getShareWithKey]
    );

    const isShareAvailable = useCallback(
        (abortSignal: AbortSignal, shareId: string): Promise<boolean> => {
            return debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    const share = await getShare(abortSignal, shareId);
                    return !share.isLocked && !share.isVolumeSoftDeleted;
                },
                ['isShareAvailable', shareId],
                abortSignal
            );
        },
        [getShare]
    );

    return {
        getDefaultShare,
        isShareAvailable,
    };
}
