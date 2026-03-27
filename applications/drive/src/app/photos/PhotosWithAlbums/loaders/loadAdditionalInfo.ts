import { getDriveForPhotos } from '@proton/drive';

import { createDebouncedBuffer } from '../../../utils/createDebouncedBuffer';
import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { usePhotosStore } from '../../usePhotos.store';
import { mapNodeToAdditionalInfo } from './mapNodeToAdditionalInfo';

const loadAdditionalInfo = async (uids: string[]) => {
    const store = usePhotosStore.getState();

    for await (const maybeNode of getDriveForPhotos().iterateNodes(uids)) {
        if (!maybeNode.ok) {
            continue;
        }
        const { uid, additionalInfo } = mapNodeToAdditionalInfo(maybeNode);
        store.upsertPhotoAdditionalInfo(uid, additionalInfo);
    }
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
