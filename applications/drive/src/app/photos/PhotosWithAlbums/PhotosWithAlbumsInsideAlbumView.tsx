import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom-v5-compat';

import { c, msgid } from 'ttag';

import {
    Loader,
    NavigationControl,
    TopBanner,
    useAppTitle,
    useConfig,
    useConfirmActionModal,
    useModalStateObject,
    useNotifications,
} from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import PortalPreview from '../../components/PortalPreview';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import type { OnFileUploadSuccessCallbackData, PhotoLink } from '../../store';
import { isDecryptedLink, useSharedWithMeActions, useThumbnailsDownload } from '../../store';
import { useLink, useLinksActions } from '../../store/_links';
import { sendErrorReport } from '../../utils/errorHandling';
import { useDeleteAlbumModal } from '../PhotosModals/DeleteAlbumModal';
import { useRemoveAlbumPhotosModal } from '../PhotosModals/RemoveAlbumPhotosModal';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { PhotosInsideAlbumsGrid } from './PhotosInsideAlbumsGrid';
import { AlbumCoverHeader } from './components/AlbumCoverHeader';
import { PhotosClearSelectionButton } from './components/PhotosClearSelectionButton';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import { PhotosWithAlbumsToolbar, ToolbarLeftActionsAlbumsGallery } from './toolbar/PhotosWithAlbumsToolbar';

const useAppTitleUpdate = () => {
    const { APP_NAME } = useConfig();

    const memoedTitle = useCallback((title?: string, maybeAppName?: string) => {
        const appName = maybeAppName || getAppName(APP_NAME);
        return [title, appName].filter(Boolean).join(' - ');
    }, []);

    return (title?: string, maybeAppName?: string) => {
        const titleUpdate = memoedTitle(title, maybeAppName);
        if (titleUpdate === undefined) {
            return;
        }
        document.title = titleUpdate;
    };
};

