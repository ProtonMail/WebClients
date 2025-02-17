import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { c, msgid } from 'ttag';

import {
    Loader,
    NavigationControl,
    TopBanner,
    useAppTitle,
    useConfig,
    useModalStateObject,
    useNotifications,
} from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { useFlag } from '@proton/unleash';

import PortalPreview from '../../components/PortalPreview';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import type { OnFileUploadSuccessCallbackData, PhotoLink } from '../../store';
import { isDecryptedLink, useThumbnailsDownload } from '../../store';
import { sendErrorReport } from '../../utils/errorHandling';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { PhotosGrid } from './PhotosGrid';
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
    const { createNotification } = useNotifications();
    let { albumLinkId } = useParams<{ albumLinkId: string }>();
    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const {
        shareId,
        linkId,
        albums,
        userAddressEmail,
        loadPhotoLink,
        requestDownload,
        albumPhotos,
        addAlbumPhoto,
        albumPhotosLinkIdToIndexMap,
        albumPhotosLinkIds,
        isAlbumsLoading,
        isAlbumPhotosLoading,
        setPhotoAsCover,
    } = usePhotosWithAlbumsView();

    const { selectedItems, clearSelection, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection(
        albumPhotos,
        albumPhotosLinkIdToIndexMap
    );
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isAlbumsLoading);
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const createAlbumModal = useModalStateObject();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const [previewLinkId, setPreviewLinkId] = useState<string | undefined>();
    const isShiftPressed = useShiftKey();
    const thumbnails = useThumbnailsDownload();
    const { navigateToAlbums } = useNavigate();

    const handleItemRender = useCallback(
        (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
            incrementItemRenderedCounter();
            loadPhotoLink(itemLinkId, domRef);
        },
        [incrementItemRenderedCounter, loadPhotoLink]
    );

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
        if (shareId) {
            thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
        }
    };

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
            if (!file) {
                return;
            }
            const abortSignal = new AbortController().signal;
            try {
                await addAlbumPhoto(abortSignal, file.fileId);
            } catch (e) {
                if (e instanceof Error) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [createNotification, addAlbumPhoto]
    );

    const onSelectCover = useCallback(async () => {
        if (previewItem) {
            const abortSignal = new AbortController().signal;
            try {
                await setPhotoAsCover(abortSignal, previewItem.linkId);
                createNotification({ text: c('Info').t`Photo is set as album cover` });
            } catch (e) {
                if (e instanceof Error) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        }
    }, [createNotification, setPhotoAsCover, previewItem]);

    const isAlbumPhotosEmpty = albumPhotos.length === 0;
    const album = albumLinkId ? albums.find((album) => album.linkId === albumLinkId) : undefined;
    const isOwner = album?.signatureEmail === userAddressEmail;

    useEffect(() => {
        if (album) {
            updateTitle(`Album > ${album.name}`);
        }
    }, [album, updateTitle]);

    if (!shareId || !linkId || !album || isAlbumsLoading || isAlbumPhotosLoading) {
        return <Loader />;
    }

    // TODO: Album not found view

    const hasPreview = !!previewItem;
    // If you own the root photo share, your uploads always goes to the root (photo stream) and then we add the photos to the album
    // If you don't own it (shared album), you upload directly in the album as a folder, it won't appear in photo stream
    const uploadLinkId = isOwner ? linkId : albumLinkId || linkId;

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
                    shareId={shareId}
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
                            : () => showLinkSharingModal({ shareId, linkId: previewItem.linkId })
                    }
                    onDetails={() =>
                        showDetailsModal({
                            shareId,
                            linkId: previewItem.linkId,
                        })
                    }
                    onSelectCover={onSelectCover}
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
            <UploadDragDrop
                disabled={isUploadDisabled}
                isForPhotos={true}
                shareId={shareId}
                parentLinkId={uploadLinkId}
                onFileUpload={onPhotoUploadedToAlbum}
                className="flex flex-column flex-nowrap flex-1"
            >
                <ToolbarRow
                    titleArea={
                        <>
                            {selectedCount > 0 && (
                                <span className="flex items-center text-strong pl-1">
                                    <div className="flex gap-2" data-testid="photos-selected-count">
                                        <PhotosClearSelectionButton onClick={clearSelection} />
                                        {/* aria-live & aria-atomic ensure the count gets revocalized when it changes */}
                                        <span aria-live="polite" aria-atomic="true">
                                            {c('Info').ngettext(
                                                msgid`${selectedCount} selected`,
                                                `${selectedCount} selected`,
                                                selectedCount
                                            )}
                                        </span>
                                    </div>
                                </span>
                            )}

                            {selectedCount === 0 && album && (
                                <ToolbarLeftActionsAlbumsGallery
                                    onAlbumsClick={() => {
                                        navigateToAlbums();
                                    }}
                                    name={album.name}
                                    isLoading={isAlbumsLoading}
                                />
                            )}
                        </>
                    }
                    toolbar={
                        <PhotosWithAlbumsToolbar
                            shareId={shareId}
                            linkId={uploadLinkId}
                            selectedItems={selectedItems}
                            onPreview={handleToolbarPreview}
                            requestDownload={requestDownload}
                            data={albumPhotos}
                            uploadDisabled={isUploadDisabled}
                            tabSelection={'albums-gallery'}
                            createAlbumModal={createAlbumModal}
                            onFileUpload={onPhotoUploadedToAlbum}
                        />
                    }
                />

                {isAlbumPhotosEmpty ? (
                    <>
                        <span>Empty Albums View</span>
                    </>
                ) : (
                    <PhotosGrid
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
                )}
            </UploadDragDrop>
        </>
    );
};
