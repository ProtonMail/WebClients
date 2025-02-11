import type { FC } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Loader, NavigationControl, useAppTitle, useModalStateObject } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import PortalPreview from '../../components/PortalPreview';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import type { PhotoLink } from '../../store';
import { PhotoTags, isDecryptedLink, useThumbnailsDownload } from '../../store';
import { useCreateAlbum } from '../PhotosActions/Albums';
import { CreateAlbumModal } from '../PhotosModals/CreateAlbumModal';
import { usePhotosWithAlbumsView } from '../PhotosStore/usePhotosWithAlbumView';
import { AlbumsGrid } from './AlbumsGrid';
import { EmptyPhotos } from './EmptyPhotos';
import { PhotosClearSelectionButton } from './components/PhotosClearSelectionButton';
import PhotosRecoveryBanner from './components/PhotosRecoveryBanner/PhotosRecoveryBanner';
import { PhotosTags, type PhotosTagsProps } from './components/PhotosTags';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import { PhotosWithAlbumsToolbar, ToolbarLeftActionsGallery } from './toolbar/PhotosWithAlbumsToolbar';

export const AlbumsView: FC = () => {
    useAppTitle(c('Title').t`Albums`);
    const {
        volumeId,
        shareId,
        linkId,
        photos,
        albums,
        isPhotosLoading,
        loadPhotoLink,
        photoLinkIdToIndexMap,
        photoLinkIds,
        requestDownload,
    } = usePhotosWithAlbumsView();

    const { selectedItems, clearSelection } = usePhotosSelection(photos, photoLinkIdToIndexMap);
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const createAlbumModal = useModalStateObject();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const createAlbum = useCreateAlbum();
    const [previewLinkId, setPreviewLinkId] = useState<string | undefined>();
    const thumbnails = useThumbnailsDownload();
    const { navigateToPhotos, navigateToAlbum, navigateToAlbums } = useNavigate();
    // TODO: Move tag selection to specific hook
    const [selectedTag, setSelectedTag] = useState<PhotosTagsProps['selectedTag']>([]);

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

    const onCreateAlbum = useCallback(
        async (name: string) => {
            if (!shareId || !linkId || !volumeId) {
                return;
            }
            try {
                const abortSignal = new AbortController().signal;
                const albumLinkId = await createAlbum(abortSignal, volumeId, shareId, linkId, name);
                navigateToAlbum(albumLinkId);
            } catch (e) {
                console.error('album creation failed', e);
            }
        },
        [shareId, linkId, createAlbum, navigateToAlbum]
    );

    const isAlbumsEmpty = albums.length === 0;

    if (!shareId || !linkId || isPhotosLoading) {
        return <Loader />;
    }

    const hasPreview = !!previewItem;

    return (
        <>
            {detailsModal}
            {linkSharingModal}
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
                            <ToolbarLeftActionsGallery
                                onGalleryClick={() => {
                                    navigateToPhotos();
                                }}
                                onAlbumsClick={() => {
                                    navigateToAlbums();
                                }}
                                isLoading={isPhotosLoading}
                                selection={'albums'}
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
                        uploadDisabled={true}
                        tabSelection={'albums'}
                        createAlbumModal={createAlbumModal}
                    />
                }
            />

            <PhotosTags
                selectedTag={selectedTag}
                tags={[
                    PhotoTags.Favorites,
                    PhotoTags.Screenshots,
                    PhotoTags.Videos,
                    PhotoTags.LivePhotos,
                    PhotoTags.MotionPhotos,
                    PhotoTags.Selfies,
                    PhotoTags.Portraits,
                    PhotoTags.Bursts,
                    PhotoTags.Panoramas,
                    PhotoTags.Raw,
                ]}
                onTagSelect={setSelectedTag}
            />

            {isAlbumsEmpty ? (
                <>
                    {/** TODO: Empty Albums View */}
                    <EmptyPhotos shareId={shareId} linkId={linkId} />
                </>
            ) : (
                <AlbumsGrid
                    data={albums}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={false} // TODO: Get Albums loading status
                    onItemClick={(linkId) => {
                        navigateToAlbum(linkId);
                    }}
                />
            )}

            <CreateAlbumModal createAlbumModal={createAlbumModal} createAlbum={onCreateAlbum} />
        </>
    );
};
