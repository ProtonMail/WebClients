import type { FC } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Loader, NavigationControl, TopBanner, useAppTitle, useModalStateObject } from '@proton/components';
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
import type { PhotoLink } from '../../store';
import { PhotoTag, isDecryptedLink, useThumbnailsDownload } from '../../store';
import { useCreateAlbum } from '../PhotosActions/Albums';
import { AddAlbumPhotosModal } from '../PhotosModals/AddAlbumPhotosModal';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { EmptyPhotos } from './EmptyPhotos';
import { PhotosGrid } from './PhotosGrid';
import { PhotosClearSelectionButton } from './components/PhotosClearSelectionButton';
import PhotosRecoveryBanner from './components/PhotosRecoveryBanner/PhotosRecoveryBanner';
import { PhotosTags, type PhotosTagsProps } from './components/Tags';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import { PhotosWithAlbumsToolbar, ToolbarLeftActionsGallery } from './toolbar/PhotosWithAlbumsToolbar';

export const PhotosWithAlbumsView: FC = () => {
    useAppTitle(c('Title').t`Photos`);
    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const {
        volumeId,
        shareId,
        linkId,
        albums,
        photos,
        isPhotosLoading,
        loadPhotoLink,
        photoLinkIdToIndexMap,
        photoLinkIds,
        requestDownload,
        addAlbumPhotos,
    } = usePhotosWithAlbumsView();

    const { selectedItems, clearSelection, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection(
        photos,
        photoLinkIdToIndexMap
    );
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const createAlbumModal = useModalStateObject();
    const addAlbumPhotosModal = useModalStateObject();
    const createAlbum = useCreateAlbum();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const [previewLinkId, setPreviewLinkId] = useState<string | undefined>();
    const isShiftPressed = useShiftKey();
    const thumbnails = useThumbnailsDownload();
    const { navigateToAlbum, navigateToAlbums, navigateToPhotos } = useNavigate();
    // TODO: Move tag selection to specific hook
    const [selectedTags, setSelectedTags] = useState<PhotosTagsProps['selectedTags']>([PhotoTag.All]);

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

    const photoCount = photoLinkIds.length;
    const selectedCount = selectedItems.length;

    const handleToolbarPreview = useCallback(() => {
        let selected = selectedItems[0];

        if (selectedItems.length === 1 && selected) {
            setPreviewLinkId(selected.linkId);
        }
    }, [selectedItems, setPreviewLinkId]);

    const previewRef = useRef<HTMLDivElement>(null);
    const previewIndex = useMemo(
        () => photoLinkIds.findIndex((item) => item === previewLinkId),
        [photoLinkIds, previewLinkId]
    );
    const previewItem = useMemo(
        () => (previewLinkId !== undefined ? (photos[photoLinkIdToIndexMap[previewLinkId]] as PhotoLink) : undefined),
        [photos, previewLinkId, photoLinkIdToIndexMap]
    );
    const setPreviewIndex = useCallback(
        (index: number) => setPreviewLinkId(photoLinkIds[index]),
        [setPreviewLinkId, photoLinkIds]
    );
    const isPhotosEmpty = photos.length === 0;

    const onAddAlbumPhotos = useCallback(
        async (albumLinkId: string, linkIds: string[]) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                await addAlbumPhotos(abortSignal, albumLinkId, linkIds);
                navigateToAlbum(albumLinkId);
            } catch (e) {
                console.error('photos addition failed', e);
            }
        },
        [shareId, linkId, createAlbum, navigateToAlbum]
    );

    const onCreateAlbumWithPhotos = useCallback(
        async (name: string, linkIds: string[]) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const albumLinkId = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                await addAlbumPhotos(abortSignal, albumLinkId, linkIds);
                navigateToAlbum(albumLinkId);
            } catch (e) {
                console.error('album creation failed', e);
            }
        },
        [shareId, linkId, createAlbum, navigateToAlbum]
    );

    if (!shareId || !linkId || isPhotosLoading) {
        return <Loader />;
    }

    const hasPreview = !!previewItem;

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
            <PhotosRecoveryBanner />
            <UploadDragDrop
                disabled={isUploadDisabled}
                isForPhotos={true}
                shareId={shareId}
                parentLinkId={linkId}
                className="flex flex-column flex-nowrap flex-1"
            >
                <ToolbarRow
                    className={clsx('m-2 rounded toolbar-row--no-responsive', selectedCount > 0 && 'bg-weak')}
                    withBorder={false}
                    withPadding={false}
                    titleArea={
                        <>
                            {selectedCount > 0 && (
                                <span className="flex items-center text-strong pl-1">
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

                            {selectedCount === 0 && (
                                <ToolbarLeftActionsGallery
                                    onGalleryClick={() => {
                                        navigateToPhotos();
                                    }}
                                    onAlbumsClick={() => {
                                        navigateToAlbums();
                                    }}
                                    isLoading={isPhotosLoading}
                                    selection={'gallery'}
                                />
                            )}
                        </>
                    }
                    toolbar={
                        <PhotosWithAlbumsToolbar
                            shareId={shareId}
                            linkId={linkId}
                            data={photos}
                            selectedItems={selectedItems}
                            onPreview={handleToolbarPreview}
                            requestDownload={requestDownload}
                            uploadDisabled={isUploadDisabled}
                            tabSelection={'gallery'}
                            createAlbumModal={createAlbumModal}
                            addAlbumPhotosModal={addAlbumPhotosModal}
                        />
                    }
                />

                {!isPhotosEmpty && (
                    <PhotosTags
                        selectedTags={selectedTags}
                        tags={[
                            PhotoTag.All,
                            PhotoTag.Favorites,
                            PhotoTag.Screenshots,
                            PhotoTag.Videos,
                            PhotoTag.LivePhotos,
                            PhotoTag.MotionPhotos,
                            PhotoTag.Selfies,
                            PhotoTag.Portraits,
                            PhotoTag.Bursts,
                            PhotoTag.Panoramas,
                            PhotoTag.Raw,
                        ]}
                        onTagSelect={setSelectedTags}
                    />
                )}

                {isPhotosEmpty ? (
                    <EmptyPhotos shareId={shareId} linkId={linkId} />
                ) : (
                    <PhotosGrid
                        data={photos}
                        onItemRender={handleItemRender}
                        onItemRenderLoadedLink={handleItemRenderLoadedLink}
                        isLoading={isPhotosLoading}
                        onItemClick={setPreviewLinkId}
                        hasSelection={selectedCount > 0}
                        onSelectChange={(i, isSelected) =>
                            handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                        }
                        isGroupSelected={isGroupSelected}
                        isItemSelected={isItemSelected}
                    />
                )}
                <AddAlbumPhotosModal
                    addAlbumPhotosModal={addAlbumPhotosModal}
                    onCreateAlbumWithPhotos={onCreateAlbumWithPhotos}
                    onAddAlbumPhotos={onAddAlbumPhotos}
                    albums={albums}
                    photos={selectedItems}
                />
            </UploadDragDrop>
        </>
    );
};
