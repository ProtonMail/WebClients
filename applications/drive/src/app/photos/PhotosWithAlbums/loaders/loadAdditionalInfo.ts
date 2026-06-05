import { getDriveForPhotos } from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';

import { createDebouncedBuffer } from '../../../utils/createDebouncedBuffer';
import { type PhotoItem, usePhotosStore } from '../../usePhotos.store';
import { mapNodeToPhotoItem } from './mapNodeToAdditionalInfo';

const { push: pushPhotoItem, drain: drainPhotoItems } = createDebouncedBuffer<PhotoItem>((items) => {
    usePhotosStore.getState().upsertPhotoAdditionalInfoBulk(items);
});

const loadAdditionalInfo = async (uids: string[]) => {
    for await (const maybeNode of getDriveForPhotos().iterateNodes(uids)) {
        if (!maybeNode.ok) {
            continue;
        }
        const photoItem = mapNodeToPhotoItem(maybeNode);
        if (photoItem) {
            pushPhotoItem(photoItem);
        }
    }
    drainPhotoItems();
};

const { push } = createDebouncedBuffer<{ uid: string; shouldProcess: () => boolean }>((items) => {
    const store = usePhotosStore.getState();
    const unloaded = items
        .filter(({ uid, shouldProcess }) => !store.getPhotoItem(uid)?.additionalInfo && shouldProcess())
        .map(({ uid }) => uid);
    if (unloaded.length) {
        loadAdditionalInfo(unloaded).catch(handleSdkError);
    }
});

export const enqueueAdditionalInfo = (uid: string, shouldProcess: () => boolean) => push({ uid, shouldProcess });
