import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { uploadManager } from '@proton/drive/modules/upload';

import { useAlbumPhotoUploadSDKStore } from '../PhotosStore/useAlbumPhotoUploadSDK.store';

/**
 * Subscribes to upload completion events and links newly uploaded photos to
 * their target album via `onAddAlbumPhotos`.
 *
 * The target albumNodeUid for each upload is stored in
 * `useAlbumPhotoUploadSDKStore` at queue time (drag-drop or upload button).
 * On `file:complete` or `photo:exist` (duplicate), this subscriber reads that
 * context and adds the photo to the album.
 *
 * Unsubscription is deferred when uploads are still in flight at cleanup time
 * (e.g. component unmount mid-upload). The subscriber keeps running until all
 * pending uploads finish, then removes itself.
 *
 * Returns a cleanup function to be called from a useEffect destructor.
 */
export const subscribeToAlbumUploadEvents = (
    onAddAlbumPhotos: (albumNodeUid: string, nodeUids: string[], showNotifications: boolean) => void
): (() => void) => {
    let needUnsubscribe = false;

    uploadManager.subscribeToEvents('photos-layout-album', async (event) => {
        if (!((event.type === 'file:complete' && event.isForPhotos) || event.type === 'photo:exist')) {
            return;
        }
        const albumNodeUid = useAlbumPhotoUploadSDKStore.getState().getContext(event.uploadId);
        if (!albumNodeUid) {
            return;
        }
        try {
            const nodeUid = event.type === 'file:complete' ? event.nodeUid : event.duplicateUids[0];
            onAddAlbumPhotos(albumNodeUid, [nodeUid], false);
        } catch (e) {
            handleSdkError(e);
        }
        useAlbumPhotoUploadSDKStore.getState().deleteContext(event.uploadId);
        if (needUnsubscribe && !useAlbumPhotoUploadSDKStore.getState().hasPendingUploads()) {
            uploadManager.unsubscribeFromEvents('photos-layout-album');
        }
    });

    return () => {
        if (!useAlbumPhotoUploadSDKStore.getState().hasPendingUploads()) {
            uploadManager.unsubscribeFromEvents('photos-layout-album');
        } else {
            needUnsubscribe = true;
        }
    };
};
