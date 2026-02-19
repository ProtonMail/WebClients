import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { type ProtonDriveClient, getDrive, getDriveForPhotos } from '@proton/drive';

import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getFormattedNodeLocation } from '../../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useSharedByMeStore } from '../useSharedByMe.store';
import { getOldestShareCreationTime } from '../utils/getOldestShareCreationTime';

type Drive = Pick<ProtonDriveClient, 'iterateSharedNodes' | 'getSharingInfo' | 'getNode' | 'iterateNodes'>;

export const useSharedByMeNodesLoader = () => {
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const fetchSharedByNodes = useCallback(
        async (abortSignal: AbortSignal, drive: Drive): Promise<Set<string>> => {
            const { setSharedByMeItem } = useSharedByMeStore.getState();
            let showErrorNotification = false;
            const loadedUids = new Set<string>();

            for await (const sharedByMeMaybeNode of drive.iterateSharedNodes(abortSignal)) {
                try {
                    const { node } = getNodeEntity(sharedByMeMaybeNode);
                    const signatureResult = getSignatureIssues(sharedByMeMaybeNode);
                    if (!node.deprecatedShareId) {
                        handleError(
                            new EnrichedError('The shared with me node entity is missing deprecatedShareId', {
                                tags: { component: 'drive-sdk' },
                                extra: { uid: node.uid },
                            }),
                            { showNotification: false }
                        );
                        continue;
                    }

                    loadedUids.add(node.uid);

                    void getFormattedNodeLocation(drive, sharedByMeMaybeNode).then((location) => {
                        const { updateSharedByMeItem } = useSharedByMeStore.getState();
                        updateSharedByMeItem(node.uid, {
                            nodeUid: node.uid,
                            location,
                        });
                    });

                    void drive.getSharingInfo(node.uid).then((shareResult) => {
                        if (!shareResult) {
                            return;
                        }
                        const { updateSharedByMeItem } = useSharedByMeStore.getState();
                        // TODO: Update or remove that once we figure out what product want in "Created" column
                        const oldestCreationTime = getOldestShareCreationTime(shareResult);

                        if (shareResult.publicLink) {
                            updateSharedByMeItem(node.uid, {
                                nodeUid: node.uid,
                                creationTime: oldestCreationTime,
                                publicLink: {
                                    expirationTime: shareResult.publicLink.expirationTime,
                                    numberOfInitializedDownloads: shareResult.publicLink.numberOfInitializedDownloads,
                                    url: shareResult.publicLink.url,
                                },
                            });
                        } else if (oldestCreationTime) {
                            updateSharedByMeItem(node.uid, {
                                nodeUid: node.uid,
                                creationTime: oldestCreationTime,
                            });
                        }
                    });

                    const rootNode = await getRootNode(node, drive);

                    setSharedByMeItem({
                        nodeUid: node.uid,
                        name: node.name,
                        type: node.type,
                        mediaType: node.mediaType,
                        thumbnailId: node.activeRevision?.uid || node.uid,
                        shareId: node.deprecatedShareId,
                        rootShareId: rootNode.deprecatedShareId || node.deprecatedShareId,
                        size: node.activeRevision?.storageSize || node.totalStorageSize,
                        parentUid: node.parentUid,
                        haveSignatureIssues: !signatureResult.ok,
                    });
                } catch (e) {
                    handleError(e, {
                        showNotification: false,
                    });
                    showErrorNotification = true;
                }
            }
            if (showErrorNotification) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`We were not able to load some items shared with you`,
                });
            }

            return loadedUids;
        },
        [createNotification, handleError]
    );

    const loadSharedByMeNodes = useCallback(
        async (abortSignal: AbortSignal) => {
            const { isLoadingNodes, setLoadingNodes, cleanupStaleItems } = useSharedByMeStore.getState();
            if (isLoadingNodes) {
                return;
            }
            setLoadingNodes(true);
            try {
                const [driveUids, photosUids] = await Promise.all([
                    fetchSharedByNodes(abortSignal, getDrive()),
                    fetchSharedByNodes(abortSignal, getDriveForPhotos()),
                ]);
                if (!abortSignal.aborted) {
                    cleanupStaleItems(new Set([...driveUids, ...photosUids]));
                }
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`We were not able to load some of your shared items` });
            } finally {
                setLoadingNodes(false);
            }
        },
        [fetchSharedByNodes, handleError]
    );

    return {
        loadSharedByMeNodes,
    };
};
