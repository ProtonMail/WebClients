import { getDrive, getDriveForPhotos } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { uploadManager } from '@proton/drive/modules/upload';

import { getNodeEntity } from '../../utils/sdk/getNodeEntity';

export const subscribeToUploadEvents = (): (() => void) => {
    const busDriver = getBusDriver();
    uploadManager.subscribeToEvents('transfer-manager', async (event) => {
        if (event.type === 'file:complete') {
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
