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
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import PortalPreview from '../../../components/PortalPreview';
import { useDetailsModal } from '../../../components/modals/DetailsModal';
import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../../components/sections/ToolbarRow/ToolbarRow';
import useNavigate from '../../../hooks/drive/useNavigate';
import {
    type OnFileUploadSuccessCallbackData,
    type PhotoLink,
    isDecryptedLink,
    useSharedWithMeActions,
} from '../../../store';
import { useLinksActions } from '../../../store/_links';
import { useMemoArrayNoMatterTheOrder } from '../../../store/_views/utils';
import { sendErrorReport } from '../../../utils/errorHandling';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../../zustand/photos/layout.store';
import { unleashVanillaStore } from '../../../zustand/unleash/unleash.store';
import { useCreateAlbum } from '../../PhotosActions/Albums';
import { AddAlbumPhotosModal } from '../../PhotosModals/AddAlbumPhotosModal';
import { CreateAlbumModal } from '../../PhotosModals/CreateAlbumModal';
import { useDeleteAlbumModal } from '../../PhotosModals/DeleteAlbumModal';
import { useRemoveAlbumPhotosModal } from '../../PhotosModals/RemoveAlbumPhotosModal';
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
    const { albumLinkId, albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const { pathname } = useLocation();
    const { createNotification } = useNotifications();
    const { removeMe } = useSharedWithMeActions();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const photosView = usePhotosWithAlbumsView();

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

        userAddressEmail,
        isAlbumsLoading,
        isPhotosLoading,
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

    /*
        Refs, Memos & Constants
    */
    const previewRef = useRef<HTMLDivElement>(null);

    const previewIndex = useMemo(
        () =>
            currentPageType === AlbumsPageTypes.GALLERY
                ? photoLinkIds.findIndex((item) => item === previewLinkId)
                : albumPhotosLinkIds.findIndex((item) => item === previewLinkId),
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
        return (
            album?.permissions.isAdmin ||
            selectedItems.every((item) => item.activeRevision?.signatureEmail === userAddressEmail)
        );
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
        return isUploadDisabled || !album?.permissions.isEditor;
    }, [isUploadDisabled, currentPageType, album]);

    const photoCount = album ? album.photoCount : photoLinkIds.length;
    const hasPreview = !!previewItem && currentPageType !== AlbumsPageTypes.ALBUMS;
    const previewShareId = albumShareId || shareId;
    const isAlbumsWithSharingDisabled = unleashVanillaStore.getState().isEnabled('DriveAlbumsTempDisabledOnRelease');

    /*
        Callbacks
    */
    const setPreviewIndex = useCallback(
        (index: number) =>
            setPreviewLinkId(
                currentPageType === AlbumsPageTypes.GALLERY ? photoLinkIds[index] : albumPhotosLinkIds[index]
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
        const linkId = previewItem ? previewItem.linkId : albumLinkId;
        if (!previewShareId || !linkId) {
            return;
        }
        showDetailsModal({
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
            await refreshSharedWithMeAlbums(abortSignal);
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
                    await transferPhotoLinks(abortSignal, volumeId, {
                        shareId: albumShareId,
                        linkIds: missingPhotosIds,
                        newShareId: shareId,
                        newParentLinkId: linkId,
                    });
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
        let selectedLinkId = selectedItemsLinkIds[0];

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
            if (!albumShareId || !linkId || !albumLinkId || !volumeId) {
                return;
            }
            try {
                if (missingPhotosIds) {
                    await transferPhotoLinks(abortSignal, volumeId, {
                        shareId: albumShareId,
                        linkIds: missingPhotosIds,
                        newShareId: albumShareId,
                        newParentLinkId: linkId,
                    });
                }
                await removeAlbumPhotos(abortSignal, albumShareId, albumLinkId, selectedPhotosIds);
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [albumShareId, linkId, albumLinkId, volumeId, removeAlbumPhotos, createNotification, transferPhotoLinks]
    );

    const onRemoveAlbumPhotos = useCallback(async () => {
        const { missingPhotosIds, selectedPhotosIds } = isAlbumsWithSharingDisabled
            ? { selectedPhotosIds: [], missingPhotosIds: [] }
            : selectedItemsLinkIds.reduce<{
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
    }, [
        isAlbumsWithSharingDisabled,
        selectedItemsLinkIds,
        photoLinkIds,
        handleRemoveAlbumPhotos,
        showRemoveAlbumPhotosModal,
    ]);

    const onPhotoUploadedToAlbum = useCallback(
        async (file: OnFileUploadSuccessCallbackData) => {
            if (!file || !album || !albumShareId) {
                return;
            }
            const abortSignal = new AbortController().signal;
            try {
                // If you're not the owner of the album
                // you just upload directly in the album
                // so you don't add afterwards to add the photo to the album
                // Additionally if the file is skipped AND already in the album, no need to call backend to re-add
                const isAlreadyInAlbum = albumPhotos.some(
                    (photo) => typeof photo === 'object' && photo.linkId === file.fileId
                );
                if (album.permissions.isOwner && !isAlreadyInAlbum) {
                    await addAlbumPhoto(abortSignal, albumShareId, file.fileId);
                }
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [createNotification, addAlbumPhoto, albumShareId, album, albumPhotos]
    );

    const openAddPhotosToAlbumModal = useCallback(() => {
        setIsAddModalShared(false);
        addAlbumPhotosModal.openModal(true);
    }, [addAlbumPhotosModal]);

    const openSharePhotosIntoAnAlbumModal = useCallback(() => {
        setIsAddModalShared(true);
        addAlbumPhotosModal.openModal(true);
    }, [addAlbumPhotosModal]);

    const onAddAlbumPhotos = useCallback(
        async (albumLinkId: string, linkIds: string[]) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                await addAlbumPhotos(abortSignal, shareId, albumLinkId, linkIds);
                navigateToAlbum(shareId, albumLinkId, { openShare: isAddModalShared });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [volumeId, shareId, linkId, isAddModalShared, navigateToAlbum, addAlbumPhotos, createNotification]
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
    }, [currentPageType, albumLinkId, albumShareId, selectedItemsLinkIds, previewShareId]);

    /*
        Effects
    */
    useEffect(() => {
        setLayoutModals({
            linkSharing: showLinkSharingModal,
            deleteAlbum: showDeleteAlbumModal,
            createAlbum: createAlbumModal,
        });
    }, [setLayoutModals, showLinkSharingModal, showDeleteAlbumModal, createAlbumModal]);

    useEffect(() => {
        // Clear selection upon navigation
        clearSelection();
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
    }, [pathname, setPageType, clearSelection]);

    if (!previewShareId || !uploadLinkId || !currentPageType) {
        return <Loader />;
    }

    return (
        <>
            {isUploadDisabled && (
                <TopBanner className="bg-warning">{c('Info')
                    .t`We are experiencing technical issues. Uploading new photos is temporarily disabled.`}</TopBanner>
            )}

            {driveAlbumsDisabled && (
                <TopBanner className="bg-warning">{c('Info')
                    .t`We are experiencing technical issues. Any albums related actions are temporarily disabled.`}</TopBanner>
            )}

            {currentPageType === AlbumsPageTypes.GALLERY && <PhotosRecoveryBanner />}

            {hasPreview && (
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
                        (isDecryptedLink(previewItem) && previewItem?.trashed) || isAlbumsWithSharingDisabled
                            ? undefined
                            : () => showLinkSharingModal({ shareId: previewShareId, linkId: previewItem.linkId })
                    }
                    onDetails={onShowDetails}
                    onSelectCover={
                        !driveAlbumsDisabled &&
                        (currentPageType === AlbumsPageTypes.GALLERY || album?.cover?.linkId === previewItem.linkId)
                            ? undefined
                            : onSelectCoverPreview
                    }
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
                        currentPageType={currentPageType}
                        previewShareId={previewShareId}
                        uploadLinkId={uploadLinkId}
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
                        onFileUpload={onPhotoUploadedToAlbum}
                        onPreview={handleToolbarPreview}
                        onSelectCover={onSelectCoverToolbar}
                        onDeleteAlbum={onDeleteAlbum}
                        onLeaveAlbum={onLeaveAlbum}
                        onShowDetails={onShowDetails}
                        onRemoveAlbumPhotos={onRemoveAlbumPhotos}
                    />
                }
            />

            {/* TODO: Remove outlet context or combine it with PhotoLayoutStore */}
            {/** Outlet will render the routed page grid */}
            <Outlet context={photosView} />

            {/** Modals that are necessary on all views */}
            {linkSharingModal}

            {/** Modals that are necessary only on gallery and album gallery views */}
            {(currentPageType === AlbumsPageTypes.GALLERY || currentPageType === AlbumsPageTypes.ALBUMSGALLERY) && (
                <>{detailsModal}</>
            )}

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
        </>
    );
};
