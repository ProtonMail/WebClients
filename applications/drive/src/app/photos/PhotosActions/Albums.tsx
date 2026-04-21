import { c } from 'ttag';

import { type NodeEntity, PhotoTag, getDriveForPhotos } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { getNotificationsManager } from '../../modules/notifications';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getEllipsedName } from '../../utils/intl/getEllipsedName';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { usePhotosStore } from '../usePhotos.store';

export const createAlbum = async (name: string): Promise<NodeEntity | undefined> => {
    const ellipsedName = getEllipsedName(name);
    try {
        const { node } = getNodeEntity(await getDriveForPhotos().createAlbum(name));
        await getBusDriver().emit(
            {
                type: BusDriverEventName.CREATED_NODES,
                items: [
                    {
                        uid: node.uid,
                        parentUid: node.parentUid,
                    },
                ],
            },
            getDriveForPhotos()
        );
        getNotificationsManager().createNotification({
            text: c('Notification').t`"${ellipsedName}" created successfully`,
            preWrap: true,
        });
        return node;
    } catch (e) {
        handleSdkError(e);
    }
};

export const renameAlbum = async (nodeUid: string, name: string): Promise<void> => {
    try {
        const maybeNode = await getDriveForPhotos().updateAlbum(nodeUid, {
            name,
        });
        await getBusDriver().emit(
            {
                type: BusDriverEventName.UPDATED_NODES,
                items: [
                    {
                        uid: maybeNode.ok ? maybeNode.value.uid : maybeNode.error.uid,
                        parentUid: maybeNode.ok ? maybeNode.value.parentUid : maybeNode.error.parentUid,
                        isShared: maybeNode.ok ? maybeNode.value.isShared : maybeNode.error.isShared,
                    },
                ],
            },
            getDriveForPhotos()
        );
        getNotificationsManager().createNotification({
            text: <span className="text-pre-wrap">{c('Notification').t`Album renamed successfully`}</span>,
        });
    } catch (e) {
        handleSdkError(e);
    }
};

// TODO: Check if we click really really fast, so maybe some abortController needed
export const toggleFavorite = async (nodeUid: string) => {
    const photoItem = usePhotosStore.getState().getPhotoItem(nodeUid);
    if (!photoItem) {
        return;
    }
    const isFavorite = photoItem.tags.includes(PhotoTag.Favorites);
    try {
        await Array.fromAsync(
            getDriveForPhotos().updatePhotos([
                {
                    nodeUid,
                    tagsToAdd: isFavorite ? undefined : [PhotoTag.Favorites],
                    tagsToRemove: isFavorite ? [PhotoTag.Favorites] : undefined,
                },
            ])
        );
        await getBusDriver().emit(
            {
                type: BusDriverEventName.UPDATED_NODES,
                items: [{ uid: nodeUid, parentUid: photoItem.additionalInfo?.parentNodeUid }],
            },
            getDriveForPhotos()
        );

        // Show notification only when favoriting from a shared album (i.e. the photo is copied to own stream).
        // We check if the photo's parent is NOT the user's own photos root folder.
        const photosRootFolder = await getDriveForPhotos().getMyPhotosRootFolder();
        const photosRootFolderUid = photosRootFolder.ok ? photosRootFolder.value.uid : undefined;
        const isOwnPhoto = photosRootFolderUid && photoItem.additionalInfo?.parentNodeUid === photosRootFolderUid;
        if (!isOwnPhoto && !isFavorite) {
            getNotificationsManager().createNotification({
                text: c('Info').t`Photo was copied to stream and marked favorite there.`,
            });
        }
    } catch (e) {
        handleSdkError(e, {
            showNotification: true,
            fallbackMessage: isFavorite
                ? c('Error').t`Could not remove from favorites`
                : c('Error').t`Could not add to favorites`,
        });
    }
};
