import { getDrive, getDriveForPhotos } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { uploadManager } from '@proton/drive/modules/upload';

export const subscribeToUploadEvents = (): (() => void) => {
    const busDriver = getBusDriver();
    uploadManager.subscribeToEvents('transfer-manager', async (event) => {
        if (event.type === 'file:complete') {
            await busDriver.emit(
                {
                    type: event.isUpdatedNode ? BusDriverEventName.UPDATED_NODES : BusDriverEventName.CREATED_NODES,
                    items: [{ uid: event.nodeUid, parentUid: event.parentUid }],
                },
                event.isForPhotos ? getDriveForPhotos() : getDrive()
            );
        } else if (event.type === 'folder:complete') {
            await busDriver.emit(
                {
                    type: BusDriverEventName.CREATED_NODES,
                    items: [{ uid: event.nodeUid, parentUid: event.parentUid }],
                },
                getDrive()
            );
        }
    });

    return () => {
        uploadManager.unsubscribeFromEvents('transfer-manager');
    };
};
