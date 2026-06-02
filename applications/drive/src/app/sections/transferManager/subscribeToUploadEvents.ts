import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { getNodeEffectiveRole } from '@proton/drive/modules/nodes';
import { uploadManager } from '@proton/drive/modules/upload';

import { useTransferManagerStore } from './transferManager.store';

export const subscribeToUploadEvents = (): (() => void) => {
    const busDriver = getBusDriver();
    uploadManager.subscribeToEvents('transfer-manager', async (event, driveClient) => {
        if (event.type === 'file:complete') {
            const maybeNode = await driveClient.getNode(event.nodeUid);
            const { node } = getNodeEntity(maybeNode);
            const role = await getNodeEffectiveRole(node, driveClient);
            useTransferManagerStore.getState().addItem(event.uploadId, { role, type: 'upload' });

            await busDriver.emit(
                {
                    type: event.isUpdatedNode ? BusDriverEventName.UPDATED_NODES : BusDriverEventName.CREATED_NODES,
                    items: [{ uid: event.nodeUid, parentUid: event.parentUid }],
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
