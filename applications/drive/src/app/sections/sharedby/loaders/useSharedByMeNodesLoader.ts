import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive';

import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getNodeLocation } from '../../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { useSharedByMeStore } from '../useSharedByMe.store';

export const useSharedByMeNodesLoader = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();

    const loadSharedByMeNodes = useCallback(
        async (abortSignal: AbortSignal) => {
            const { isLoadingNodes, setLoadingNodes, setSharedByMeItem, cleanupStaleItems } =
                useSharedByMeStore.getState();
            if (isLoadingNodes) {
                return;
            }
            setLoadingNodes(true);
            try {
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

                        void getNodeLocation(drive, sharedByMeMaybeNode).then((location) => {
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
                            if (shareResult.publicLink) {
                                updateSharedByMeItem(node.uid, {
                                    nodeUid: node.uid,
                                    creationTime: shareResult.publicLink.creationTime,
                                    publicLink: {
                                        expirationTime: shareResult.publicLink.expirationTime,
                                        numberOfInitializedDownloads:
                                            shareResult.publicLink.numberOfInitializedDownloads,
                                        url: shareResult.publicLink.url,
                                    },
                                });
                            }
                        });

                        setSharedByMeItem({
                            nodeUid: node.uid,
                            name: node.name,
                            type: node.type,
                            mediaType: node.mediaType,
                            thumbnailId: node.activeRevision?.uid || node.uid,
                            shareId: node.deprecatedShareId,
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

                cleanupStaleItems(loadedUids);
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`We were not able to load some of your shared items` });
            } finally {
                setLoadingNodes(false);
            }
        },
        [drive, handleError, createNotification]
    );

    return {
        loadSharedByMeNodes,
    };
};
