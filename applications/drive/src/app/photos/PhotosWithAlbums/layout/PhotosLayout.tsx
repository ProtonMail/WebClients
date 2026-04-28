import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useConfirmActionModal, useModalStateObject, useNotifications } from '@proton/components';
import { MemberRole, generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { useSharingModal } from '@proton/drive/modules/sharingModal';
import { UploadStatus, uploadManager, useUploadQueueStore } from '@proton/drive/modules/upload';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../../components/uploads/UploadDragDrop/UploadDragDrop';
import useNavigate from '../../../hooks/drive/useNavigate';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { usePhotosPreviewModal } from '../../../modals/preview';
import { type OnFileUploadSuccessCallbackData, useSharedWithMeActions } from '../../../store';
import { useLinkActions, useLinksActions } from '../../../store/_links';
import { useMemoArrayNoMatterTheOrder } from '../../../store/_views/utils';
import { sendErrorReport } from '../../../utils/errorHandling';
import { dateToLegacyTimestamp } from '../../../utils/sdk/legacyTime';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../../zustand/photos/layout.store';
import { createAlbum, toggleFavorite } from '../../PhotosActions/Albums';
import { AddAlbumPhotosModal } from '../../PhotosModals/AddAlbumPhotosModal';
import { CreateAlbumModal } from '../../PhotosModals/CreateAlbumModal';
import { useDeleteAlbumModal } from '../../PhotosModals/DeleteAlbumModal';
import { useRemoveAlbumPhotosModal } from '../../PhotosModals/RemoveAlbumPhotosModal';
import { useAlbumPhotoUploadSDKStore } from '../../PhotosStore/useAlbumPhotoUploadSDK.store';
import { usePhotosWithAlbumsView } from '../../PhotosStore/usePhotosWithAlbumView';
import { loadCurrentAlbum } from '../../loaders/loadAlbum';
import { loadAlbumInvitations } from '../../loaders/loadAlbumInvitations';
import { loadSharedWithMeAlbums } from '../../loaders/loadAlbums';
import { type AlbumItem, useAlbumsStore } from '../../useAlbums.store';
import { usePhotosStore } from '../../usePhotos.store';
import PhotosRecoveryBanner from '../components/PhotosRecoveryBanner/PhotosRecoveryBanner';
import { usePhotosSelection } from '../hooks/usePhotosSelection';
import { TitleArea } from '../toolbar/TitleArea';
import { Toolbar } from '../toolbar/Toolbar';

export type PhotosLayoutOutletContext = ReturnType<typeof usePhotosWithAlbumsView>;

export const PhotosLayout = () => {
    /*
        States and Hooks
    */
    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const { albumLinkId, albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const { pathname } = useLocation();
    const { createNotification } = useNotifications();
    const { removeMe } = useSharedWithMeActions();
    const { sharingModal, showSharingModal } = useSharingModal();
    const photosView = usePhotosWithAlbumsView();
    const [previewModal, showPreviewModal] = usePhotosPreviewModal();

    const {
        volumeId,
        shareId,
        linkId,

        photos,
        photoNodeUidToIndexMap,

        albums,
        albumPhotos,
        albumPhotosNodeUidToIndexMap,
        photoNodeUids,

        addAlbumPhotos,
        addAlbumPhoto,
        removeAlbumPhotos,
        deleteAlbum,
        requestDownload,

        setPhotoAsCover,

        refreshSharedWithMeAlbums,
        refreshAlbums,
        addNewAlbumPhotoToCache,

        isAlbumsLoading,
        isPhotosLoading,
        handleSelectTag,

        initializePhotosView,
    } = photosView;

    const { currentPageType, previewNodeUid, setPageType, setPreviewNodeUid, setLayoutModals } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
            previewNodeUid: state.previewNodeUid,
            setPageType: state.setPageType,
            setPreviewNodeUid: state.setPreviewNodeUid,
            setLayoutModals: state.setLayoutModals,
        }))
    );

    const { transferPhotoLinks } = useLinksActions();
    const { copyLinkToVolume, copyLinksToVolume } = useLinkActions();
    const { selectedItems, clearSelection } = usePhotosSelection({
        photos,
        albumPhotos,
        albumPhotosNodeUidToIndexMap,
        photoNodeUidToIndexMap,
    });

    const cachedSelectedItems = useMemoArrayNoMatterTheOrder(selectedItems);

    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { navigateToAlbums, navigateToAlbum, navigateToNodeUid } = useNavigate();
    const addAlbumPhotosModal = useModalStateObject();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [deleteAlbumModal, showDeleteAlbumModal] = useDeleteAlbumModal();
    const [removeAlbumPhotosModal, showRemoveAlbumPhotosModal] = useRemoveAlbumPhotosModal();
    const createAlbumModal = useModalStateObject();
    const [isAddModalShared, setIsAddModalShared] = useState<boolean>(false);

    /*
        Refs, Memos & Constants
    */
    const previewItem = useMemo(() => {
        if (!previewNodeUid) {
            return undefined;
        }
        const data = currentPageType === AlbumsPageTypes.ALBUMSGALLERY ? albumPhotos : photos;
        const map =
            currentPageType === AlbumsPageTypes.ALBUMSGALLERY ? albumPhotosNodeUidToIndexMap : photoNodeUidToIndexMap;
        const item = data[map[previewNodeUid]];
        return typeof item !== 'string' ? (item as typeof item & { nodeUid: string }) : undefined;
    }, [currentPageType, photos, albumPhotos, previewNodeUid, albumPhotosNodeUidToIndexMap, photoNodeUidToIndexMap]);

    const album = useAlbumsStore(
        useShallow((state) => (state.currentAlbumNodeUid ? state.albums.get(state.currentAlbumNodeUid) : undefined))
    );

    const albumName = album?.name;

    const albumSharingShareId = album?.deprecatedShareId;

    const canRemoveSelectedPhotos = useMemo(() => {
        return Boolean(album?.directRole !== MemberRole.Viewer);
    }, [album]);

    const selectedCount = selectedItems.length;
    const selectedItemsNodeUids = useMemo(() => cachedSelectedItems.map((item) => item.nodeUid), [cachedSelectedItems]);

    const uploadLinkId = useMemo(() => {
        return album?.isOwner ? linkId : albumLinkId || linkId;
    }, [album?.isOwner, linkId, albumLinkId]);

    const uploadDisabled = useMemo(() => {
        if (currentPageType === AlbumsPageTypes.GALLERY || currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) {
            return isUploadDisabled;
        }
        if (currentPageType === AlbumsPageTypes.ALBUMS) {
            return true;
        }
        // Viewer role cannot upload; Admin/Editor can (unless globally disabled)
        return isUploadDisabled || Boolean(album && album.directRole === MemberRole.Viewer);
    }, [currentPageType, isUploadDisabled, album]);

    const previewShareId = albumShareId || shareId;
    const isGalleryOrAdmin =
        currentPageType === AlbumsPageTypes.GALLERY ||
        (currentPageType === AlbumsPageTypes.ALBUMSGALLERY && album?.isOwner);
    const canChangeAlbumCoverInPreview = isGalleryOrAdmin;
    /*
        Callbacks
    */
    const onSelectCover = useCallback(
        async (linkId: string) => {
            try {
                const abortSignal = new AbortController().signal;
                await setPhotoAsCover(abortSignal, linkId);
                createNotification({ text: c('Info').t`Photo is set as album cover` });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [createNotification, setPhotoAsCover]
    );

    const onSelectCoverPreview = useCallback(async () => {
        if (!previewItem || typeof previewItem === 'string') {
            sendErrorReport(new Error('Unable to set photo as cover'));
            createNotification({ text: c('Error').t`Unable to set photo as cover`, type: 'error' });
            return;
        }
        await onSelectCover(splitNodeUid(previewItem.nodeUid).nodeId);
    }, [createNotification, onSelectCover, previewItem]);

    const onShowDetails = useCallback(() => {
        if (!previewShareId) {
            return;
        }
        if (previewItem) {
            showDetailsModal({
                drive: getDriveForPhotos(),
                nodeUid: previewItem.nodeUid,
            });
        } else if (albumLinkId && volumeId) {
            const albumVolumeId = (album ? splitNodeUid(album.nodeUid).volumeId : undefined) || volumeId;
            showDetailsModal({
                drive: getDriveForPhotos(),
                nodeUid: generateNodeUid(albumVolumeId, albumLinkId),
            });
        }
    }, [previewItem, album?.nodeUid, volumeId, albumLinkId, previewShareId, showDetailsModal]);

    const onLeaveAlbum = useCallback(async () => {
        if (!albumSharingShareId) {
            return;
        }
        const abortSignal = new AbortController().signal;
        removeMe(abortSignal, showConfirmModal, albumSharingShareId, async () => {
            // Hack: there might be race condition - after deleting the membership
            // the album might be still returned by the API but fails to be loaded
            // when requesting additional resources. In such a case a second run
            // should fix the problem.
            // If the album is returned and decrypted successfuly, page refresh or
            // events later will fix that the album is still being displayed.
            try {
                await refreshSharedWithMeAlbums(abortSignal);
            } catch (e) {
                console.warn(e);
                await refreshSharedWithMeAlbums(abortSignal);
            }
            navigateToAlbums();
        });
    }, [albumSharingShareId, navigateToAlbums, refreshSharedWithMeAlbums, removeMe, showConfirmModal]);

    const handleDeleteAlbum = useCallback(
        async (
            abortSignal: AbortSignal,
            { missingPhotosIds, force }: { missingPhotosIds?: string[]; force: boolean }
        ) => {
            if (!albumShareId || !linkId || !albumName || !albumLinkId || !volumeId || !shareId) {
                return;
            }
            try {
                if (missingPhotosIds?.length && !force) {
                    await transferPhotoLinks(
                        abortSignal,
                        volumeId,
                        {
                            shareId: albumShareId,
                            linkIds: missingPhotosIds,
                            newShareId: shareId,
                            newParentLinkId: linkId,
                        },
                        'delete_album'
                    );
                }
                await deleteAlbum(abortSignal, albumLinkId, force);
                createNotification({
                    text: c('Info').t`${albumName} has been successfully deleted`,
                });
            } catch (e: unknown) {
                const error = e as {
                    data?: {
                        Code?: number;
                        Details?: {
                            ChildLinkIDs?: string[];
                        };
                    };
                };
                // Error will be catch by the DeleteAlbumModal to show save and delete modal
                if (
                    error.data?.Code === API_CUSTOM_ERROR_CODES.ALBUM_DATA_LOSS &&
                    error.data.Details?.ChildLinkIDs?.length
                ) {
                    throw e;
                }
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [
            albumShareId,
            linkId,
            shareId,
            transferPhotoLinks,
            deleteAlbum,
            albumLinkId,
            albumName,
            createNotification,
            volumeId,
        ]
    );

    // For delete album we do the happy path and just compare with photos you have in cache.
    // In most cases, if user have all the photos in his library will mean there are no direct children inside the album
    // There is a fallback in the modal in case BE detect that some items are direct children of the album
    const onDeleteAlbum = useCallback(async () => {
        if (!albumName) {
            return;
        }
        const abortSignal = new AbortController().signal;
        void showDeleteAlbumModal({
            name: albumName,
            deleteAlbum: (force, childLinkIds) =>
                // childLinkIds are from BE, so this is a better source of truth compare to missingPhotosIds
                handleDeleteAlbum(abortSignal, { missingPhotosIds: childLinkIds, force }),
            onDeleted: () => {
                navigateToAlbums();
            },
        });
    }, [handleDeleteAlbum, showDeleteAlbumModal, albumName, navigateToAlbums]);

    const handleToolbarPreview = useCallback(() => {
        if (cachedSelectedItems.length !== 1) {
            return;
        }
        const selectedItem = cachedSelectedItems[0];
        setPreviewNodeUid(selectedItem.nodeUid);
    }, [cachedSelectedItems, setPreviewNodeUid]);

    const onSelectCoverToolbar = useCallback(async () => {
        const selectedNodeUid = selectedItemsNodeUids[0];
        if (!selectedNodeUid) {
            sendErrorReport(new Error('Unable to set photo as cover'));
            createNotification({ text: c('Error').t`Unable to set photo as cover`, type: 'error' });
            return;
        }
        await onSelectCover(splitNodeUid(selectedNodeUid).nodeId);
        clearSelection();
    }, [createNotification, onSelectCover, selectedItemsNodeUids, clearSelection]);

    const handleRemoveAlbumPhotos = useCallback(
        async (
            abortSignal: AbortSignal,
            {
                selectedPhotosIds,
                missingPhotosIds,
            }: {
                selectedPhotosIds: string[];
                missingPhotosIds?: string[];
            }
        ) => {
            if (!albumShareId || !linkId || !albumLinkId || !volumeId || !album || !shareId) {
                return;
            }
            try {
                if (missingPhotosIds && missingPhotosIds.length > 0) {
                    // Transfer (aka move) is same volume only
                    // We use copy otherwise
                    const shouldTransfer = splitNodeUid(album.nodeUid).volumeId === volumeId;
                    if (shouldTransfer) {
                        await transferPhotoLinks(
                            abortSignal,
                            volumeId,
                            {
                                shareId: albumShareId,
                                linkIds: missingPhotosIds,
                                newShareId: albumShareId,
                                newParentLinkId: linkId,
                            },
                            'remove_photos_from_album'
                        );
                    } else {
                        await copyLinksToVolume(abortSignal, albumShareId, missingPhotosIds, volumeId, shareId, linkId);
                    }
                }
                await removeAlbumPhotos(abortSignal, albumShareId, albumLinkId, selectedPhotosIds);
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [
            albumShareId,
            linkId,
            albumLinkId,
            volumeId,
            album,
            shareId,
            removeAlbumPhotos,
            transferPhotoLinks,
            copyLinksToVolume,
            createNotification,
        ]
    );

    const onRemoveAlbumPhotos = useCallback(async () => {
        const { missingPhotosIds, selectedPhotosIds } = selectedItemsNodeUids.reduce<{
            selectedPhotosIds: string[];
            missingPhotosIds: string[];
        }>(
            (acc, nodeUid) => {
                const linkId = splitNodeUid(nodeUid).nodeId;
                const photoItem = usePhotosStore.getState().getPhotoItem(nodeUid);
                if (!photoItem?.additionalInfo?.parentNodeUid) {
                    acc.missingPhotosIds.push(linkId);
                }
                acc.selectedPhotosIds.push(linkId);
                return acc;
            },
            { selectedPhotosIds: [], missingPhotosIds: [] }
        );
        const abortSignal = new AbortController().signal;
        if (!missingPhotosIds.length) {
            await handleRemoveAlbumPhotos(abortSignal, { selectedPhotosIds });
        } else {
            void showRemoveAlbumPhotosModal({
                selectedPhotosCount: selectedPhotosIds.length,
                removeAlbumPhotos: (withSave) =>
                    handleRemoveAlbumPhotos(abortSignal, {
                        missingPhotosIds: withSave ? missingPhotosIds : undefined,
                        selectedPhotosIds,
                    }),
            });
        }
    }, [selectedItemsNodeUids, handleRemoveAlbumPhotos, showRemoveAlbumPhotosModal]);

    const onPhotoUploadedToAlbum = useCallback(
        async (album: AlbumItem | undefined, file: OnFileUploadSuccessCallbackData) => {
            if (!album || !file || !albumShareId || !albumLinkId) {
                return;
            }
            const abortSignal = new AbortController().signal;
            try {
                await addAlbumPhoto(abortSignal, albumShareId, albumLinkId, file.fileId);
                await getBusDriver().emit(
                    {
                        type: BusDriverEventName.UPDATED_NODES,
                        items: [
                            {
                                uid: album.nodeUid,
                                parentUid: undefined,
                            },
                        ],
                    },
                    getDriveForPhotos()
                );
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [addAlbumPhoto, albumShareId, albumLinkId, createNotification]
    );

    const openAddPhotosToAlbumModal = useCallback(() => {
        setIsAddModalShared(false);
        addAlbumPhotosModal.openModal(true);
    }, [addAlbumPhotosModal]);

    const openSharePhotosIntoAnAlbumModal = useCallback(() => {
        setIsAddModalShared(true);
        addAlbumPhotosModal.openModal(true);
    }, [addAlbumPhotosModal]);

    const openSharePhotoModal = useCallback(() => {
        const item = selectedItems[0];

        showSharingModal({ nodeUid: item.nodeUid, drive: getDriveForPhotos() });
    }, [showSharingModal, selectedItems]);

    const onAddAlbumPhotos = useCallback(
        async (albumNodeUid: string, photoUids: string[]) => {
            const album = useAlbumsStore.getState().albums.get(albumNodeUid);
            if (!album?.deprecatedShareId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const { nodeId } = splitNodeUid(albumNodeUid);
                await addAlbumPhotos(
                    abortSignal,
                    album.deprecatedShareId,
                    nodeId,
                    photoUids.map((photoUid) => splitNodeUid(photoUid).nodeId)
                );
                void navigateToAlbum(album.deprecatedShareId, splitNodeUid(albumNodeUid).nodeId, {
                    openShare: isAddModalShared,
                });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [addAlbumPhotos, createNotification, isAddModalShared, navigateToAlbum]
    );

    const onCreateAlbumWithPhotos = useCallback(
        async (name: string, photoNodeUids: string[]) => {
            if (!shareId) {
                return;
            }
            const abortSignal = new AbortController().signal;
            const node = await createAlbum(name);
            // Error check is done inside createAlbum
            if (!node) {
                return;
            }
            const addedLinkIds = await addAlbumPhotos(
                abortSignal,
                shareId,
                splitNodeUid(node.uid).nodeId,
                photoNodeUids.map((uid) => splitNodeUid(uid).nodeId)
            );
            // TODO: Remove that as it's temporary hack to get cover after photos added
            if (addedLinkIds.length > 0 && volumeId) {
                await getDriveForPhotos().updateAlbum(node.uid, {
                    coverPhotoNodeUid: generateNodeUid(volumeId, addedLinkIds[0]),
                });
            }
            void navigateToNodeUid(node.uid, getDriveForPhotos(), '', {
                openShare: isAddModalShared,
            });
        },
        [addAlbumPhotos, isAddModalShared, navigateToNodeUid, shareId, volumeId]
    );

    const onCreateAlbum = useCallback(
        async (name: string) => {
            const node = await createAlbum(name);
            // Error check is done inside createAlbum
            if (!node) {
                return;
            }
            void navigateToNodeUid(node.uid, getDriveForPhotos());
        },
        [navigateToNodeUid]
    );

    const onAddAlbumPhotosToolbar = useCallback(async () => {
        if (!volumeId) {
            return;
        }
        if (currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) {
            if (!albumShareId || !albumLinkId) {
                return;
            }
            const addedLinkIds = await addAlbumPhotos(
                new AbortController().signal,
                albumShareId,
                albumLinkId,
                selectedItemsNodeUids.map((nodeUid) => splitNodeUid(nodeUid).nodeId)
            );
            if (addedLinkIds.length > 0) {
                await getDriveForPhotos().updateAlbum(generateNodeUid(volumeId, albumLinkId), {
                    coverPhotoNodeUid: generateNodeUid(volumeId, addedLinkIds[0]),
                });
            }
            void navigateToAlbum(albumShareId, albumLinkId);
        } else {
            if (albumLinkId && previewShareId) {
                void navigateToAlbum(previewShareId, albumLinkId, {
                    addPhotos: true,
                });
            }
        }
    }, [
        volumeId,
        currentPageType,
        albumShareId,
        albumLinkId,
        addAlbumPhotos,
        selectedItemsNodeUids,
        photoNodeUids,
        navigateToAlbum,
        previewShareId,
    ]);

    const handleRedirectToAlbum = useCallback(() => {
        if (!volumeId || !albumShareId || !albumLinkId) {
            return;
        }
        void navigateToAlbum(albumShareId, albumLinkId);
    }, [volumeId, albumLinkId, albumShareId, navigateToAlbum]);

    const onSavePhotos = useCallback(async () => {
        if (!shareId || !volumeId || !linkId) {
            return;
        }

        const errors = [];
        const abortSignal = new AbortController().signal;
        for (const selectedItem of cachedSelectedItems) {
            const { nodeId: itemLinkId } = splitNodeUid(selectedItem.nodeUid);
            try {
                await copyLinkToVolume(abortSignal, albumShareId || shareId, itemLinkId, volumeId, shareId, linkId);
            } catch (e) {
                errors.push(e);
                sendErrorReport(e);
            }
        }

        if (errors.length) {
            createNotification({ text: c('Error').t`Failed to save some photos to your Drive`, type: 'error' });
        } else {
            createNotification({ text: c('Info').t`Photo(s) saved to your Drive` });
            clearSelection();
        }
    }, [shareId, linkId, volumeId, albumShareId, cachedSelectedItems, copyLinkToVolume, createNotification]);
    /*
        Effects
    */
    useEffect(() => {
        setLayoutModals({
            linkSharing: showSharingModal,
            deleteAlbum: showDeleteAlbumModal,
            createAlbum: createAlbumModal,
        });
    }, [setLayoutModals, showSharingModal, showDeleteAlbumModal, createAlbumModal]);

    useEffect(() => {
        const abortController = new AbortController();
        // Clear selection upon navigation
        clearSelection();
        // Clear tag selection
        void handleSelectTag(abortController.signal, [PhotoTag.All]);
        // Set correct page type
        if (pathname.includes('albums') && !pathname.includes('album/')) {
            setPageType(AlbumsPageTypes.ALBUMS);
        } else if (pathname.endsWith('add-photos')) {
            setPageType(AlbumsPageTypes.ALBUMSADDPHOTOS);
        } else if (pathname.includes('albums') && pathname.includes('album/')) {
            setPageType(AlbumsPageTypes.ALBUMSGALLERY);
        } else {
            setPageType(AlbumsPageTypes.GALLERY);
        }

        return () => {
            abortController.abort();
        };
    }, [pathname, setPageType, clearSelection, handleSelectTag]);

    useEffect(
        function initializePhotos() {
            const drive = getDriveForPhotos();
            void drive.getMyPhotosRootFolder().then((nodeUidOrMaybeNode) => initializePhotosView(nodeUidOrMaybeNode));
        },
        [initializePhotosView]
    );

    // Subscribe to upload events to automatically add uploaded photos to the current album.
    // This subscription persists across navigation to handle background uploads - it only
    // unsubscribes when all queued uploads complete or when unmounting with no pending uploads.
    useEffect(() => {
        if (!albumShareId || !albumLinkId) {
            return;
        }
        let needUnsubscribe = false;
        uploadManager.subscribeToEvents('photos-layout', async (event) => {
            if (event.type === 'file:queued' && event.isForPhotos) {
                const albumsState = useAlbumsStore.getState();
                const currentAlbum =
                    albumsState.getCurrentAlbum() ??
                    [...albumsState.albums.values()].find((a) => splitNodeUid(a.nodeUid).nodeId === albumLinkId);
                if (!currentAlbum) {
                    return;
                }
                useAlbumPhotoUploadSDKStore.getState().setContext(event.uploadId, {
                    albumNodeUid: currentAlbum.nodeUid,
                    albumShareId,
                    albumLinkId,
                    isOwner: currentAlbum.isOwner,
                });
            } else if ((event.type === 'file:complete' && event.isForPhotos) || event.type === 'photo:exist') {
                const uploadContext = useAlbumPhotoUploadSDKStore.getState().getContext(event.uploadId);
                if (uploadContext) {
                    const abortSignal = new AbortController().signal;
                    try {
                        const nodeUid = event.type === 'file:complete' ? event.nodeUid : event.duplicateUids[0];
                        const nodeId = splitNodeUid(nodeUid).nodeId;
                        // We have to get the newNodeIds to add them to album cache as adding them to an album as not owner will create a copy
                        const newNodeIds = await addAlbumPhotos(
                            abortSignal,
                            uploadContext.albumShareId,
                            uploadContext.albumLinkId,
                            [nodeId],
                            true
                        );
                        if (!uploadContext.isOwner) {
                            void addNewAlbumPhotoToCache(
                                abortSignal,
                                uploadContext.albumShareId,
                                uploadContext.albumLinkId,
                                newNodeIds[0]
                            );
                        }
                        if (useAlbumsStore.getState().currentAlbumNodeUid === uploadContext.albumNodeUid) {
                            await loadCurrentAlbum(uploadContext.albumNodeUid);
                        }
                        // TODO: show a more specific label like "Added to album" instead of "Uploaded"
                        if (event.type === 'photo:exist') {
                            useUploadQueueStore.getState().updateQueueItems(event.uploadId, {
                                status: UploadStatus.Finished,
                            });
                        }
                    } catch (e) {
                        if (e instanceof Error && e.message) {
                            createNotification({ text: e.message, type: 'error' });
                        }
                        sendErrorReport(e);
                    }
                    useAlbumPhotoUploadSDKStore.getState().deleteContext(event.uploadId);

                    if (needUnsubscribe && !useAlbumPhotoUploadSDKStore.getState().hasPendingUploads()) {
                        uploadManager.unsubscribeFromEvents('photos-layout');
                    }
                }
            }
        });

        return () => {
            if (!useAlbumPhotoUploadSDKStore.getState().hasPendingUploads()) {
                uploadManager.unsubscribeFromEvents('photos-layout');
            } else {
                needUnsubscribe = true;
            }
        };
    }, [currentPageType, albumShareId, albumLinkId, createNotification, addAlbumPhotos, addNewAlbumPhotoToCache]);

    const isAlbumPhotosLoading = useAlbumsStore((state) => state.isLoading);

    useEffect(() => {
        if (!previewItem || !volumeId) {
            return;
        }
        const albumStore = useAlbumsStore.getState();
        const photosStore = usePhotosStore.getState();
        const photoItem = photosStore.getPhotoItem(previewItem.nodeUid);

        if (!photoItem) {
            return;
        }
        const previewableNodeUids =
            currentPageType === AlbumsPageTypes.ALBUMSGALLERY
                ? // TODO: Improve this condition
                  albumStore.getCurrentAlbum()?.photoNodeUids
                : photosStore.photoTimelineUids;

        showPreviewModal({
            drive: getDriveForPhotos(),
            nodeUid: photoItem.nodeUid,
            previewableNodeUids: previewableNodeUids ? Array.from(previewableNodeUids.values()) : [],
            onNodeChange: (nodeUid: string) => setPreviewNodeUid(nodeUid),
            onClose: () => setPreviewNodeUid(undefined),
            photos: {
                date: dateToLegacyTimestamp(photoItem.captureTime),
                isFavorite: photoItem.tags.includes(PhotoTag.Favorites),
                onFavorite: () => {
                    void toggleFavorite(photoItem.nodeUid);
                },
                // TODO: Update that once we migrate album to sdk
                onSelectCover:
                    canChangeAlbumCoverInPreview &&
                    currentPageType === AlbumsPageTypes.ALBUMSGALLERY &&
                    albumStore.getCurrentAlbum()?.coverNodeUid !== photoItem.nodeUid
                        ? () => {
                              void onSelectCoverPreview();
                          }
                        : undefined,
            },
        });
    }, [
        canChangeAlbumCoverInPreview,
        currentPageType,
        onSelectCoverPreview,
        previewItem,
        setPreviewNodeUid,
        showPreviewModal,
        volumeId,
    ]);

    useEffect(() => {
        void usePhotosStore.getState().subscribeToEvents('photosProvider');

        return () => {
            void usePhotosStore.getState().unsubscribeFromEvents('photosProvider');
        };
    }, []);

    useEffect(
        function subscribeToRefreshSharedWithMe() {
            if (currentPageType !== AlbumsPageTypes.ALBUMS) {
                return;
            }
            const abortController = new AbortController();
            const unsub = getBusDriver().subscribe(BusDriverEventName.REFRESH_SHARED_WITH_ME, async () => {
                await Promise.all([
                    loadSharedWithMeAlbums(abortController.signal),
                    loadAlbumInvitations(abortController.signal),
                ]);
            });

            return () => {
                unsub();
            };
        },
        [currentPageType]
    );

    if (!previewShareId || !uploadLinkId || !currentPageType || !shareId || !linkId || !volumeId) {
        return <Loader />;
    }

    return (
        <UploadDragDrop
            disabled={uploadDisabled}
            isForPhotos={true}
            shareId={albumShareId || shareId}
            parentLinkId={uploadLinkId}
            volumeId={volumeId}
            onFileUpload={(file: OnFileUploadSuccessCallbackData) => onPhotoUploadedToAlbum(album, file)}
            onFileSkipped={(file: OnFileUploadSuccessCallbackData) => onPhotoUploadedToAlbum(album, file)}
            onDrop={currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS ? handleRedirectToAlbum : undefined}
            className="flex flex-column *:min-size-auto flex-nowrap flex-1"
        >
            {/* TODO: Remove this hack when albums cache is fixed and refactored */}
            <PhotosRecoveryBanner onSucceed={refreshAlbums} />

            <ToolbarRow
                className={clsx('m-2 rounded toolbar-row--no-responsive', selectedCount > 0 && 'bg-weak')}
                withBorder={false}
                withPadding={false}
                titleArea={
                    <TitleArea
                        isAlbumsLoading={isAlbumsLoading}
                        isPhotosLoading={isPhotosLoading}
                        albums={albums}
                        photos={photos}
                        albumPhotos={albumPhotos}
                        albumPhotosNodeUidToIndexMap={albumPhotosNodeUidToIndexMap}
                        photoNodeUidToIndexMap={photoNodeUidToIndexMap}
                    />
                }
                toolbar={
                    <Toolbar
                        volumeId={volumeId}
                        currentPageType={currentPageType}
                        previewShareId={previewShareId}
                        uploadLinkId={uploadLinkId}
                        rootLinkId={linkId}
                        selectedCount={selectedCount}
                        uploadDisabled={uploadDisabled}
                        canRemoveSelectedPhotos={canRemoveSelectedPhotos}
                        albumsUid={albums.map((album) => album.nodeUid)}
                        albumUid={album?.nodeUid}
                        albumPhotos={albumPhotos}
                        photos={photos}
                        selectedItems={cachedSelectedItems}
                        createAlbumModal={createAlbumModal}
                        requestDownload={requestDownload}
                        onAddAlbumPhotos={onAddAlbumPhotosToolbar}
                        openAddPhotosToAlbumModal={openAddPhotosToAlbumModal}
                        openSharePhotosIntoAnAlbumModal={openSharePhotosIntoAnAlbumModal}
                        openSharePhotoModal={openSharePhotoModal}
                        onFileUpload={(file: OnFileUploadSuccessCallbackData) => onPhotoUploadedToAlbum(album, file)}
                        onFileSkipped={(file: OnFileUploadSuccessCallbackData) => onPhotoUploadedToAlbum(album, file)}
                        onPreview={handleToolbarPreview}
                        onSelectCover={onSelectCoverToolbar}
                        onDeleteAlbum={onDeleteAlbum}
                        onLeaveAlbum={onLeaveAlbum}
                        onShowDetails={onShowDetails}
                        onRemoveAlbumPhotos={onRemoveAlbumPhotos}
                        onSavePhotos={onSavePhotos}
                        onStartUpload={handleRedirectToAlbum}
                        isAlbumPhotosLoading={isAlbumPhotosLoading}
                    />
                }
            />

            {/* TODO: Remove outlet context or combine it with PhotoLayoutStore */}
            {/** Outlet will render the routed page grid */}
            <Outlet context={photosView} />

            {/** Modals that are necessary on all views */}
            {sharingModal}
            {detailsModal}

            {/** Modals that are necessary only on album and album gallery view */}
            {(currentPageType === AlbumsPageTypes.ALBUMS || currentPageType === AlbumsPageTypes.ALBUMSGALLERY) && (
                <>{deleteAlbumModal}</>
            )}

            {/** Modals that are necessary only on album gallery view */}
            {currentPageType === AlbumsPageTypes.GALLERY && (
                <>
                    <AddAlbumPhotosModal
                        addAlbumPhotosModal={addAlbumPhotosModal}
                        onCreateAlbumWithPhotos={onCreateAlbumWithPhotos}
                        onAddAlbumPhotos={onAddAlbumPhotos}
                        photosNodeUids={selectedItemsNodeUids}
                        share={isAddModalShared}
                    />
                </>
            )}

            {/** Modals that are necessary only on albumS view */}
            {currentPageType === AlbumsPageTypes.ALBUMS && (
                <>
                    <CreateAlbumModal createAlbumModal={createAlbumModal} createAlbum={onCreateAlbum} share={false} />
                </>
            )}

            {/** Modals that are necessary only on album gallery view */}
            {currentPageType === AlbumsPageTypes.ALBUMSGALLERY && (
                <>
                    {confirmModal}
                    {removeAlbumPhotosModal}
                </>
            )}

            {previewModal}
        </UploadDragDrop>
    );
};
