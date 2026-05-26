import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { Loader } from '@proton/components';
import { MemberRole, generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { uploadManager } from '@proton/drive/modules/upload';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import useNavigate from '../../../legacy/hooks/drive/useNavigate';
import { usePhotosPreviewModal } from '../../../modals/preview';
import { ToolbarRow } from '../../../statelessComponents/ToolbarRow/ToolbarRow';
import { UploadDragDrop } from '../../../statelessComponents/UploadDragDrop/UploadDragDrop';
import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { dateToLegacyTimestamp } from '../../../utils/sdk/legacyTime';
import { toggleFavorite } from '../../PhotosActions/Albums';
import { usePhotosActions } from '../../PhotosActions/usePhotosActions';
import { AddAlbumPhotosModal } from '../../PhotosModals/AddAlbumPhotosModal';
import { CreateAlbumModal } from '../../PhotosModals/CreateAlbumModal';
import { useAlbumPhotoUploadSDKStore } from '../../PhotosStore/useAlbumPhotoUploadSDK.store';
import { usePhotosWithAlbumsView } from '../../PhotosStore/usePhotosWithAlbumView';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../layout.store';
import { loadAlbumInvitations } from '../../loaders/loadAlbumInvitations';
import { loadSharedWithMeAlbums } from '../../loaders/loadAlbums';
import { useAlbumsStore } from '../../useAlbums.store';
import { usePhotosStore } from '../../usePhotos.store';
import PhotosRecoveryBanner from '../components/PhotosRecoveryBanner/PhotosRecoveryBanner';
import { usePhotosSelection } from '../hooks/usePhotosSelection';
import { subscribeToAlbumUploadEvents } from '../subscribeToAlbumUploadEvents';
import { TitleArea } from '../toolbar/TitleArea';
import { Toolbar } from '../toolbar/Toolbar';

export type PhotosLayoutOutletContext = ReturnType<typeof usePhotosWithAlbumsView>;

export const PhotosLayout = () => {
    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const { albumLinkId, albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const { pathname } = useLocation();
    const photosView = usePhotosWithAlbumsView();
    const [previewModal, showPreviewModal] = usePhotosPreviewModal();

    const {
        albumsUids,
        albumPhotoTimelineUids,
        photoTimelineUids,
        requestDownload,
        isAlbumsLoading,
        isPhotosLoading,
        handleSelectTag,
    } = photosView;

    // TODO: Migrate volumeId/linkId — not yet derivable from the store alone
    const [photosRootIds, setPhotosRootIds] = useState<{ volumeId: string; linkId: string } | undefined>();
    const volumeId = photosRootIds?.volumeId ?? '';
    const linkId = photosRootIds?.linkId ?? '';
    const {
        modals,
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
    } = usePhotosActions();

    const { currentPageType, previewNodeUid, setPageType, setPreviewNodeUid, setLayoutModals } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
            previewNodeUid: state.previewNodeUid,
            setPageType: state.setPageType,
            setPreviewNodeUid: state.setPreviewNodeUid,
            setLayoutModals: state.setLayoutModals,
        }))
    );

    const { selectedItems, clearSelection } = usePhotosSelection({
        photoTimelineUids,
        albumPhotoTimelineUids,
    });

    const { navigateToNodeUid, navigateToAlbum } = useNavigate();

    const album = useAlbumsStore(
        useShallow((state) => (state.currentAlbumNodeUid ? state.albums.get(state.currentAlbumNodeUid) : undefined))
    );

    const canRemoveSelectedPhotos = useMemo(() => {
        return Boolean(album?.directRole !== MemberRole.Viewer);
    }, [album]);

    const selectedCount = selectedItems.length;
    const selectedItemsNodeUids = useMemo(() => selectedItems.map((item) => item.nodeUid), [selectedItems]);

    const uploadDisabled = useMemo(() => {
        if (currentPageType === AlbumsPageTypes.GALLERY || currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) {
            return isUploadDisabled;
        }
        if (currentPageType === AlbumsPageTypes.ALBUMS) {
            return true;
        }
        return isUploadDisabled || Boolean(album && album.directRole === MemberRole.Viewer);
    }, [currentPageType, isUploadDisabled, album]);

    const isGalleryOrAdmin =
        currentPageType === AlbumsPageTypes.GALLERY ||
        (currentPageType === AlbumsPageTypes.ALBUMSGALLERY && album?.isOwner);
    const canChangeAlbumCoverInPreview = isGalleryOrAdmin;

    const previewItem = usePhotosStore((state) => (previewNodeUid ? state.photoItems.get(previewNodeUid) : undefined));

    const onSelectCoverPreview = useCallback(async () => {
        if (!previewItem || typeof previewItem === 'string') {
            handleSdkError(new Error('Unable to set photo as cover'));
            return;
        }
        await onSelectCover(previewItem.nodeUid);
    }, [onSelectCover, previewItem]);

    const handleToolbarPreview = useCallback(() => {
        if (selectedItems.length !== 1) {
            return;
        }
        setPreviewNodeUid(selectedItems[0].nodeUid);
    }, [selectedItems, setPreviewNodeUid]);

    const onSelectCoverToolbar = useCallback(async () => {
        const selectedNodeUid = selectedItemsNodeUids[0];
        if (!selectedNodeUid) {
            handleSdkError(new Error('Unable to set photo as cover'));
            return;
        }
        await onSelectCover(selectedNodeUid);
        clearSelection();
    }, [onSelectCover, selectedItemsNodeUids, clearSelection]);

    const handleSavePhotos = useCallback(async () => {
        await onSavePhotos(selectedItemsNodeUids, clearSelection);
    }, [onSavePhotos, selectedItemsNodeUids, clearSelection]);

    const onAddAlbumPhotosToolbar = useCallback(async () => {
        if (currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) {
            await onAddAlbumPhotosFromGallery(selectedItemsNodeUids);
        } else {
            const albumNodeUid = useAlbumsStore.getState().currentAlbumNodeUid;
            if (albumNodeUid) {
                void navigateToNodeUid(albumNodeUid, getDriveForPhotos(), undefined, { addPhotos: true });
            }
        }
    }, [currentPageType, selectedItemsNodeUids, onAddAlbumPhotosFromGallery, navigateToNodeUid]);

    const handleRedirectToAlbum = useCallback(() => {
        if (albumShareId && albumLinkId) {
            navigateToAlbum(albumShareId, albumLinkId);
        }
    }, [albumShareId, albumLinkId, navigateToAlbum]);

    /*
        Effects
    */
    useEffect(() => {
        setLayoutModals({
            linkSharing: modals.showSharingModal,
            deleteAlbum: modals.showDeleteAlbumModal,
            createAlbum: modals.createAlbumModal,
        });
    }, [setLayoutModals, modals.showSharingModal, modals.showDeleteAlbumModal, modals.createAlbumModal]);

    useEffect(() => {
        const abortController = new AbortController();
        clearSelection();
        void handleSelectTag([PhotoTag.All]);
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

    useEffect(function initializePhotos() {
        const drive = getDriveForPhotos();

        void drive.getMyPhotosRootFolder().then((nodeUidOrMaybeNode) => {
            const nodeUid =
                typeof nodeUidOrMaybeNode === 'string'
                    ? nodeUidOrMaybeNode
                    : getNodeEntity(nodeUidOrMaybeNode).node.uid;
            const { volumeId, nodeId: linkId } = splitNodeUid(nodeUid);
            setPhotosRootIds({ volumeId, linkId });
        });
    }, []);

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
            currentPageType === AlbumsPageTypes.ALBUMSGALLERY ? albumPhotoTimelineUids : photosStore.photoTimelineUids;

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
                onSelectCover:
                    canChangeAlbumCoverInPreview &&
                    currentPageType === AlbumsPageTypes.ALBUMSGALLERY &&
                    albumStore.getCurrentAlbum()?.coverNodeUid !== photoItem.nodeUid
                        ? () => onSelectCoverPreview()
                        : undefined,
            },
        });
    }, [
        albumPhotoTimelineUids,
        canChangeAlbumCoverInPreview,
        currentPageType,
        onSelectCoverPreview,
        previewItem,
        setPreviewNodeUid,
        showPreviewModal,
        volumeId,
    ]);

    const isPhotosPage =
        currentPageType === AlbumsPageTypes.GALLERY ||
        currentPageType === AlbumsPageTypes.ALBUMS ||
        currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS ||
        currentPageType === AlbumsPageTypes.ALBUMSGALLERY;

    useEffect(() => {
        if (!isPhotosPage) {
            return;
        }
        void usePhotosStore.getState().subscribeToEvents('photosProvider');
        return () => {
            void usePhotosStore.getState().unsubscribeFromEvents('photosProvider');
        };
    }, [isPhotosPage]);

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

    useEffect(() => {
        return subscribeToAlbumUploadEvents(onAddAlbumPhotos);
    }, [onAddAlbumPhotos]);

    const isAlbumPageWithoutData =
        (currentPageType === AlbumsPageTypes.ALBUMSGALLERY || currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) &&
        !album;

    if (!currentPageType || !linkId || !volumeId || isAlbumPageWithoutData) {
        return <Loader />;
    }

    return (
        <UploadDragDrop
            disabled={uploadDisabled}
            onDrop={async (dataTransfer) => {
                const albumNodeUid = album?.nodeUid;
                const queuedUploadIds = await uploadManager.uploadPhotos(dataTransfer);
                if (albumNodeUid && queuedUploadIds.length > 0) {
                    queuedUploadIds.forEach((uploadId) => {
                        useAlbumPhotoUploadSDKStore.getState().setContext(uploadId, albumNodeUid);
                    });
                }
                if (currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS) {
                    handleRedirectToAlbum();
                }
            }}
            className="flex flex-column *:min-size-auto flex-nowrap flex-1"
        >
            {/* TODO: Remove this hack when albums cache is fixed and refactored */}
            <PhotosRecoveryBanner onSucceed={() => {}} />

            <ToolbarRow
                className={clsx('m-2 rounded toolbar-row--no-responsive', selectedCount > 0 && 'bg-weak')}
                withBorder={false}
                withPadding={false}
                titleArea={
                    <TitleArea
                        isAlbumsLoading={isAlbumsLoading}
                        isPhotosLoading={isPhotosLoading}
                        photoTimelineUids={photoTimelineUids}
                        albumPhotoTimelineUids={albumPhotoTimelineUids}
                    />
                }
                toolbar={
                    <Toolbar
                        currentPageType={currentPageType}
                        rootNodeUid={volumeId && linkId ? generateNodeUid(volumeId, linkId) : undefined}
                        selectedCount={selectedCount}
                        uploadDisabled={uploadDisabled}
                        canRemoveSelectedPhotos={canRemoveSelectedPhotos}
                        albumsUids={albumsUids}
                        albumUid={album?.nodeUid}
                        uids={Array.from(
                            currentPageType === AlbumsPageTypes.ALBUMSGALLERY
                                ? (albumPhotoTimelineUids ?? new Set<string>())
                                : photoTimelineUids
                        )}
                        selectedItems={selectedItems}
                        createAlbumModal={modals.createAlbumModal}
                        requestDownload={requestDownload}
                        onAddAlbumPhotos={onAddAlbumPhotosToolbar}
                        onUploadStart={handleRedirectToAlbum}
                        openAddPhotosToAlbumModal={openAddPhotosToAlbumModal}
                        openSharePhotosIntoAnAlbumModal={openSharePhotosIntoAnAlbumModal}
                        openSharePhotoModal={() => openSharePhotoModal(selectedItems[0]?.nodeUid)}
                        onPreview={handleToolbarPreview}
                        onSelectCover={onSelectCoverToolbar}
                        onDeleteAlbum={onDeleteAlbum}
                        onLeaveAlbum={onLeaveAlbum}
                        onShowDetails={() => onShowDetails(previewItem)}
                        onRemoveAlbumPhotos={() => onRemoveAlbumPhotos(selectedItemsNodeUids)}
                        onSavePhotos={handleSavePhotos}
                        isAlbumPhotosLoading={isAlbumPhotosLoading}
                    />
                }
            />

            {/* TODO: Remove outlet context or combine it with PhotoLayoutStore */}
            <Outlet context={photosView} />

            {modals.sharingModal}
            {modals.detailsModal}

            {(currentPageType === AlbumsPageTypes.ALBUMS || currentPageType === AlbumsPageTypes.ALBUMSGALLERY) && (
                <>{modals.deleteAlbumModal}</>
            )}

            {currentPageType === AlbumsPageTypes.GALLERY && (
                <AddAlbumPhotosModal
                    addAlbumPhotosModal={modals.addAlbumPhotosModal}
                    onCreateAlbumWithPhotos={onCreateAlbumWithPhotos}
                    onAddAlbumPhotos={onAddAlbumPhotos}
                    photosNodeUids={selectedItemsNodeUids}
                    share={isAddModalShared}
                />
            )}

            {currentPageType === AlbumsPageTypes.ALBUMS && (
                <CreateAlbumModal
                    createAlbumModal={modals.createAlbumModal}
                    createAlbum={onCreateAlbum}
                    share={false}
                />
            )}

            {currentPageType === AlbumsPageTypes.ALBUMSGALLERY && (
                <>
                    {modals.confirmModal}
                    {modals.removeAlbumPhotosModal}
                </>
            )}

            {previewModal}
        </UploadDragDrop>
    );
};
