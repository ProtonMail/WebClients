import { getDrive } from '@proton/drive';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getNodeLocation } from '../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import type { SharedByMeItem } from './useSharedByMe.store';
import { useSharedByMeStore } from './useSharedByMe.store';
import { getOldestShareCreationTime } from './utils/getOldestShareCreationTime';

const createSharedByMeItemFromNode = async (nodeUid: string): Promise<SharedByMeItem | null> => {
    try {
        const drive = getDrive();
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

        const location = await getNodeLocation(drive, sharedByMeMaybeNode);
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

export const subscribeToSharedByMeEvents = () => {
    const eventManager = getActionEventManager();

    const createSubscription = eventManager.subscribe(ActionEventName.CREATED_NODES, async (event) => {
        const store = useSharedByMeStore.getState();

        for (const item of event.items) {
            if (item.isShared && !store.getSharedByMeItem(item.uid)) {
                const sharedByMeItem = await createSharedByMeItemFromNode(item.uid);
                if (sharedByMeItem) {
                    store.setSharedByMeItem(sharedByMeItem);
                }
            }
        }
    });

    const updateSubscription = eventManager.subscribe(ActionEventName.UPDATED_NODES, async (event) => {
        const store = useSharedByMeStore.getState();

        for (const item of event.items) {
            if (!item.isShared && store.getSharedByMeItem(item.uid)) {
                store.removeSharedByMeItem(item.uid);
            } else if (item.isShared) {
                const sharedByMeItem = await createSharedByMeItemFromNode(item.uid);
                if (sharedByMeItem) {
                    store.setSharedByMeItem(sharedByMeItem);
                }
            }
        }
    });

    const deleteSubscription = eventManager.subscribe(ActionEventName.DELETED_NODES, async (event) => {
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
