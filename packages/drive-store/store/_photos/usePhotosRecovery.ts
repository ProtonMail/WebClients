import { useCallback, useEffect, useState } from 'react';

import isEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import { usePhotosWithAlbums } from '../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { sendErrorReport } from '../../utils/errorHandling';
import { useSharesStore } from '../../zustand/share/shares.store';
import type { DecryptedLink } from '../_links';
import { useLinksActions, useLinksListing } from '../_links';
import { type Share, type ShareWithKey } from '../_shares';
import { waitFor } from '../_utils';

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

export const usePhotosRecovery = ({ onSucceed }: { onSucceed?: () => void } = {}) => {
    const { shareId, linkId, volumeId, volumeType, deletePhotosShare } = usePhotosWithAlbums();
    const { getRestoredPhotosShares, removeShares } = useSharesStore((state) => ({
        getRestoredPhotosShares: state.getRestoredPhotosShares,
        removeShares: state.removeShares,
    }));
    const { getCachedChildren, getCachedTrashed, loadChildren } = useLinksListing();
    const { recoverPhotoLinks, moveLinks } = useLinksActions();
    const [countOfUnrecoveredLinksLeft, setCountOfUnrecoveredLinksLeft] = useState<number>(0);
    const [countOfFailedLinks, setCountOfFailedLinks] = useState<number>(0);
    const [state, setState] = useState<RECOVERY_STATE>('READY');
    const [restoredData, setRestoredData] = useState<{ links: DecryptedLink[]; shareId: string }[]>([]);
    const [restoredShares, setRestoredShares] = useState<Share[] | ShareWithKey[] | undefined>();

    useEffect(() => {
        const shares = getRestoredPhotosShares();
        if (!isEqual(shares, restoredShares)) {
            setRestoredShares(shares);
        }
    }, [getRestoredPhotosShares]);

    const handleFailed = (e: Error) => {
        setState('FAILED');
        setItem(RECOVERY_STATE_CACHE_KEY, 'failed');
        sendErrorReport(e);
    };

    const handleDecryptLinks = useCallback(
        async (abortSignal: AbortSignal, shares: Share[] | ShareWithKey[]) => {
            for (const share of shares) {
                await loadChildren(abortSignal, share.shareId, share.rootLinkId, undefined, undefined, true);
                await waitFor(
                    () => {
                        const { isDecrypting } = getCachedChildren(abortSignal, share.shareId, share.rootLinkId);
                        const { isDecrypting: isTrashDecrypting } = getCachedTrashed(abortSignal, share.volumeId);
                        return !isDecrypting && !isTrashDecrypting;
                    },
                    { abortSignal }
                );
            }
        },
        [getCachedChildren, getCachedTrashed, loadChildren]
    );

    const handlePrepareLinks = useCallback(
        async (abortSignal: AbortSignal, shares: Share[] | ShareWithKey[]) => {
            const allRestoredData: { links: DecryptedLink[]; shareId: string }[] = [];
            let totalNbLinks: number = 0;

            for (const share of shares) {
                const { links } = getCachedChildren(abortSignal, share.shareId, share.rootLinkId);
                const trashLinks = getCachedTrashed(abortSignal, share.volumeId).links.filter(
                    (link) => !!link.activeRevision?.photo
                );
                const allLinks = links.concat(trashLinks);
                allRestoredData.push({
                    links: allLinks,
                    shareId: share.shareId,
                });
                totalNbLinks += allLinks.length;
            }
            return { allRestoredData, totalNbLinks };
        },
        [getCachedChildren, getCachedTrashed]
    );

    const safelyDeleteShares = useCallback(
        async (abortSignal: AbortSignal, shares: Share[] | ShareWithKey[]) => {
            for (const share of shares) {
                const { links } = getCachedChildren(abortSignal, share.shareId, share.rootLinkId);
                const trashLinks = getCachedTrashed(abortSignal, share.volumeId).links.filter(
                    (link) => !!link.activeRevision?.photo
                );
                if (!links.length && !trashLinks.length) {
                    await deletePhotosShare(share.volumeId, share.shareId);
                    removeShares([share.shareId]);
                }
            }
        },
        [deletePhotosShare, getCachedChildren, getCachedTrashed, removeShares]
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
            if (volumeType === VolumeType.Photos) {
                if (!volumeId || !shareId) {
                    return Promise.reject('Missing volumeId or shareId for recovery');
                }

                for (const data of dataList) {
                    const { successes, failures } = await recoverPhotoLinks(abortSignal, volumeId, {
                        shareId: data.shareId,
                        linkIds: data.links.map((link) => link.linkId),
                        newParentLinkId: newLinkId,
                        newShareId: shareId,
                    });
                    setCountOfUnrecoveredLinksLeft(
                        (prevState) => prevState - (successes.length + Object.keys(failures).length)
                    );
                    setCountOfFailedLinks((prevState) => prevState + Object.keys(failures).length);
                }
            } else {
                // legacy photo share recovery
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
            }
        },
        [recoverPhotoLinks, moveLinks, volumeType, volumeId, shareId]
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
                onSucceed?.();
            })
            .catch(handleFailed);

        return () => {
            abortController.abort();
        };
    }, [countOfFailedLinks, countOfUnrecoveredLinksLeft, restoredShares, safelyDeleteShares, state, onSucceed]);

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
        needsRecovery: !!restoredShares?.length,
        countOfUnrecoveredLinksLeft,
        countOfFailedLinks,
        start,
        state,
    };
};
