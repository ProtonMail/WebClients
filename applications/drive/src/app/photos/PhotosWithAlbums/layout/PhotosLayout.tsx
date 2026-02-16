import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import {
    Loader,
    NavigationControl,
    TopBanner,
    useConfirmActionModal,
    useModalStateObject,
    useNotifications,
} from '@proton/components';
import { generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import PortalPreview from '../../../components/PortalPreview';
import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../../components/uploads/UploadDragDrop/UploadDragDrop';
import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import useNavigate from '../../../hooks/drive/useNavigate';
import { useDetailsModal } from '../../../modals/DetailsModal';
import { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import { usePhotosPreviewModal } from '../../../modals/preview';
import {
    type OnFileUploadSuccessCallbackData,
    type PhotoLink,
    isDecryptedLink,
    useSharedWithMeActions,
} from '../../../store';
import { useLinkActions, useLinksActions } from '../../../store/_links';
import { useMemoArrayNoMatterTheOrder } from '../../../store/_views/utils';
import { sendErrorReport } from '../../../utils/errorHandling';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../../zustand/photos/layout.store';
import { useCreateAlbum, useFavoritePhotoToggleFromLayout } from '../../PhotosActions/Albums';
import { AddAlbumPhotosModal } from '../../PhotosModals/AddAlbumPhotosModal';
import { CreateAlbumModal } from '../../PhotosModals/CreateAlbumModal';
import { useDeleteAlbumModal } from '../../PhotosModals/DeleteAlbumModal';
import { useRemoveAlbumPhotosModal } from '../../PhotosModals/RemoveAlbumPhotosModal';
import type { DecryptedAlbum } from '../../PhotosStore/PhotosWithAlbumsProvider';
import { useAlbumPhotoUploadSDKStore } from '../../PhotosStore/useAlbumPhotoUploadSDK.store';
import { usePhotosWithAlbumsView } from '../../PhotosStore/usePhotosWithAlbumView';
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
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();
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
        photoLinkIdToIndexMap,

        albums,
        albumPhotosLinkIds,
        albumPhotos,
        albumPhotosLinkIdToIndexMap,
        photoLinkIds,

        addAlbumPhotos,
        addAlbumPhoto,
        removeAlbumPhotos,
        deleteAlbum,
        requestDownload,

        setPhotoAsCover,

        refreshSharedWithMeAlbums,
        refreshAlbums,
        addNewAlbumPhotoToCache,

        userAddressEmail,
        isAlbumsLoading,
        isPhotosLoading,
        isAlbumPhotosLoading,
        handleSelectTag,

        initializePhotosView,
    } = photosView;

    const { currentPageType, previewLinkId, setPageType, setPreviewLinkId, setLayoutModals } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
            previewLinkId: state.previewLinkId,
            setPageType: state.setPageType,
            setPreviewLinkId: state.setPreviewLinkId,
            setLayoutModals: state.setLayoutModals,
        }))
    );

    const { transferPhotoLinks } = useLinksActions();
    const { copyLinkToVolume, copyLinksToVolume } = useLinkActions();
    const { selectedItems, clearSelection } = usePhotosSelection({
        photos,
        albumPhotos,
        albumPhotosLinkIdToIndexMap,
        photoLinkIdToIndexMap,
    });

    const cachedSelectedItems = useMemoArrayNoMatterTheOrder(selectedItems);

    const createAlbum = useCreateAlbum();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const { navigateToAlbums, navigateToAlbum } = useNavigate();
    const addAlbumPhotosModal = useModalStateObject();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [deleteAlbumModal, showDeleteAlbumModal] = useDeleteAlbumModal();
    const [removeAlbumPhotosModal, showRemoveAlbumPhotosModal] = useRemoveAlbumPhotosModal();
    const createAlbumModal = useModalStateObject();
    const [isAddModalShared, setIsAddModalShared] = useState<boolean>(false);
    const favoritePhotoToggle = useFavoritePhotoToggleFromLayout(photosView);

    /*
        Refs, Memos & Constants
    */
    const previewRef = useRef<HTMLDivElement>(null);

    const previewIndex = useMemo(
        () =>
            currentPageType === AlbumsPageTypes.ALBUMSGALLERY
                ? albumPhotosLinkIds.findIndex((item) => item === previewLinkId)
                : photoLinkIds.findIndex((item) => item === previewLinkId),
        [currentPageType, photoLinkIds, albumPhotosLinkIds, previewLinkId]
    );

    const previewItem = useMemo(() => {
        if (currentPageType === AlbumsPageTypes.ALBUMSGALLERY) {
            return previewLinkId !== undefined &&
                typeof albumPhotos[albumPhotosLinkIdToIndexMap[previewLinkId]] !== 'string'
                ? (albumPhotos[albumPhotosLinkIdToIndexMap[previewLinkId]] as PhotoLink)
                : undefined;
        }
        return previewLinkId !== undefined && typeof photos[photoLinkIdToIndexMap[previewLinkId]] !== 'string'
            ? (photos[photoLinkIdToIndexMap[previewLinkId]] as PhotoLink)
            : undefined;
    }, [currentPageType, photos, albumPhotos, previewLinkId, albumPhotosLinkIdToIndexMap, photoLinkIdToIndexMap]);

    const album = useMemo(() => {
        if (!albumLinkId) {
            return undefined;
        }
        return albums.find((album) => album.linkId === albumLinkId);
    }, [albums, albumLinkId]);

    const albumName = album?.name;

    const albumSharingShareId = album?.sharingDetails?.shareId;

    const canRemoveSelectedPhotos = useMemo(() => {
        return Boolean(album?.permissions.isAdmin || album?.permissions.isEditor);
    }, [album?.permissions.isAdmin, selectedItems, userAddressEmail]);

    const selectedCount = selectedItems.length;
    const selectedItemsLinkIds = useMemo(() => cachedSelectedItems.map((item) => item.linkId), [cachedSelectedItems]);

    const uploadLinkId = useMemo(() => {
        // If you own the root photo share, your uploads always goes to the root (photo stream) and then we add the photos to the album
        // If you don't own it (shared album), you upload directly in the album as a folder, it won't appear in photo stream
        return album?.permissions.isOwner ? linkId : albumLinkId || linkId;
    }, [album?.permissions.isOwner, linkId, albumLinkId]);

    const uploadDisabled = useMemo(() => {
        if (currentPageType === AlbumsPageTypes.GALLERY || currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) {
            return isUploadDisabled;
        }
        if (currentPageType === AlbumsPageTypes.ALBUMS) {
            return true;
        }
        // Albums Gallery
        return isUploadDisabled || Boolean(album && album.permissions.isEditor === false);
    }, [isUploadDisabled, currentPageType, album]);

    const photoCount =
        currentPageType === AlbumsPageTypes.ALBUMSGALLERY && album ? album.photoCount : photoLinkIds.length;
    const hasPreview = !!previewItem && currentPageType !== AlbumsPageTypes.ALBUMS;
    const previewShareId = albumShareId || shareId;
    const isGalleryOrAdmin =
        currentPageType === AlbumsPageTypes.GALLERY ||
        (currentPageType === AlbumsPageTypes.ALBUMSGALLERY && album?.permissions.isAdmin);
    const canChangeAlbumCoverInPreview = isGalleryOrAdmin;
    const canChangeSharePhotoInPreview = isGalleryOrAdmin;
    /*
        Callbacks
    */
    const setPreviewIndex = useCallback(
        (index: number) =>
            setPreviewLinkId(
                currentPageType === AlbumsPageTypes.ALBUMSGALLERY ? albumPhotosLinkIds[index] : photoLinkIds[index]
            ),
        [setPreviewLinkId, currentPageType, photoLinkIds, albumPhotosLinkIds]
    );

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
        await onSelectCover(previewItem.linkId);
    }, [createNotification, onSelectCover, previewItem]);

    const onShowDetails = useCallback(() => {
        const linkVolumeId = previewItem ? previewItem.volumeId : album?.volumeId || volumeId;
        const linkId = previewItem ? previewItem.linkId : albumLinkId;
        if (!previewShareId || !linkId || !linkVolumeId) {
            return;
        }
        showDetailsModal({
            drive: getDriveForPhotos(),
            volumeId: linkVolumeId,
            shareId: previewShareId,
            linkId: linkId,
        });
    }, [previewShareId, albumLinkId, showDetailsModal, previewItem]);

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
        const selectedLinkId = selectedItemsLinkIds[0];

        if (selectedItemsLinkIds.length === 1 && selectedLinkId) {
            setPreviewLinkId(selectedLinkId);
        }
    }, [selectedItemsLinkIds, setPreviewLinkId]);

    const onSelectCoverToolbar = useCallback(async () => {
        const selectedItemLinkId = selectedItemsLinkIds[0];
        if (!selectedItemLinkId) {
            sendErrorReport(new Error('Unable to set photo as cover'));
            createNotification({ text: c('Error').t`Unable to set photo as cover`, type: 'error' });
            return;
        }
        await onSelectCover(selectedItemLinkId);
    }, [createNotification, onSelectCover, selectedItemsLinkIds]);

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
                    const shouldTransfer = album.volumeId === volumeId;
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
            shareId,
            removeAlbumPhotos,
            createNotification,
            transferPhotoLinks,
        ]
    );

    const onRemoveAlbumPhotos = useCallback(async () => {
        const { missingPhotosIds, selectedPhotosIds } = selectedItemsLinkIds.reduce<{
            selectedPhotosIds: string[];
            missingPhotosIds: string[];
        }>(
            (acc, linkId) => {
                if (!photoLinkIds.includes(linkId)) {
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
    }, [selectedItemsLinkIds, photoLinkIds, handleRemoveAlbumPhotos, showRemoveAlbumPhotosModal]);

    const onPhotoUploadedToAlbum = useCallback(
        async (album: DecryptedAlbum | undefined, file: OnFileUploadSuccessCallbackData) => {
            if (!album || !file) {
                return;
            }
            const abortSignal = new AbortController().signal;
            try {
                // If you're not the owner of the album
                // you just upload directly in the album
                // so you don't add afterwards to add the photo to the album
                if (album.permissions.isOwner) {
                    await addAlbumPhoto(abortSignal, album.rootShareId, album.linkId, file.fileId);
                } else {
                    void addNewAlbumPhotoToCache(abortSignal, album.rootShareId, album.linkId, file.fileId);
                }
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [addAlbumPhoto, addNewAlbumPhotoToCache, createNotification]
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
        const link = selectedItems[0];

        showSharingModal({ nodeUid: generateNodeUid(link.volumeId, link.linkId) });
    }, [showSharingModal, selectedItems]);

    const onAddAlbumPhotos = useCallback(
        async (albumShareId: string, albumLinkId: string, linkIds: string[]) => {
            if (!volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                await addAlbumPhotos(abortSignal, albumShareId, albumLinkId, linkIds);
                navigateToAlbum(albumShareId, albumLinkId, { openShare: isAddModalShared });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [volumeId, isAddModalShared, navigateToAlbum, addAlbumPhotos, createNotification]
    );

    const onCreateAlbumWithPhotos = useCallback(
        async (name: string, linkIds: string[]) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const albumLinkId = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                await addAlbumPhotos(abortSignal, shareId, albumLinkId, linkIds);
                navigateToAlbum(shareId, albumLinkId, { openShare: isAddModalShared });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [volumeId, shareId, linkId, isAddModalShared, createAlbum, navigateToAlbum, addAlbumPhotos, createNotification]
    );

    const onCreateAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const albumLinkId = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                navigateToAlbum(shareId, albumLinkId);
            } catch (e) {
                sendErrorReport(e);
            }
        },
        [shareId, linkId, createAlbum, navigateToAlbum, volumeId]
    );

    const onAddAlbumPhotosToolbar = useCallback(async () => {
        if (currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) {
            if (!albumShareId || !albumLinkId) {
                return;
            }
            await addAlbumPhotos(new AbortController().signal, albumShareId, albumLinkId, selectedItemsLinkIds);
            navigateToAlbum(albumShareId, albumLinkId);
        } else {
            if (albumLinkId && previewShareId) {
                navigateToAlbum(previewShareId, albumLinkId, { addPhotos: true });
            }
        }
    }, [
        currentPageType,
        albumShareId,
        albumLinkId,
        addAlbumPhotos,
        selectedItemsLinkIds,
        navigateToAlbum,
        previewShareId,
    ]);

    const handleRedirectToAlbum = useCallback(() => {
        if (!albumShareId || !albumLinkId) {
            return;
        }
        navigateToAlbum(albumShareId, albumLinkId);
    }, [albumLinkId, albumShareId, navigateToAlbum]);

    const onSavePhotos = useCallback(async () => {
        if (!shareId || !volumeId || !linkId) {
            return;
        }

        const errors = [];
        const abortSignal = new AbortController().signal;
        for (const selectedItem of selectedItems) {
            try {
                await copyLinkToVolume(
                    abortSignal,
                    selectedItem.rootShareId,
                    selectedItem.linkId,
                    volumeId,
                    shareId,
                    linkId
                );
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
    }, [shareId, linkId, volumeId, selectedItems, copyLinkToVolume, createNotification]);
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

    useEffect(() => {
        const abortController = new AbortController();
        void initializePhotosView(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [initializePhotosView]);

    const isOwner = album?.permissions.isOwner;

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
                useAlbumPhotoUploadSDKStore
                    .getState()
                    .setContext(event.uploadId, { albumShareId, albumLinkId, isOwner: !!isOwner });
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
    }, [
        currentPageType,
        albumShareId,
        albumLinkId,
        isOwner,
        createNotification,
        // addAlbumPhotos,
        // addNewAlbumPhotoToCache,
    ]);

    useEffect(() => {
        if (!previewItem || !isSDKPreviewEnabled) {
            return;
        }

        const previewableLinkIds =
            currentPageType === AlbumsPageTypes.ALBUMSGALLERY ? albumPhotosLinkIds : photoLinkIds;
        const previewableNodeUids = previewableLinkIds.map((linkId) => generateNodeUid(previewItem.volumeId, linkId));

        showPreviewModal({
            drive: getDriveForPhotos(),
            deprecatedContextShareId: previewItem.rootShareId,
            nodeUid: generateNodeUid(previewItem.volumeId, previewItem.linkId),
            previewableNodeUids: previewableNodeUids,
            onNodeChange: (nodeUid: string) => setPreviewLinkId(splitNodeUid(nodeUid).nodeId),
            onClose: () => setPreviewLinkId(undefined),
            photos: {
                date:
                    previewItem.activeRevision?.photo?.captureTime ||
                    (isDecryptedLink(previewItem) ? previewItem.createTime : undefined),
                isFavorite: previewItem.photoProperties?.isFavorite,
                onFavorite: () => {
                    if (previewItem.photoProperties) {
                        void favoritePhotoToggle(
                            previewItem.linkId,
                            previewItem.rootShareId,
                            previewItem.photoProperties.isFavorite
                        );
                    }
                },
                onSelectCover:
                    canChangeAlbumCoverInPreview &&
                    currentPageType === AlbumsPageTypes.ALBUMSGALLERY &&
                    album?.cover?.linkId !== previewItem.linkId
                        ? () => {
                              void onSelectCoverPreview();
                          }
                        : undefined,
            },
        });
    }, [isSDKPreviewEnabled, hasPreview, previewItem, albumPhotosLinkIds, photoLinkIds]);

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
            {driveAlbumsDisabled && (
                <TopBanner className="bg-warning">{c('Info')
                    .t`We are experiencing technical issues. Any albums related actions are temporarily disabled.`}</TopBanner>
            )}

            {/* TODO: Remove this hack when albums cache is fixed and refactored */}
            <PhotosRecoveryBanner onSucceed={refreshAlbums} />

            {hasPreview && !isSDKPreviewEnabled && (
                <PortalPreview
                    ref={previewRef}
                    shareId={previewShareId}
                    linkId={previewItem.linkId}
                    revisionId={isDecryptedLink(previewItem) ? previewItem.activeRevision?.id : undefined}
                    key="portal-preview-photos"
                    open={hasPreview}
                    date={
                        previewItem.activeRevision?.photo?.captureTime ||
                        (isDecryptedLink(previewItem) ? previewItem.createTime : undefined)
                    }
                    onShare={
                        (isDecryptedLink(previewItem) && previewItem?.trashed) || !canChangeSharePhotoInPreview
                            ? undefined
                            : () =>
                                  showSharingModal({
                                      nodeUid: generateNodeUid(previewItem.volumeId, previewItem.linkId),
                                  })
                    }
                    onDetails={onShowDetails}
                    onSelectCover={
                        canChangeAlbumCoverInPreview &&
                        !driveAlbumsDisabled &&
                        currentPageType === AlbumsPageTypes.ALBUMSGALLERY &&
                        album?.cover?.linkId !== previewItem.linkId
                            ? onSelectCoverPreview
                            : undefined
                    }
                    onFavorite={() => {
                        if (previewItem.photoProperties) {
                            void favoritePhotoToggle(
                                previewItem.linkId,
                                previewShareId,
                                previewItem.photoProperties.isFavorite
                            );
                        }
                    }}
                    isFavorite={previewItem.photoProperties?.isFavorite}
                    navigationControls={
                        <NavigationControl
                            current={previewIndex + 1}
                            total={photoCount}
                            rootRef={previewRef}
                            onPrev={() => setPreviewIndex(previewIndex - 1)}
                            onNext={() => setPreviewIndex(previewIndex + 1)}
                        />
                    }
                    onClose={() => setPreviewLinkId(undefined)}
                    onExit={() => setPreviewLinkId(undefined)}
                    isForPhotos
                />
            )}

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
                        albumPhotosLinkIdToIndexMap={albumPhotosLinkIdToIndexMap}
                        photoLinkIdToIndexMap={photoLinkIdToIndexMap}
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
                        albums={albums}
                        album={album}
                        albumPhotos={albumPhotos}
                        photos={photos}
                        selectedItems={selectedItems}
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
                        albums={albums}
                        photosLinkIds={selectedItemsLinkIds}
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
