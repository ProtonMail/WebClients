import { useCallback, useEffect, useState } from 'react';

import isEqual from 'lodash/isEqual';

import { useApi } from '@proton/components';
import { type NodeEntity, generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { queryDeletePhotosShare } from '@proton/shared/lib/api/drive/photos';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import type { DecryptedLink } from '../../../legacy/store/_links';
import { useLinksActions, useLinksListing } from '../../../legacy/store/_links';
import type { Share, ShareWithKey } from '../../../legacy/store/_shares';
import { waitFor } from '../../../legacy/store/_utils';
import { useSharesStore } from '../../../legacy/zustand/share/shares.store';
import { sendErrorReport } from '../../../utils/errorHandling';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';

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
    const api = useApi();
    const { getRestoredPhotosShares, removeShares, sharesRecord } = useSharesStore((state) => ({
        getRestoredPhotosShares: state.getRestoredPhotosShares,
        removeShares: state.removeShares,
        sharesRecord: state.shares,
    }));
    const { getCachedChildren, getCachedTrashed, loadChildren } = useLinksListing();
    const { recoverPhotoLinks } = useLinksActions();
    const [countOfUnrecoveredLinksLeft, setCountOfUnrecoveredLinksLeft] = useState<number>(0);
    const [countOfFailedLinks, setCountOfFailedLinks] = useState<number>(0);
    const [state, setState] = useState<RECOVERY_STATE>('READY');
    const [restoredData, setRestoredData] = useState<{ links: DecryptedLink[]; shareId: string }[]>([]);
    const [restoredShares, setRestoredShares] = useState<Share[] | ShareWithKey[] | undefined>();

    const [rootPhotoNode, setRootPhotoNode] = useState<NodeEntity>();

    useEffect(
        function initRestoredPhotoShares() {
            setRestoredShares((prev) => {
                const next = getRestoredPhotosShares();
                return isEqual(prev, next) ? prev : next;
            });
        },
        [getRestoredPhotosShares, sharesRecord]
    );

    useEffect(function initRootPhotoNode() {
        void getDriveForPhotos()
            .getMyPhotosRootFolder()
            .then((maybeNode) => {
                const { node } = getNodeEntity(maybeNode);
                if (!node.deprecatedShareId) {
                    return Promise.reject('Missing deprecatedShareId for recovery');
                }
                setRootPhotoNode(node);
            });
    }, []);

    const shareId = rootPhotoNode?.deprecatedShareId;
    const linkId = rootPhotoNode ? splitNodeUid(rootPhotoNode.uid).nodeId : undefined;
    const volumeId = rootPhotoNode ? splitNodeUid(rootPhotoNode.uid).volumeId : undefined;

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
            let totalNbLinks = 0;

            for (const share of shares) {
                const { links } = getCachedChildren(abortSignal, share.shareId, share.rootLinkId);
                const trashLinks = getCachedTrashed(abortSignal, share.volumeId).links.filter(
                    (link) => !!link.activeRevision?.photo
                );
                const allLinks = links.concat(trashLinks);
                allRestoredData.push({ links: allLinks, shareId: share.shareId });
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
                    await api(queryDeletePhotosShare(share.volumeId, share.shareId));
                    removeShares([share.shareId]);
                }
            }
        },
        [api, getCachedChildren, getCachedTrashed, removeShares]
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

                await getBusDriver().emit(
                    {
                        type: BusDriverEventName.UPDATED_NODES,
                        items: successes.map((successLinkId) => ({
                            uid: generateNodeUid(volumeId, successLinkId),
                            parentUid: generateNodeUid(volumeId, newLinkId),
                        })),
                    },
                    getDriveForPhotos()
                );

                setCountOfUnrecoveredLinksLeft(
                    (prevState) => prevState - (successes.length + Object.keys(failures).length)
                );
                setCountOfFailedLinks((prevState) => prevState + Object.keys(failures).length);
            }
        },
        [recoverPhotoLinks, volumeId, shareId]
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
        if (state !== 'DECRYPTED' || !restoredShares) {
            return;
        }
        const abortController = new AbortController();
        setState('PREPARING');
        void handlePrepareLinks(abortController.signal, restoredShares)
            .then(({ allRestoredData, totalNbLinks }) => {
                setRestoredData(allRestoredData);
                if (totalNbLinks) {
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
