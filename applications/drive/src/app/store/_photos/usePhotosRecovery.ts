import { useCallback, useEffect, useState } from 'react';

import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { sendErrorReport } from '../../utils/errorHandling';
import { DecryptedLink, useLinksActions, useLinksListing } from '../_links';
import { Share, ShareWithKey } from '../_shares';
import useSharesState from '../_shares/useSharesState';
import { waitFor } from '../_utils';
import { usePhotos } from './PhotosProvider';

export type RECOVERY_STATE =
    | 'READY'
    | 'STARTED'
    | 'DECRYPTING'
    | 'DECRYPTED'
    | 'PREPARING'
    | 'PREPARED'
    | 'MOVING'
    | 'MOVED'
    | 'CLEANING'
    | 'SUCCEED'
    | 'FAILED';

const RECOVERY_STATE_CACHE_KEY = 'photos-recovery-state';

export const usePhotosRecovery = () => {
    const { shareId, linkId, deletePhotosShare } = usePhotos();
    const { getRestoredPhotosShares } = useSharesState();
    const { getCachedChildren, loadChildren } = useLinksListing();
    const { moveLinks } = useLinksActions();
    const [countOfUnrecoveredLinksLeft, setCountOfUnrecoveredLinksLeft] = useState<number>(0);
    const [countOfFailedLinks, setCountOfFailedLinks] = useState<number>(0);
    const [state, setState] = useState<RECOVERY_STATE>('READY');
    const [restoredData, setRestoredData] = useState<{ links: DecryptedLink[]; shareId: string }[]>([]);
    const [needsRecovery, setNeedsRecovery] = useState<boolean>(false);

    const [restoredShares, setRestoredShares] = useState<Share[] | ShareWithKey[] | undefined>();

    useEffect(() => {
        const shares = getRestoredPhotosShares();
        setRestoredShares(shares);
        setNeedsRecovery(!!shares?.length);
    }, [getRestoredPhotosShares]);
    const handleFailed = (e: Error) => {
        setState('FAILED');
        setItem(RECOVERY_STATE_CACHE_KEY, 'failed');
        sendErrorReport(e);
    };

    const handleDecryptLinks = useCallback(
        async (abortSignal: AbortSignal, shares: Share[] | ShareWithKey[]) => {
            for (const share of shares) {
                await loadChildren(abortSignal, share.shareId, share.rootLinkId);
                await waitFor(
                    () => {
                        const { isDecrypting } = getCachedChildren(abortSignal, share.shareId, share.rootLinkId);
                        return !isDecrypting;
                    },
                    { abortSignal }
                );
            }
        },
        [getCachedChildren, loadChildren]
    );

    const handlePrepareLinks = useCallback(
        async (abortSignal: AbortSignal, shares: Share[] | ShareWithKey[]) => {
            let allRestoredData: { links: DecryptedLink[]; shareId: string }[] = [];
            let totalNbLinks: number = 0;

            for (const share of shares) {
                const { links } = getCachedChildren(abortSignal, share.shareId, share.rootLinkId);
                allRestoredData.push({
                    links,
                    shareId: share.shareId,
                });
                totalNbLinks += links.length;
            }
            return { allRestoredData, totalNbLinks };
        },
        [getCachedChildren]
    );

    const safelyDeleteShares = useCallback(
        async (abortSignal: AbortSignal, shares: Share[] | ShareWithKey[]) => {
            for (const share of shares) {
                const { links } = getCachedChildren(abortSignal, share.shareId, share.rootLinkId);
                if (!links.length) {
                    await deletePhotosShare(share.volumeId, share.shareId);
                }
            }
        },
        [deletePhotosShare, getCachedChildren]
    );

    const handleMoveLinks = useCallback(
        async (
            abortSignal: AbortSignal,
            {
                dataList,
                newLinkId,
            }: {
                dataList: { links: DecryptedLink[]; shareId: string }[];
                newLinkId: string;
            }
        ) => {
            for (const data of dataList) {
                await moveLinks(abortSignal, {
                    shareId: data.shareId,
                    linkIds: data.links.map((link) => link.linkId),
                    newParentLinkId: newLinkId,
                    newShareId: shareId,
                    onMoved: () => setCountOfUnrecoveredLinksLeft((prevState) => prevState - 1),
                    onError: () => {
                        setCountOfUnrecoveredLinksLeft((prevState) => prevState - 1);
                        setCountOfFailedLinks((prevState) => prevState + 1);
                    },
                });
            }
        },
        [moveLinks, shareId]
    );

    useEffect(() => {
        if (state !== 'STARTED' || !linkId || !restoredShares) {
            return;
        }
        const abortController = new AbortController();
        setState('DECRYPTING');
        void handleDecryptLinks(abortController.signal, restoredShares)
            .then(() => {
                setState('DECRYPTED');
            })
            .catch(handleFailed);
    }, [handleDecryptLinks, linkId, restoredShares, state]);

    useEffect(() => {
        const abortController = new AbortController();
        if (state !== 'DECRYPTED' || !restoredShares) {
            return;
        }
        setState('PREPARING');
        void handlePrepareLinks(abortController.signal, restoredShares)
            .then(({ allRestoredData, totalNbLinks }) => {
                setRestoredData(allRestoredData);
                if (!!totalNbLinks) {
                    setCountOfUnrecoveredLinksLeft(totalNbLinks);
                }
                setState('PREPARED');
            })
            .catch(handleFailed);
        return () => {
            abortController.abort();
        };
    }, [handlePrepareLinks, restoredShares, state]);

    useEffect(() => {
        if (state !== 'PREPARED' || !linkId) {
            return;
        }
        const abortController = new AbortController();
        setState('MOVING');
        void handleMoveLinks(abortController.signal, {
            newLinkId: linkId,
            dataList: restoredData,
        })
            .then(() => {
                setState('MOVED');
            })
            .catch(handleFailed);

        // Moved is done in the background, so we don't abort it on rerender
    }, [countOfUnrecoveredLinksLeft, handleMoveLinks, linkId, restoredData, state]);

    useEffect(() => {
        if (state !== 'MOVED' || !restoredShares || countOfUnrecoveredLinksLeft !== 0) {
            return;
        }
        const abortController = new AbortController();
        setState('CLEANING');
        void safelyDeleteShares(abortController.signal, restoredShares)
            .then(() => {
                // We still want to remove empty shares if possible,
                // but we should say to the user that it failed since not every file were recovered
                if (countOfFailedLinks) {
                    return Promise.reject(new Error('Failed to move recovered photos'));
                }
                removeItem(RECOVERY_STATE_CACHE_KEY);
                setState('SUCCEED');
            })
            .catch(handleFailed);

        return () => {
            abortController.abort();
        };
    }, [countOfFailedLinks, countOfUnrecoveredLinksLeft, restoredShares, safelyDeleteShares, state]);

    const start = useCallback(() => {
        setItem(RECOVERY_STATE_CACHE_KEY, 'progress');
        setState('STARTED');
    }, []);

    useEffect(() => {
        if (state !== 'READY') {
            return;
        }
        const cachedRecoveryState = getItem(RECOVERY_STATE_CACHE_KEY);
        if (cachedRecoveryState === 'progress') {
            setState('STARTED');
        } else if (cachedRecoveryState === 'failed') {
            setState('FAILED');
        }
    }, [state]);
    return {
        needsRecovery,
        countOfUnrecoveredLinksLeft,
        countOfFailedLinks,
        start,
        state,
    };
};
