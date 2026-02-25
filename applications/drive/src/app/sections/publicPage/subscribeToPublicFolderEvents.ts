import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { sendErrorReport } from '../../utils/errorHandling';
import { ComponentTag, EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getPublicLinkClient } from './publicLinkClient';
import { usePublicAuthStore } from './usePublicAuth.store';
import { usePublicFolderStore } from './usePublicFolder.store';

const addPublicFolderItemToStore = async (uid: string) => {
    try {
        const maybeNode = await getPublicLinkClient().getNode(uid);
        const { node } = getNodeEntity(maybeNode);
        const modificationTime = node.activeRevision?.claimedModificationTime
            ? node.activeRevision.claimedModificationTime
            : node.creationTime;
        const size = getNodeDisplaySize(maybeNode);
        usePublicFolderStore.getState().setItem({
            uid: node.uid,
            name: node.name,
            type: node.type,
            mediaType: node.mediaType,
            thumbnailId: node.activeRevision?.uid || node.uid,
            size,
            parentUid: node.parentUid,
            creationTime: node.creationTime,
            modificationTime,
            haveSignatureIssues: usePublicAuthStore.getState().isLoggedIn ? !getSignatureIssues(maybeNode).ok : false,
            uploadedBy: (node.keyAuthor.ok ? node.keyAuthor.value : node.keyAuthor.error.claimedAuthor) || undefined,
        });
    } catch (e) {
        handleSdkError(e, { showNotification: false });
    }
};

export const subscribeToPublicFolderEvents = () => {
    const unsubscribeFromEvents = getBusDriver().subscribe(BusDriverEventName.ALL, async (event) => {
        const store = usePublicFolderStore.getState();
        const { folder } = store;
        if (!folder) {
            const errorMessage = 'Event emitted before folder has been loaded';
            const error = new EnrichedError(errorMessage, {
                tags: { component: ComponentTag.driveSdk },
                extra: { eventType: event.type },
            });
            sendErrorReport(error);
            console.error(errorMessage, event);
            return;
        }
        switch (event.type) {
            case BusDriverEventName.RENAMED_NODES:
                for (const item of event.items) {
                    store.updateItem(item.uid, { name: item.newName });
                }
                break;
            case BusDriverEventName.MOVED_NODES:
                for (const item of event.items) {
                    if (item.parentUid !== folder.uid) {
                        store.removeItem(item.uid);
                    }
                }
                break;
            case BusDriverEventName.UPDATED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid) {
                        void addPublicFolderItemToStore(item.uid);
                    }
                }
                break;
            case BusDriverEventName.CREATED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid) {
                        void addPublicFolderItemToStore(item.uid);
                        const { isLoggedIn, addUploadedFile } = usePublicAuthStore.getState();
                        if (!isLoggedIn) {
                            addUploadedFile(item.uid);
                        }
                    }
                }
                break;
            case BusDriverEventName.DELETED_NODES:
                for (const uid of event.uids) {
                    store.removeItem(uid);
                }
                usePublicAuthStore.getState().removeUploadedFiles(event.uids);
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
    };
};
