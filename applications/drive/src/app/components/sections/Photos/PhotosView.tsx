import type { FC } from 'react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Loader, NavigationControl, TopBanner, useAppTitle } from '@proton/components';
import { useFlag } from '@proton/unleash';

import { useShiftKey } from '../../../hooks/util/useShiftKey';
import type { PhotoLink } from '../../../store';
import { isDecryptedLink, usePhotosView, useThumbnailsDownload } from '../../../store';
import PortalPreview from '../../PortalPreview';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import { EmptyPhotos } from './EmptyPhotos';
import { PhotosGrid } from './PhotosGrid';
import { PhotosClearSelectionButton } from './components/PhotosClearSelectionButton';
import PhotosRecoveryBanner from './components/PhotosRecoveryBanner/PhotosRecoveryBanner';
import { usePhotosSelection } from './hooks';
import { PhotosToolbar } from './toolbar';

export const PhotosView: FC<void> = () => {
    useAppTitle(c('Title').t`Photos`);

    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const { shareId, linkId, photos, isLoading, loadPhotoLink, photoLinkIdToIndexMap, photoLinkIds, requestDownload } =
        usePhotosView();
    const { selectedItems, clearSelection, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection(
        photos,
        photoLinkIdToIndexMap
    );

    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const [previewLinkId, setPreviewLinkId] = useState<string | undefined>();
    const isShiftPressed = useShiftKey();
    const thumbnails = useThumbnailsDownload();

    const handleItemRender = (itemLinkId: string, domRef: React.MutableRefObject<unknown>) =>
        loadPhotoLink(itemLinkId, domRef);

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

    const isEmpty = photos.length === 0;

    if (isLoading && isEmpty) {
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
            <PhotosRecoveryBanner />
            <UploadDragDrop
                disabled={isUploadDisabled}
                isForPhotos
                shareId={shareId}
                linkId={linkId}
                className="flex flex-column flex-nowrap flex-1"
            >
                <ToolbarRow
                    titleArea={
                        <span className="flex items-center text-strong pl-1">
                            {selectedCount > 0 ? (
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
                            ) : (
                                c('Title').t`Photos`
                            )}
                            {isLoading && <Loader className="ml-2 flex items-center" />}
                        </span>
                    }
                    toolbar={
                        <PhotosToolbar
                            shareId={shareId}
                            linkId={linkId}
                            selectedItems={selectedItems}
                            onPreview={handleToolbarPreview}
                            requestDownload={requestDownload}
                            uploadDisabled={isUploadDisabled}
                        />
                    }
                />

                {isEmpty ? (
                    <EmptyPhotos />
                ) : (
                    <PhotosGrid
                        data={photos}
                        onItemRender={handleItemRender}
                        onItemRenderLoadedLink={handleItemRenderLoadedLink}
                        isLoading={isLoading}
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
