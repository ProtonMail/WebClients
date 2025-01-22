import type { FC } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Loader, NavigationControl, TopBanner, useAppTitle, useModalStateObject } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { useFlag } from '@proton/unleash';

import PortalPreview from '../../components/PortalPreview';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import type { PhotoLink } from '../../store';
import { isDecryptedLink, useThumbnailsDownload } from '../../store';
import { useCreateAlbum } from '../PhotosActions/Albums';
import { CreateAlbumModal } from '../PhotosModals/CreateAlbumModal';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { AlbumsGrid } from './AlbumsGrid';
import { EmptyPhotos } from './EmptyPhotos';
import { PhotosGrid } from './PhotosGrid';
import { PhotosClearSelectionButton } from './components/PhotosClearSelectionButton';
// import PhotosRecoveryBanner from './components/PhotosRecoveryBanner/PhotosRecoveryBanner';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import { PhotosWithAlbumsToolbar, ToolbarLeftActions } from './toolbar/PhotosWithAlbumsToolbar';

/*
    TODO:
    - Split file into multiple components
*/

export const PhotosView: FC<void> = () => {
    useAppTitle(c('Title').t`Photos`);
    const [tabSelection, setTabSelection] = useState<'albums' | 'gallery'>('gallery');
    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const {
        shareId,
        linkId,
        photos,
        albums,
        isPhotosLoading,
        loadPhotoLink,
        photoLinkIdToIndexMap,
        photoLinkIds,
        requestDownload,
        refreshAlbums,
    } = usePhotosWithAlbumsView();

    const { selectedItems, clearSelection, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection(
        photos,
        photoLinkIdToIndexMap
    );
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const createAlbumModal = useModalStateObject();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const createAlbum = useCreateAlbum();
    const [previewLinkId, setPreviewLinkId] = useState<string | undefined>();
    const isShiftPressed = useShiftKey();
    const thumbnails = useThumbnailsDownload();
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

    const onCreateAlbum = async (name: string) => {
        if (!shareId || !linkId) {
            return;
        }
        try {
            const abortSignal = new AbortController().signal;
            await createAlbum(abortSignal, shareId, linkId, name);
            refreshAlbums();
        } catch (e) {
            console.error('album creation failed', e);
        }
    };

    const isPhotosEmpty = photos.length === 0;
    const isAlbumsEmpty = albums.length === 0;

    if (isPhotosLoading && isPhotosEmpty && isAlbumsEmpty) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <EmptyPhotos />;
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
            {/* TODO: Add it back <PhotosRecoveryBanner />*/}
            <UploadDragDrop
                disabled={isUploadDisabled || tabSelection === 'albums'}
                isForPhotos
                shareId={shareId}
                linkId={linkId}
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

                            {selectedCount === 0 && (
                                <ToolbarLeftActions
                                    onGalleryClick={() => {
                                        setTabSelection('gallery');
                                    }}
                                    onAlbumsClick={() => {
                                        setTabSelection('albums');
                                    }}
                                    isLoading={isPhotosLoading}
                                />
                            )}
                        </>
                    }
                    toolbar={
                        <PhotosWithAlbumsToolbar
                            shareId={shareId}
                            linkId={linkId}
                            selectedItems={selectedItems}
                            onPreview={handleToolbarPreview}
                            requestDownload={requestDownload}
                            uploadDisabled={isUploadDisabled}
                            tabSelection={tabSelection}
                            createAlbumModal={createAlbumModal}
                        />
                    }
                />

                {/**
                 * Gallery Tab
                 * TODO: Split into separate component
                 */}
                {tabSelection === 'gallery' && (
                    <>
                        {isPhotosEmpty ? (
                            <EmptyPhotos />
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
                    </>
                )}

                {/**
                 * Albums Tab
                 * TODO: Split into separate component
                 */}
                {tabSelection === 'albums' && (
                    <>
                        {isAlbumsEmpty ? (
                            <>
                                {/** TODO: Empty Albums View */}
                                <EmptyPhotos />
                            </>
                        ) : (
                            <AlbumsGrid
                                data={albums} // TODO: Get Albums
                                onItemRender={handleItemRender}
                                onItemRenderLoadedLink={handleItemRenderLoadedLink}
                                isLoading={false} // TODO: Get Albums loading status
                                onItemClick={setPreviewLinkId}
                            />
                        )}
                    </>
                )}
            </UploadDragDrop>
            <CreateAlbumModal createAlbumModal={createAlbumModal} createAlbum={onCreateAlbum} />
        </>
    );
};
