import { useCallback } from 'react';

import { UserShareResult } from '@proton/shared/lib/interfaces/drive/share';
import { queryUserShares } from '@proton/shared/lib/api/drive/share';

import { useDebouncedFunction } from '../utils';
import { useDebouncedRequest, shareMetaShortToShare } from '../api';
import { ShareWithKey } from './interface';
import useSharesState from './useSharesState';
import useShare from './useShare';
import useVolume from './useVolume';

/**
 * useDefaultShare provides access to main default user's share.
 */
export default function useDefaultShare() {
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();
    const sharesState = useSharesState();
    const { getShareWithKey } = useShare();
    const { createVolume } = useVolume();

    const loadUserShares = useCallback(async (): Promise<void> => {
        const { Shares } = await debouncedRequest<UserShareResult>(queryUserShares());
        const shares = Shares.map(shareMetaShortToShare);
        sharesState.setShares(shares);
    }, []);

    const getDefaultShare = useCallback(
        async (abortSignal?: AbortSignal): Promise<ShareWithKey> => {
            return debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    let defaultShareId = sharesState.getDefaultShareId();

                    // First try to load fresh list of shares from API to make sure
                    // we don't create second default share.
                    if (!defaultShareId) {
                        await loadUserShares();
                        defaultShareId = sharesState.getDefaultShareId();
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

    return {
        getDefaultShare,
    };
}