export const PhotosWithAlbumsInsideAlbumView: FC = () => {
    useAppTitle(c('Title').t`Album`);
    const updateTitle = useAppTitleUpdate();
    let [searchParams, setSearchParams] = useSearchParams();
    const { createNotification } = useNotifications();
    const { albumLinkId, albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const {
        shareId,
        linkId,
        albums,
        loadPhotoLink,
        requestDownload,
        albumPhotos,
        addAlbumPhoto,
        albumPhotosLinkIdToIndexMap,
        albumPhotosLinkIds,
        isAlbumsLoading,
        isAlbumPhotosLoading,
        setPhotoAsCover,
        removeAlbumPhotos,
        photoLinkIds,
        deleteAlbum,
        userAddressEmail,
        refreshSharedWithMeAlbums,
    } = usePhotosWithAlbumsView();
    const { removeMe } = useSharedWithMeActions();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { selectedItems, clearSelection, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection(
        albumPhotos,
        albumPhotosLinkIdToIndexMap
    );
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isAlbumsLoading);
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const createAlbumModal = useModalStateObject();
    const [removeAlbumPhotosModal, showRemoveAlbumPhotosModal] = useRemoveAlbumPhotosModal();
    const [deleteAlbumModal, showDeleteAlbumModal] = useDeleteAlbumModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const containerRef = useRef<HTMLDivElement>(null);

    const [previewLinkId, setPreviewLinkId] = useState<string | undefined>();
    const isShiftPressed = useShiftKey();
    const thumbnails = useThumbnailsDownload();
    const { navigateToAlbums } = useNavigate();
    const { moveLinks } = useLinksActions();
    const { getLink } = useLink();

    const handleItemRender = useCallback(
        (itemLinkId: string, domRef?: React.MutableRefObject<unknown>) => {
            if (!albumShareId) {
                return;
            }
            incrementItemRenderedCounter();
            loadPhotoLink(albumShareId, itemLinkId, domRef);
        },
        [incrementItemRenderedCounter, loadPhotoLink, albumShareId]
    );

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef?: React.MutableRefObject<unknown>) => {
        if (albumShareId) {
            thumbnails.addToDownloadQueue(albumShareId, itemLinkId, undefined, domRef);
        }
    };

    const album = albumLinkId ? albums.find((album) => album.linkId === albumLinkId) : undefined;
    const photoCount = albumPhotos.length;
    const selectedCount = selectedItems.length;

    const handleToolbarPreview = useCallback(() => {
        let selected = selectedItems[0];

        if (selectedItems.length === 1 && selected) {
            setPreviewLinkId(selected.linkId);
        }
    }, [selectedItems, setPreviewLinkId]);

    const previewRef = useRef<HTMLDivElement>(null);
    const previewIndex = useMemo(
        () => albumPhotosLinkIds.findIndex((item) => item === previewLinkId),
        [albumPhotosLinkIds, previewLinkId]
    );
    const previewItem = useMemo(
        () =>
            previewLinkId !== undefined
                ? (albumPhotos[albumPhotosLinkIdToIndexMap[previewLinkId]] as PhotoLink)
                : undefined,
        [albumPhotos, previewLinkId, albumPhotosLinkIdToIndexMap]
    );
    const setPreviewIndex = useCallback(
        (index: number) => setPreviewLinkId(albumPhotosLinkIds[index]),
        [setPreviewLinkId, albumPhotosLinkIds]
    );

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
                if (album.permissions.isOwner) {
                    await addAlbumPhoto(abortSignal, albumShareId, file.fileId);
                }
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [createNotification, addAlbumPhoto, albumShareId, album]
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
        if (!previewItem) {
            sendErrorReport(new Error('Unable to set photo as cover'));
            createNotification({ text: c('Error').t`Unable to set photo as cover`, type: 'error' });
            return;
        }
        await onSelectCover(previewItem.linkId);
        // Optimistic: change the cover manually in memory
        if (album) {
            const cover = await getLink(new AbortController().signal, previewItem.rootShareId, previewItem.linkId);
            album.cover = cover;
        }
    }, [createNotification, onSelectCover, getLink, previewItem, album]);

    const onSelectCoverToolbar = useCallback(async () => {
        const selectedItem = selectedItems[0];
        if (!selectedItem) {
            sendErrorReport(new Error('Unable to set photo as cover'));
            createNotification({ text: c('Error').t`Unable to set photo as cover`, type: 'error' });
            return;
        }
        await onSelectCover(selectedItem.linkId);
    }, [createNotification, onSelectCover, selectedItems]);

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
            if (!albumShareId || !linkId || !albumLinkId) {
                return;
            }
            try {
                if (missingPhotosIds) {
                    await moveLinks(abortSignal, {
                        shareId: albumShareId,
                        linkIds: missingPhotosIds,
                        newShareId: albumShareId,
                        newParentLinkId: linkId,
                    });
                }
                await removeAlbumPhotos(abortSignal, albumLinkId, selectedPhotosIds);
                createNotification({
                    text: c('Info').ngettext(
                        msgid`Your photo has been removed from the album`,
                        `Your photos have been removed from the album`,
                        selectedPhotosIds.length
                    ),
                });
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [albumShareId, linkId, moveLinks, removeAlbumPhotos, albumLinkId]
    );

    const onRemoveAlbumPhotos = useCallback(async () => {
        const { missingPhotosIds, selectedPhotosIds } = selectedItems.reduce<{
            selectedPhotosIds: string[];
            missingPhotosIds: string[];
        }>(
            (acc, item) => {
                if (!photoLinkIds.includes(item.linkId)) {
                    acc.missingPhotosIds.push(item.linkId);
                }
                acc.selectedPhotosIds.push(item.linkId);
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
    }, [selectedItems, photoLinkIds, handleRemoveAlbumPhotos, showRemoveAlbumPhotosModal]);

    const isAlbumPhotosEmpty = albumPhotos.length === 0;
    const albumName = album?.name;

    const handleDeleteAlbum = useCallback(
        async (
            abortSignal: AbortSignal,
            { missingPhotosIds, force }: { missingPhotosIds: string[]; force: boolean }
        ) => {
            if (!albumShareId || !linkId || !albumName || !albumLinkId) {
                return;
            }
            try {
                if (missingPhotosIds.length && !force) {
                    await moveLinks(abortSignal, {
                        shareId: albumShareId,
                        linkIds: missingPhotosIds,
                        newShareId: shareId,
                        newParentLinkId: linkId,
                    });
                }
                await deleteAlbum(abortSignal, albumLinkId, force);
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
            createNotification({
                text: c('Info').t`${albumName} has been successfully deleted`,
            });
        },
        [albumShareId, linkId, shareId, moveLinks, deleteAlbum, albumLinkId, albumName]
    );

    // For delete album we do the happy path and just compare with photos you have in cache.
    // In most cases, if user have all the photos in his library will mean there are no direct children inside the album
    // There is a fallback in the modal in case BE detect that some items are direct children of the album
    const onDeleteAlbum = useCallback(async () => {
        if (!albumName) {
            return;
        }
        const abortSignal = new AbortController().signal;
        const missingPhotosIds = albumPhotosLinkIds.filter((photoLinkId) => !photoLinkIds.includes(photoLinkId));
        void showDeleteAlbumModal({
            missingPhotosCount: missingPhotosIds.length,
            name: albumName,
            deleteAlbum: (force, childLinkIds) =>
                // childLinkIds are from BE, so this is a better source of truth compare to missingPhotosIds
                handleDeleteAlbum(abortSignal, { missingPhotosIds: childLinkIds || missingPhotosIds, force }),
            onDeleted: () => {
                navigateToAlbums();
            },
        });
    }, [albumPhotosLinkIds, photoLinkIds, handleDeleteAlbum, showDeleteAlbumModal, albumName, navigateToAlbums]);

    const albumSharingShareId = album?.sharingDetails?.shareId;
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

    const onShowDetails = useCallback(async () => {
        if (!albumShareId || !albumLinkId) {
            return;
        }
        showDetailsModal({
            shareId: albumShareId,
            linkId: previewItem ? previewItem.linkId : albumLinkId,
        });
    }, [albumShareId, albumLinkId, showDetailsModal, previewItem]);

    useEffect(() => {
        if (albumName) {
            updateTitle(`Album > ${albumName}`);
        }
    }, [albumName, updateTitle]);

    useEffect(() => {
        if (album && (albumShareId || album.shareId)) {
            // album.shareId if album is shared already
            // albumShareId otherwise
            const validShareId = album.shareId || albumShareId;
            if (searchParams.has('openShare') && typeof validShareId === 'string') {
                showLinkSharingModal({ shareId: validShareId, linkId: album.linkId });
                searchParams.delete('openShare');
                setSearchParams(searchParams);
            }
        }
    }, [albumShareId, album, searchParams, setSearchParams, showLinkSharingModal]);

    if (!albumShareId || !linkId || !album || isAlbumsLoading || isAlbumPhotosLoading) {
        return <Loader />;
    }

    // TODO: Album not found view

    const hasPreview = !!previewItem;
    // If you own the root photo share, your uploads always goes to the root (photo stream) and then we add the photos to the album
    // If you don't own it (shared album), you upload directly in the album as a folder, it won't appear in photo stream
    const uploadLinkId = album.permissions.isOwner ? linkId : albumLinkId || linkId;

    const canRemoveSelectedPhotos =
        album.permissions.isAdmin ||
        selectedItems.every((item) => item.activeRevision?.signatureEmail === userAddressEmail);

    const viewOnly = isUploadDisabled || !album.permissions.isEditor;

    return (
        <>
            {detailsModal}
            {linkSharingModal}
            {isUploadDisabled && (
                <TopBanner className="bg-warning">{c('Info')
                    .t`We are experiencing technical issues. Uploading new photos is temporarily disabled.`}</TopBanner>
            )}
            {hasPreview && (
                <PortalPreview
                    ref={previewRef}
                    shareId={albumShareId}
                    linkId={previewItem.linkId}
                    revisionId={isDecryptedLink(previewItem) ? previewItem.activeRevision?.id : undefined}
                    key="portal-preview-photos"
                    open={hasPreview}
                    date={
                        previewItem.activeRevision?.photo?.captureTime ||
                        (isDecryptedLink(previewItem) ? previewItem.createTime : undefined)
                    }
                    onShare={
                        isDecryptedLink(previewItem) && previewItem?.trashed
                            ? undefined
                            : () => showLinkSharingModal({ shareId: albumShareId, linkId: previewItem.linkId })
                    }
                    onDetails={onShowDetails}
                    onSelectCover={onSelectCoverPreview}
                    navigationControls={
                        <NavigationControl
                            current={previewIndex + 1}
                            total={photoCount - 1}
                            rootRef={previewRef}
                            onPrev={() => setPreviewIndex(previewIndex - 1)}
                            onNext={() => setPreviewIndex(previewIndex + 1)}
                        />
                    }
                    onClose={() => setPreviewLinkId(undefined)}
                    onExit={() => setPreviewLinkId(undefined)}
                />
            )}
            <UploadDragDrop
                disabled={viewOnly}
                isForPhotos={true}
                shareId={albumShareId}
                parentLinkId={uploadLinkId}
                onFileUpload={onPhotoUploadedToAlbum}
                onFileSkipped={onPhotoUploadedToAlbum}
                className="flex flex-column flex-nowrap flex-1"
            >
                <ToolbarRow
                    className={clsx('m-2 rounded toolbar-row--no-responsive', selectedCount > 0 && 'bg-weak')}
                    withBorder={false}
                    withPadding={false}
                    titleArea={
                        <>
                            {selectedCount > 0 && (
                                <span className="flex items-center pl-1">
                                    <div className="flex gap-2" data-testid="photos-selected-count">
                                        <PhotosClearSelectionButton onClick={clearSelection}>
                                            {/* aria-live & aria-atomic ensure the count gets revocalized when it changes */}
                                            <span aria-live="polite" aria-atomic="true">
                                                {c('Info').ngettext(
                                                    msgid`${selectedCount} selected`,
                                                    `${selectedCount} selected`,
                                                    selectedCount
                                                )}
                                            </span>
                                        </PhotosClearSelectionButton>
                                    </div>
                                </span>
                            )}

                            {selectedCount === 0 && albumName && (
                                <ToolbarLeftActionsAlbumsGallery
                                    onAlbumsClick={() => {
                                        navigateToAlbums();
                                    }}
                                    name={albumName}
                                    isLoading={isAlbumsLoading}
                                />
                            )}
                        </>
                    }
                    toolbar={
                        <PhotosWithAlbumsToolbar
                            shareId={albumShareId}
                            linkId={uploadLinkId}
                            album={album}
                            selectedItems={selectedItems}
                            onPreview={handleToolbarPreview}
                            requestDownload={requestDownload}
                            data={albumPhotos}
                            uploadDisabled={viewOnly}
                            tabSelection={'albums-gallery'}
                            createAlbumModal={createAlbumModal}
                            onFileUpload={onPhotoUploadedToAlbum}
                            onFileSkipped={onPhotoUploadedToAlbum}
                            removeAlbumPhotos={canRemoveSelectedPhotos ? onRemoveAlbumPhotos : undefined}
                            onSelectCover={onSelectCoverToolbar}
                            onDeleteAlbum={onDeleteAlbum}
                            onLeaveAlbum={onLeaveAlbum}
                            onShowDetails={onShowDetails}
                        />
                    }
                />

                {isAlbumPhotosEmpty ? (
                    <div className="flex flex-column flex-nowrap mx-2 w-full h-full">
                        <AlbumCoverHeader
                            shareId={albumShareId}
                            linkId={uploadLinkId}
                            onFileUpload={onPhotoUploadedToAlbum}
                            onFileSkipped={onPhotoUploadedToAlbum}
                            album={album}
                            onShare={() => {
                                showLinkSharingModal({ shareId: albumShareId, linkId: album.linkId });
                            }}
                        />
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        className="flex flex-column flex-nowrap mx-2 w-full h-full overflow-auto outline-none--at-all mb-2"
                    >
                        <AlbumCoverHeader
                            album={album}
                            shareId={albumShareId}
                            onFileUpload={onPhotoUploadedToAlbum}
                            onFileSkipped={onPhotoUploadedToAlbum}
                            linkId={uploadLinkId}
                            onShare={() => {
                                showLinkSharingModal({ shareId: albumShareId, linkId: album.linkId });
                            }}
                        />
                        <PhotosInsideAlbumsGrid
                            data={albumPhotos}
                            onItemRender={handleItemRender}
                            onItemRenderLoadedLink={handleItemRenderLoadedLink}
                            isLoading={isAlbumsLoading}
                            onItemClick={setPreviewLinkId}
                            hasSelection={selectedCount > 0}
                            onSelectChange={(i, isSelected) =>
                                handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                            }
                            isGroupSelected={isGroupSelected}
                            isItemSelected={isItemSelected}
                        />
                    </div>
                )}
            </UploadDragDrop>
            {removeAlbumPhotosModal}
            {deleteAlbumModal}
            {confirmModal}
        </>
    );
};
