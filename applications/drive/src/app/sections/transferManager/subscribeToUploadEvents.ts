import { getDriveForPhotos } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { getNodeEffectiveRole } from '@proton/drive/internal/sdkUtils/getNodeEffectiveRole';
import { uploadManager } from '@proton/drive/modules/upload';
import { getNodeEntityFromMaybeNode } from '@proton/drive/modules/upload/utils/getNodeEntityFromMaybeNode';

import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { useTransferManagerStore } from './transferManager.store';

export const subscribeToUploadEvents = (): (() => void) => {
    const busDriver = getBusDriver();
    uploadManager.subscribeToEvents('transfer-manager', async (event, driveClient) => {
        if (event.type === 'file:complete') {
            if (event.parentUid) {
                const maybeNode = await driveClient.getNode(event.parentUid);
                const { node } = await getNodeEntityFromMaybeNode(maybeNode);
                const role = await getNodeEffectiveRole(node, driveClient);
                useTransferManagerStore.getState().addItem(event.uploadId, { role, type: 'upload' });
            }

            const photosRootNode = event.isForPhotos
                ? getNodeEntity(await getDriveForPhotos().getMyPhotosRootFolder()).node
                : undefined;
            await busDriver.emit(
                {
                    type: event.isUpdatedNode ? BusDriverEventName.UPDATED_NODES : BusDriverEventName.CREATED_NODES,
                    items: [
                        // TODO: Quick hack to know it is for photos section
                        // We need to improve that somehow as we listen for the event in photos section,
                        // and we need to know if it's for this section
                        { uid: event.nodeUid, parentUid: event.isForPhotos ? photosRootNode?.uid : event.parentUid },
                    ],
                },
                driveClient
            );
        } else if (event.type === 'folder:complete') {
            await busDriver.emit(
                {
                    type: BusDriverEventName.CREATED_NODES,
                    items: [{ uid: event.nodeUid, parentUid: event.parentUid }],
                },
                driveClient
            );
        }
    });

    return () => {
        uploadManager.unsubscribeFromEvents('transfer-manager');
    };
};
