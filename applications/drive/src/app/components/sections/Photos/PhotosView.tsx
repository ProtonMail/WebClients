import React, { FC, useCallback } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';
import { Loader } from '@proton/components/components';

import { PhotoLink, useThumbnailsDownload } from '../../../store';
import { usePhotosView } from '../../../store/_views/usePhotosView';
import { usePortalPreview } from '../../PortalPreview';
import { useDetailsModal } from '../../modals/DetailsModal';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import { PhotosEmptyView } from './PhotosEmptyView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosToolbar } from './toolbar';

export const PhotosView: FC<void> = () => {
    useAppTitle(c('Title').t`Photos`);

    const { shareId, linkId, photos, isLoading, isLoadingMore } = usePhotosView();

    const [portalPreview, showPortalPreview] = usePortalPreview();
    const [detailsModal, showDetailsModal] = useDetailsModal();

    const isEmpty = photos.length === 0;
    const thumbnails = useThumbnailsDownload();

    const handleItemRender = useCallback(
        (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
            if (shareId) {
                thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
            }
        },
        [shareId]
    );

    const handleItemClick = useCallback(
        (photo: PhotoLink) =>
            shareId &&
            photo.activeRevision?.id &&
            photo.activeRevision?.photo &&
            showPortalPreview({
                shareId,
                linkId: photo.activeRevision.photo.linkId,
                revisionId: photo.activeRevision.id,
                date: photo.activeRevision.photo.captureTime,
                onDetails: () =>
                    showDetailsModal({
                        shareId,
                        linkId: photo.activeRevision.photo.linkId,
                    }),
            }),
        [showPortalPreview, showDetailsModal]
    );

    if (isLoading && !isLoadingMore) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <PhotosEmptyView />;
    }

    return (
        <>
            {portalPreview}
            {detailsModal}

            <UploadDragDrop
                isForPhotos
                shareId={shareId}
                linkId={linkId}
                className="flex flex-column flex-nowrap flex-item-fluid"
            >
                <ToolbarRow
                    titleArea={<span className="text-strong pl-1">{c('Title').t`Photos`}</span>}
                    toolbar={<PhotosToolbar shareId={shareId} linkId={linkId} />}
                />

                {isEmpty ? (
                    <PhotosEmptyView />
                ) : (
                    <PhotosGrid
                        data={photos}
                        onItemRender={handleItemRender}
                        isLoadingMore={isLoadingMore}
                        onItemClick={handleItemClick}
                    />
                )}
            </UploadDragDrop>
        </>
    );
};
