import { getDriveForPhotos } from '@proton/drive';

import { createDebouncedBuffer } from '../../utils/createDebouncedBuffer';
import { type PhotoItem, usePhotosStore } from '../usePhotos.store';

export const loadTimelinePhotos = async (abortSignal: AbortSignal) => {
    const drive = getDriveForPhotos();
    const photosStore = usePhotosStore.getState();
    photosStore.setLoading(true);
    const { push, drain } = createDebouncedBuffer<PhotoItem>((items) => usePhotosStore.getState().setPhotoItems(items));

    try {
        for await (const photo of drive.iterateTimeline(abortSignal)) {
            push({
                nodeUid: photo.nodeUid,
                captureTime: photo.captureTime,
                tags: photo.tags,
                relatedPhotoNodeUids: [],
            });
        }
        drain();
    } finally {
        photosStore.setLoading(false);
    }
};
