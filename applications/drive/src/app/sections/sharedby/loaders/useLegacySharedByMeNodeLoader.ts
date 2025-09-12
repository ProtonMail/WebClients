import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { NodeType, generateNodeUid } from '@proton/drive/index';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { useLinkPath } from '../../../store';
import { useLinksListing } from '../../../store/_links';
import { useDefaultShare } from '../../../store/_shares';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from '../../../store/_views/utils';
import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useLegacyErrorHandler } from '../../../utils/errorHandling/useLegacyErrorHandler';
import { legacyTimestampToDate } from '../../../utils/sdk/legacyTime';
import { useSharedByMeStore } from '../useSharedByMe.store';

export const useLegacySharedByMeNodeLoader = () => {
    const { handleError } = useLegacyErrorHandler();
    const { createNotification } = useNotifications();
    const { getDefaultPhotosShare } = useDefaultShare();
    const { getPath } = useLinkPath();
    const photoVolumeId = useRef<string>();

    const linksListing = useLinksListing();
    const abortSignal = useAbortSignal([]);
    const { links, isDecrypting } = linksListing.getCachedSharedByLink(abortSignal, photoVolumeId.current);

    const cachedLinks = useMemoArrayNoMatterTheOrder(links);

    const loadLegacySharedByMeLinks = useCallback(
        async (abortSignal: AbortSignal) => {
            try {
                const defaultPhotoShare = await getDefaultPhotosShare(abortSignal);
                if (!defaultPhotoShare) {
                    return;
                }
                photoVolumeId.current = defaultPhotoShare.volumeId;

                await linksListing.loadLinksSharedByMeLink(abortSignal, defaultPhotoShare.volumeId);
            } catch (error) {
                handleError(error, {
                    fallbackMessage: c('Error').t`We were not able to load some of your shared items`,
                });
            }
        },
        [, /* Not stable: getDefaultPhotosShare, linksListing */ handleError]
    );

    const populateNodesFromLegacy = useCallback(
        async (abortSignal: AbortSignal) => {
            const { setSharedByMeItem, cleanupStaleItems } = useSharedByMeStore.getState();
            const loadedUids = new Set<string>();
            let showErrorNotification = false;

            const nodesToProcess = cachedLinks.map((legacyNode) => {
                const uid = generateNodeUid(legacyNode.volumeId, legacyNode.linkId);
                return {
                    ...legacyNode,
                    id: uid,
                    uid,
                    isLegacy: true,
                    thumbnailId: legacyNode.activeRevision?.id || uid,
                };
            });

            for (const missingNode of nodesToProcess) {
                try {
                    const shareId = missingNode.shareId || missingNode.rootShareId;
                    if (!shareId) {
                        handleError(new EnrichedError("The node to process doesn't have shareId or rootShareId"), {
                            showNotification: false,
                        });
                        continue;
                    }

                    let nodeType = NodeType.Album;
                    if (missingNode.type === LinkType.FILE) {
                        nodeType = NodeType.File;
                    } else if (missingNode.type === LinkType.FOLDER) {
                        nodeType = NodeType.Folder;
                    }

                    loadedUids.add(missingNode.uid);
                    const location = await getPath(abortSignal, missingNode.rootShareId, missingNode.linkId);
                    setSharedByMeItem({
                        nodeUid: missingNode.uid,
                        name: missingNode.name,
                        type: nodeType,
                        mediaType: missingNode.mimeType,
                        size: missingNode.activeRevision?.size || missingNode.size,
                        // ParentUid is used for docs, legacy is photos/albums, we can ignore here
                        parentUid: undefined,
                        thumbnailId: missingNode.thumbnailId,
                        shareId,
                        rootShareId: missingNode.rootShareId,
                        haveSignatureIssues:
                            !missingNode.isAnonymous &&
                            Boolean(
                                missingNode.signatureIssues && Object.values(missingNode.signatureIssues).some(Boolean)
                            ),
                        isFromLegacy: true,
                        isLocked: missingNode.isLocked,
                        location,
                        // Return the oldest date of creation
                        creationTime: (() => {
                            const shareUrlCreateTime = missingNode.sharingDetails?.shareUrl?.createTime
                                ? legacyTimestampToDate(missingNode.sharingDetails?.shareUrl?.createTime)
                                : undefined;
                            const sharedOnTime = missingNode.sharedOn
                                ? legacyTimestampToDate(missingNode.sharedOn)
                                : undefined;

                            if (!shareUrlCreateTime && !sharedOnTime) {
                                return undefined;
                            }
                            if (!shareUrlCreateTime) {
                                return sharedOnTime;
                            }
                            if (!sharedOnTime) {
                                return shareUrlCreateTime;
                            }

                            return shareUrlCreateTime < sharedOnTime ? shareUrlCreateTime : sharedOnTime;
                        })(),
                    });
                } catch (e) {
                    handleError(e, { showNotification: false });
                    showErrorNotification = true;
                }
            }

            cleanupStaleItems(loadedUids, { legacyCleanup: true });

            if (showErrorNotification) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`We were not able to load some of your shared items`,
                });
            }
        },
        [, /* Not stable: getPath */ cachedLinks, handleError, createNotification]
    );

    useEffect(() => {
        if (cachedLinks.length === 0 || isDecrypting) {
            return;
        }
        const abortController = new AbortController();

        void populateNodesFromLegacy(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [populateNodesFromLegacy, cachedLinks, isDecrypting]);

    const handleLoadLegacySharedByMeLinks = useCallback(
        async (abortSignal: AbortSignal) => {
            const { isLoadingLegacyNodes, setLoadingLegacyNodes } = useSharedByMeStore.getState();
            if (isLoadingLegacyNodes) {
                return;
            }
            setLoadingLegacyNodes(true);
            await loadLegacySharedByMeLinks(abortSignal).catch(sendErrorReport);
            setLoadingLegacyNodes(false);
        },
        [loadLegacySharedByMeLinks]
    );

    return {
        loadLegacySharedByMeLinks: handleLoadLegacySharedByMeLinks,
        populateNodesFromLegacy,
    };
};
