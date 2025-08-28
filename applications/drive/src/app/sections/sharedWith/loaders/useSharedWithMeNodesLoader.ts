import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import { splitNodeUid, useDrive } from '@proton/drive/index';

import useVolumesState from '../../../store/_volumes/useVolumesState';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { handleSdkError, useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getIsAnonymousUser } from '../../../utils/sdk/getIsAnonymousUser';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

export const useSharedWithMeNodesLoader = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
    const { setVolumeShareIds } = useVolumesState();

    const { setSharedWithMeItemInStore, setLoadingNodes, cleanupStaleItems } = useSharedWithMeListingStore(
        useShallow((state) => ({
            setSharedWithMeItemInStore: state.setSharedWithMeItem,
            setLoadingNodes: state.setLoadingNodes,
            cleanupStaleItems: state.cleanupStaleItems,
        }))
    );

    const loadSharedWithMeNodes = useCallback(
        async (abortSignal: AbortSignal) => {
            if (useSharedWithMeListingStore.getState().isLoadingNodes) {
                return;
            }
            setLoadingNodes(true);
            try {
                let showErrorNotification = false;
                const loadedUids = new Set<string>();
                const volumeShareMap = new Map<string, string[]>();

                for await (const sharedWithMeMaybeNode of drive.iterateSharedNodesWithMe(abortSignal)) {
                    try {
                        const { node } = getNodeEntity(sharedWithMeMaybeNode);
                        const signatureResult = getSignatureIssues(sharedWithMeMaybeNode);
                        const isAnonymousUser = getIsAnonymousUser(sharedWithMeMaybeNode);
                        if (!node.deprecatedShareId) {
                            handleSdkError(
                                new EnrichedError('The shared with me node entity is missing deprecatedShareId', {
                                    tags: { component: 'drive-sdk' },
                                    extra: { uid: node.uid },
                                }),
                                { showNotification: false }
                            );
                            continue;
                        }
                        if (!node.membership) {
                            handleSdkError(
                                new EnrichedError('Shared with me node have missing membership', {
                                    tags: { component: 'drive-sdk' },
                                    extra: {
                                        uid: node.uid,
                                        message:
                                            'The shared with me node entity is missing membershif info. It could be race condition and means it is probably not shared anymore.',
                                    },
                                }),
                                { showNotification: false }
                            );
                            continue;
                        }
                        const { nodeId, volumeId } = splitNodeUid(node.uid);

                        // TODO: Remove that when we will fully migrate to upload using sdk
                        // Basically for upload we need to have the volume inside our volume state
                        const currentShareIds = volumeShareMap.get(volumeId);
                        volumeShareMap.set(
                            volumeId,
                            currentShareIds ? [...currentShareIds, node.deprecatedShareId] : [node.deprecatedShareId]
                        );

                        loadedUids.add(node.uid);
                        setSharedWithMeItemInStore({
                            nodeUid: node.uid,
                            name: node.name,
                            type: node.type,
                            mediaType: node.mediaType,
                            itemType: ItemType.DIRECT_SHARE,
                            thumbnailId: node.activeRevision?.uid || node.uid,
                            size: node.totalStorageSize,
                            directShare: {
                                sharedOn: node.membership.inviteTime,
                                // TODO: Add indication that we weren't able to load the sharedBy, this way we will be able to show some info in the UI
                                sharedBy:
                                    (node.membership.sharedBy.ok
                                        ? node.membership.sharedBy.value
                                        : node.membership.sharedBy.error.claimedAuthor) || '',
                            },
                            haveSignatureIssues: !isAnonymousUser && !signatureResult.ok,
                            legacy: {
                                linkId: nodeId,
                                shareId: node.deprecatedShareId,
                                volumeId: volumeId,
                            },
                        });
                    } catch (e) {
                        handleError(e, {
                            showNotification: false,
                        });
                        showErrorNotification = true;
                    }
                }

                for (const [volumeId, shareIdsArray] of volumeShareMap) {
                    setVolumeShareIds(volumeId, shareIdsArray);
                }

                if (showErrorNotification) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`We were not able to load some items shared with you`,
                    });
                }

                cleanupStaleItems(ItemType.DIRECT_SHARE, loadedUids);
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`We were not able to load some of your shared items` });
            } finally {
                setLoadingNodes(false);
            }
        },
        [
            /* setVolumeShareIds is unstable, ignore it */
            // setVolumeShareIds,
            drive,
            handleError,
            createNotification,
            setSharedWithMeItemInStore,
            setLoadingNodes,
            cleanupStaleItems,
        ]
    );

    return {
        loadSharedWithMeNodes,
    };
};
