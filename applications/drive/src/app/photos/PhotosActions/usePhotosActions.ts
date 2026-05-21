import { useCallback, useState } from 'react';

import { c, msgid } from 'ttag';

import { useConfirmActionModal, useModalStateObject, useNotifications } from '@proton/components';
import { ServerError, getDriveForPhotos } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { useSharingModal } from '@proton/drive/modules/sharingModal';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import useNavigate from '../../legacy/hooks/drive/useNavigate';
import { useSharingActions } from '../../legacy/hooks/drive/useSharingActions';
import { useDetailsModal } from '../../modals/DetailsModal';
import { getNotificationsManager } from '../../modules/notifications';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { useDeleteAlbumModal } from '../PhotosModals/DeleteAlbumModal';
import { useRemoveAlbumPhotosModal } from '../PhotosModals/RemoveAlbumPhotosModal';
import { useAlbumsStore } from '../useAlbums.store';
import { usePhotosStore } from '../usePhotos.store';
import { createAlbum } from './Albums';

// showNotifications is mostly for upload as they come one by one,
// we don't want to show one notification per upload
const addPhotosToAlbum = async (
    albumNodeUid: string,
    photoUids: string[],
    showNotifications: boolean = true
): Promise<void> => {
    const drive = getDriveForPhotos();
    const addedUids: string[] = [];
    const errors = [];
    const albumItem = useAlbumsStore.getState().albums.get(albumNodeUid);
    try {
        for await (const result of drive.addPhotosToAlbum(albumNodeUid, photoUids)) {
            if (!result.ok) {
                if (
                    result.error instanceof ServerError &&
                    result.error.code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS
                ) {
                    continue;
                }
                handleSdkError(result.error, { showNotification: false });
                errors.push(result.error);
            } else {
                addedUids.push(result.uid);
            }
        }
        if (showNotifications && addedUids.length && albumItem?.name) {
            const albumName = albumItem.name;
            getNotificationsManager().createNotification({
                type: 'success',
                text: c('Notification').ngettext(
                    msgid`${addedUids.length} photo have been added to "${albumName}"`,
                    `${addedUids.length} photos have been added to "${albumName}"`,
                    addedUids.length
                ),
                preWrap: true,
            });
        }
        if (errors.length !== 0) {
            getNotificationsManager().createNotification({
                text: c('Info').ngettext(
                    msgid`We were not able to add this photo to your album`,
                    `We were not able to add some photos to your album`,
                    errors.length
                ),
            });
        }
        await getBusDriver().emit(
            {
                type: BusDriverEventName.UPDATED_NODES,
                // Not necessary as it can be on shared album
                items: [{ uid: albumNodeUid, parentUid: albumItem?.parentNodeUid, isShared: albumItem?.isShared }],
            },
            getDriveForPhotos()
        );
    } catch (e) {
        handleSdkError(e);
    }
};

