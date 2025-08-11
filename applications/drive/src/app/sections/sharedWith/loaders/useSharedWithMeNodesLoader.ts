import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useNotifications } from '@proton/components';
import { splitNodeUid, useDrive } from '@proton/drive/index';

import useVolumesState from '../../../store/_volumes/useVolumesState';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { legacyTimestampToDate } from '../../../utils/sdk/legacyTime';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useSharedInfoBatcher } from '../legacy/useLegacyDirectSharingInfo';

export const useSharedWithMeNodesLoader = () => {
    const { drive } = useDrive();
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
    const { loadSharedInfo } = useSharedInfoBatcher();
    const { setVolumeShareIds } = useVolumesState();

    const { setSharedWithMeItemInStore, setLoadingNodes } = useSharedWithMeListingStore(
        useShallow((state) => ({
            setSharedWithMeItemInStore: state.setSharedWithMeItem,
            setLoadingNodes: state.setLoadingNodes,
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
                const volumeShareMap = new Map<string, string[]>();

                for await (const sharedWithMeMaybeNode of drive.iterateSharedNodesWithMe(abortSignal)) {
                    try {
                        const { node } = getNodeEntity(sharedWithMeMaybeNode);
                        const shareId = node.deprecatedShareId;
                        if (!shareId) {
                            throw new EnrichedError('The shared with me node entity is missing deprecatedShareId', {
                                extra: { uid: node.uid },
                            });
                        }
                        const { nodeId, volumeId } = splitNodeUid(node.uid);

                        // TODO: Remove that when we will fully migrate to upload using sdk
                        // Basically for upload we need to have the volume inside our volume state
                        const currentShareIds = volumeShareMap.get(volumeId);
                        volumeShareMap.set(volumeId, currentShareIds ? [...currentShareIds, shareId] : [shareId]);

                        loadSharedInfo(shareId, (sharedInfo) => {
                            if (!sharedInfo) {
                                console.warn(
                                    'The shared with me node entity is missing sharing info. It could be race condition and means it is probably not shared anymore.',
                                    { uid: nodeId, shareId }
                                );
                                return;
                            }
                            setSharedWithMeItemInStore({
                                nodeUid: node.uid,
                                name: node.name,
                                type: node.type,
                                mediaType: node.mediaType,
                                itemType: ItemType.DIRECT_SHARE,
                                thumbnailId: node.activeRevision?.uid || node.uid,
                                size: node.totalStorageSize,
                                directShare: {
                                    sharedOn: legacyTimestampToDate(sharedInfo.sharedOn),
                                    sharedBy: sharedInfo.sharedBy,
                                },
                                legacy: {
                                    linkId: nodeId,
                                    shareId,
                                    volumeId: volumeId,
                                },
                            });
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
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`We were not able to load some of your shared items` });
            } finally {
                setLoadingNodes(false);
            }
        },
        [
            // getDefaultShare is not stable we should ignore it
            /* getDefaultShare */
            drive,
            handleError,
            createNotification,
            loadSharedInfo,
            setSharedWithMeItemInStore,
            setLoadingNodes,
            setVolumeShareIds,
        ]
    );

    return {
        loadSharedWithMeNodes,
    };
};
