import { ValidationError } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { logging } from '@proton/drive/modules/logging';
import { getNodeEffectiveRole } from '@proton/drive/modules/nodes';
import { uploadManager } from '@proton/drive/modules/upload';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { TransferManagerBannerType, useTransferManagerStore } from './transferManager.store';

const logger = logging.getLogger('transfer-manager');

export const subscribeToUploadEvents = (): (() => void) => {
    const busDriver = getBusDriver();
    uploadManager.subscribeToEvents('transfer-manager', async (event, driveClient) => {
        if (event.type === 'file:complete') {
            try {
                const maybeNode = await driveClient.getNode(event.nodeUid);
                const role = await getNodeEffectiveRole(maybeNode, driveClient);
                useTransferManagerStore.getState().addItem(event.uploadId, { role, type: 'upload' });
            } catch (error) {
                logger.error('Failed to load role of uploaded node', error);
            }

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
        } else if (event.type === 'file:error') {
            if (
                event.error instanceof ValidationError &&
                event.error.code === API_CUSTOM_ERROR_CODES.INSUFFICIENT_STORAGE
            ) {
                useTransferManagerStore.getState().setBannerType(TransferManagerBannerType.StorageFull);
            }
        }
    });

    return () => {
        uploadManager.unsubscribeFromEvents('transfer-manager');
    };
};
