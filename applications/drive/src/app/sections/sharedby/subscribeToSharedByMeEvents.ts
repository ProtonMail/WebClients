import type { ProtonDriveClient } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getFormattedNodeLocation } from '../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import type { SharedByMeItem } from './useSharedByMe.store';
import { useSharedByMeStore } from './useSharedByMe.store';
import { getOldestShareCreationTime } from './utils/getOldestShareCreationTime';

type Drive = Pick<ProtonDriveClient, 'getNode' | 'getSharingInfo'>;
const createSharedByMeItemFromNode = async (nodeUid: string, drive: Drive): Promise<SharedByMeItem | null> => {
    try {
        const sharedByMeMaybeNode = await drive.getNode(nodeUid);
        const signatureResult = getSignatureIssues(sharedByMeMaybeNode);
        const { node } = getNodeEntity(sharedByMeMaybeNode);

        if (!node.deprecatedShareId) {
            handleSdkError(
                new EnrichedError('The shared with me node entity is missing deprecatedShareId', {
                    tags: { component: 'drive-sdk' },
                    extra: { uid: node.uid },
                })
            );
            return null;
        }

        const location = await getFormattedNodeLocation(drive, sharedByMeMaybeNode);
        const shareResult = await drive.getSharingInfo(node.uid);
        const oldestCreationTime = shareResult ? getOldestShareCreationTime(shareResult) : undefined;
        const rootNode = await getRootNode(node, drive);

        return {
            nodeUid: node.uid,
            name: node.name,
            type: node.type,
            mediaType: node.mediaType,
            size: node.activeRevision?.storageSize || node.totalStorageSize,
            parentUid: node.parentUid,
            thumbnailId: node.activeRevision?.uid || node.uid,
            location,
            creationTime: oldestCreationTime,
            publicLink: shareResult?.publicLink
                ? {
                      numberOfInitializedDownloads: shareResult.publicLink.numberOfInitializedDownloads,
                      url: shareResult.publicLink.url,
                      expirationTime: shareResult.publicLink.expirationTime,
                  }
                : undefined,
            shareId: node.deprecatedShareId,
            rootShareId: rootNode.deprecatedShareId || node.deprecatedShareId,
            haveSignatureIssues: !signatureResult.ok,
        };
    } catch (error) {
        handleSdkError(error);
        return null;
    }
};

export const subscribeToSharedByMeEvents = (drive: Drive) => {
    const eventManager = getBusDriver();

    const createSubscription = eventManager.subscribe(BusDriverEventName.CREATED_NODES, async (event) => {
        const store = useSharedByMeStore.getState();

        for (const item of event.items) {
            if (item.isShared && !store.getSharedByMeItem(item.uid)) {
                const sharedByMeItem = await createSharedByMeItemFromNode(item.uid, drive);
                if (sharedByMeItem) {
                    store.setSharedByMeItem(sharedByMeItem);
                }
            }
        }
    });

    const updateSubscription = eventManager.subscribe(BusDriverEventName.UPDATED_NODES, async (event) => {
        const store = useSharedByMeStore.getState();

        for (const item of event.items) {
            if (item.isShared === false && store.getSharedByMeItem(item.uid)) {
                store.removeSharedByMeItem(item.uid);
            } else if (item.isShared) {
                const sharedByMeItem = await createSharedByMeItemFromNode(item.uid, drive);
                if (sharedByMeItem) {
                    store.setSharedByMeItem(sharedByMeItem);
                }
            }
        }
    });

    const deleteSubscription = eventManager.subscribe(BusDriverEventName.DELETED_NODES, async (event) => {
        const store = useSharedByMeStore.getState();

        for (const uid of event.uids) {
            if (store.getSharedByMeItem(uid)) {
                store.removeSharedByMeItem(uid);
            }
        }
    });

    return () => {
        createSubscription();
        updateSubscription();
        deleteSubscription();
    };
};
