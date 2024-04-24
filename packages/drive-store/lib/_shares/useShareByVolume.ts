import { useCallback } from 'react';

import { queryUserShares } from '@proton/shared/lib/api/drive/share';
import { UserShareResult } from '@proton/shared/lib/interfaces/drive/share';

import { useDebouncedRequest } from '../../store/_api';
import { shareMetaShortToShare } from '../../store/_api/transformers';
import { Share, ShareState, ShareWithKey } from '../../store/_shares/interface';
import useShare from '../../store/_shares/useShare';
import { useSharesStateProvider } from '../../store/_shares/useSharesState';
import { useDebouncedFunction } from '../../store/_utils';
import { useVolumesStateProvider } from '../../store/_volumes/useVolumesState';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { findShareIdByVolume } from './findShareIdByVolume';

export const useShareByVolume = () => {
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();
    const sharesState = useSharesStateProvider();
    const { getShareWithKey } = useShare();
    const volumesState = useVolumesStateProvider();

    const loadUserShares = useCallback(async (): Promise<Share[]> => {
        const { Shares } = await debouncedRequest<UserShareResult>(queryUserShares());
        // We have to ignore the deleted shares until BE stop to return them
        const shares = Shares.map(shareMetaShortToShare).filter((share) => share.state !== ShareState.deleted);

        shares.forEach(({ volumeId, shareId }) => {
            volumesState.setVolumeShareIds(volumeId, [shareId]);
        });
        sharesState.setShares(shares);
        return shares;
    }, []);

    const getShareByVolume = useCallback(
        async (abortSignal: AbortSignal, volumeId: string): Promise<ShareWithKey> => {
            return debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    let shareId: string | undefined = volumesState.getVolumeShareIds(volumeId)[0];

                    if (!shareId) {
                        const shares = await loadUserShares();
                        shareId = findShareIdByVolume(shares, volumeId);
                    }

                    if (!shareId) {
                        throw new EnrichedError('Unable to find shareId for volume', {
                            tags: { volumeId },
                        });
                    }

                    return getShareWithKey(abortSignal || new AbortController().signal, shareId);
                },
                ['getShareByVolume'],
                abortSignal
            );
        },
        [volumesState.getVolumeShareIds, getShareWithKey]
    );

    return {
        getShareByVolume,
    };
};