export const usePhotosActions = () => {
    const { createNotification } = useNotifications();
    const { removeMe } = useSharingActions();
    const { navigateToAlbums, navigateToNodeUid } = useNavigate();

    const { sharingModal, showSharingModal } = useSharingModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [deleteAlbumModal, showDeleteAlbumModal] = useDeleteAlbumModal();
    const [removeAlbumPhotosModal, showRemoveAlbumPhotosModal] = useRemoveAlbumPhotosModal();
    const addAlbumPhotosModal = useModalStateObject();
    const createAlbumModal = useModalStateObject();
    const [isAddModalShared, setIsAddModalShared] = useState(false);

    const onSelectCover = useCallback(
        async (photoNodeUid: string) => {
            const albumNodeUid = useAlbumsStore.getState().currentAlbumNodeUid;
            if (!albumNodeUid) {
                return;
            }
            try {
                const maybeNode = await getDriveForPhotos().updateAlbum(albumNodeUid, {
                    coverPhotoNodeUid: photoNodeUid,
                });
                const { node } = getNodeEntity(maybeNode);
                await getBusDriver().emit(
                    {
                        type: BusDriverEventName.UPDATED_NODES,
                        items: [{ uid: node.uid, parentUid: node.parentUid, isShared: node.isShared }],
                    },
                    getDriveForPhotos()
                );
                createNotification({ text: c('Info').t`Photo is set as album cover` });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                handleSdkError(e);
            }
        },
        [createNotification]
    );

    const onShowDetails = useCallback(
        (previewItem: { nodeUid: string } | undefined) => {
            if (previewItem) {
                showDetailsModal({ drive: getDriveForPhotos(), nodeUid: previewItem.nodeUid });
            } else {
                const albumNodeUid = useAlbumsStore.getState().currentAlbumNodeUid;
                if (albumNodeUid) {
                    showDetailsModal({ drive: getDriveForPhotos(), nodeUid: albumNodeUid });
                }
            }
        },
        [showDetailsModal]
    );

    const onLeaveAlbum = useCallback(() => {
        const album = useAlbumsStore.getState().albums.get(useAlbumsStore.getState().currentAlbumNodeUid ?? '');
        if (!album) {
            return;
        }
        removeMe(showConfirmModal, getDriveForPhotos(), album.nodeUid, navigateToAlbums);
    }, [removeMe, showConfirmModal, navigateToAlbums]);

    const handleDeleteAlbum = useCallback(
        async (albumNodeUid: string, { saveToTimeline, force }: { saveToTimeline: boolean; force: boolean }) => {
            const album = useAlbumsStore.getState().albums.get(albumNodeUid);
            if (!album) {
                return;
            }
            await getDriveForPhotos().deleteAlbum(albumNodeUid, { saveToTimeline, force });
            await getBusDriver().emit(
                { type: BusDriverEventName.DELETED_NODES, uids: [albumNodeUid] },
                getDriveForPhotos()
            );
            const albumName = album.name;
            createNotification({
                text: c('Info').t`${albumName} has been successfully deleted`,
                preWrap: true,
            });
        },
        [createNotification]
    );

    const onDeleteAlbum = useCallback(async () => {
        const albumNodeUid = useAlbumsStore.getState().currentAlbumNodeUid;
        const album = albumNodeUid ? useAlbumsStore.getState().albums.get(albumNodeUid) : undefined;
        if (!albumNodeUid || !album) {
            return;
        }
        void showDeleteAlbumModal({
            name: album.name,
            deleteAlbum: ({ force, saveToTimeline }) => handleDeleteAlbum(albumNodeUid, { saveToTimeline, force }),
            onDeleted: navigateToAlbums,
        });
    }, [showDeleteAlbumModal, handleDeleteAlbum, navigateToAlbums]);

    const handleRemoveAlbumPhotos = useCallback(
        async (albumNodeUid: string, selectedPhotoNodeUids: string[]) => {
            const album = useAlbumsStore.getState().albums.get(albumNodeUid);
            if (!album) {
                return;
            }
            try {
                const drive = getDriveForPhotos();
                const removedUids: string[] = [];
                for await (const result of drive.removePhotosFromAlbum(albumNodeUid, selectedPhotoNodeUids)) {
                    if (!result.ok) {
                        handleSdkError(result.error);
                    } else {
                        removedUids.push(result.uid);
                    }
                }
                if (removedUids.length) {
                    useAlbumsStore.getState().removePhotoNodeUids(albumNodeUid, removedUids);
                }
                await getBusDriver().emit(
                    {
                        type: BusDriverEventName.UPDATED_NODES,
                        items: [{ uid: albumNodeUid, parentUid: album.parentNodeUid, isShared: album.isShared }],
                    },
                    drive
                );
                if (removedUids.length) {
                    const removed = removedUids.length;
                    const albumName = album.name;
                    createNotification({
                        type: 'success',
                        text: c('Notification').ngettext(
                            msgid`${removed} photo have been removed from "${albumName}"`,
                            `${removed} photos have been removed from "${albumName}"`,
                            removed
                        ),
                        preWrap: true,
                    });
                }
            } catch (e) {
                handleSdkError(e);
            }
        },
        [createNotification]
    );

    const onRemoveAlbumPhotos = useCallback(
        async (selectedItemsNodeUids: string[]) => {
            const albumNodeUid = useAlbumsStore.getState().currentAlbumNodeUid;
            if (!albumNodeUid) {
                return;
            }
            const missingPhotosNodeUids = selectedItemsNodeUids.filter(
                (nodeUid) => !usePhotosStore.getState().getPhotoItem(nodeUid)?.additionalInfo?.parentNodeUid
            );
            if (!missingPhotosNodeUids.length) {
                await handleRemoveAlbumPhotos(albumNodeUid, selectedItemsNodeUids);
            } else {
                void showRemoveAlbumPhotosModal({
                    selectedPhotosCount: selectedItemsNodeUids.length,
                    removeAlbumPhotos: () => handleRemoveAlbumPhotos(albumNodeUid, selectedItemsNodeUids),
                });
            }
        },
        [handleRemoveAlbumPhotos, showRemoveAlbumPhotosModal]
    );

    const openAddPhotosToAlbumModal = useCallback(() => {
        setIsAddModalShared(false);
        addAlbumPhotosModal.openModal(true);
    }, [addAlbumPhotosModal]);

    const openSharePhotosIntoAnAlbumModal = useCallback(() => {
        setIsAddModalShared(true);
        addAlbumPhotosModal.openModal(true);
    }, [addAlbumPhotosModal]);

    const openSharePhotoModal = useCallback(
        (nodeUid: string) => {
            showSharingModal({ nodeUid, drive: getDriveForPhotos() });
        },
        [showSharingModal]
    );

    const onAddAlbumPhotos = useCallback(
        async (albumNodeUid: string, photoUids: string[], showNotifications: boolean = true) => {
            try {
                await addPhotosToAlbum(albumNodeUid, photoUids, showNotifications);

                void navigateToNodeUid(albumNodeUid, getDriveForPhotos(), '', { openShare: isAddModalShared });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                handleSdkError(e);
            }
        },
        [createNotification, isAddModalShared, navigateToNodeUid]
    );

    const onCreateAlbumWithPhotos = useCallback(
        async (name: string, photoNodeUids: string[]) => {
            const node = await createAlbum(name);
            if (!node) {
                return;
            }
            await addPhotosToAlbum(node.uid, photoNodeUids);

            void navigateToNodeUid(node.uid, getDriveForPhotos(), '', { openShare: isAddModalShared });
        },
        [isAddModalShared, navigateToNodeUid]
    );

    const onCreateAlbum = useCallback(
        async (name: string) => {
            const node = await createAlbum(name);
            if (!node) {
                return;
            }
            void navigateToNodeUid(node.uid, getDriveForPhotos());
        },
        [navigateToNodeUid]
    );

    const onAddAlbumPhotosFromGallery = useCallback(
        async (selectedItemsNodeUids: string[]) => {
            const albumNodeUid = useAlbumsStore.getState().currentAlbumNodeUid;
            if (!albumNodeUid) {
                return;
            }
            await addPhotosToAlbum(albumNodeUid, selectedItemsNodeUids);
            void navigateToNodeUid(albumNodeUid, getDriveForPhotos());
        },
        [navigateToNodeUid]
    );

    const onSavePhotos = useCallback(
        async (selectedItemsNodeUids: string[], onSuccess: () => void) => {
            if (!selectedItemsNodeUids.length) {
                return;
            }
            try {
                const successes = [];
                const errors = [];
                for await (const result of getDriveForPhotos().savePhotosToTimeline(selectedItemsNodeUids)) {
                    if (!result.ok) {
                        handleSdkError(result.error, { showNotification: false });
                        errors.push(result.uid);
                    } else {
                        successes.push(result.uid);
                    }
                }
                if (errors.length !== 0) {
                    createNotification({
                        text: c('Info').ngettext(
                            msgid`We couldn't save this photo to your Drive`,
                            `We couldn't saved multiple photos your Drive`,
                            errors.length
                        ),
                    });
                } else {
                    createNotification({
                        text: c('Info').ngettext(
                            msgid`Photo saved to your Drive`,
                            `Photos saved to your Drive`,
                            successes.length
                        ),
                    });
                }
                onSuccess();
            } catch (e) {
                handleSdkError(e);
            }
        },
        [createNotification]
    );

    return {
        modals: {
            sharingModal,
            showSharingModal,
            detailsModal,
            confirmModal,
            deleteAlbumModal,
            showDeleteAlbumModal,
            removeAlbumPhotosModal,
            addAlbumPhotosModal,
            createAlbumModal,
        },
        isAddModalShared,
        onSelectCover,
        onShowDetails,
        onLeaveAlbum,
        onDeleteAlbum,
        onRemoveAlbumPhotos,
        openAddPhotosToAlbumModal,
        openSharePhotosIntoAnAlbumModal,
        openSharePhotoModal,
        onAddAlbumPhotos,
        onCreateAlbumWithPhotos,
        onCreateAlbum,
        onAddAlbumPhotosFromGallery,
        onSavePhotos,
    };
};
