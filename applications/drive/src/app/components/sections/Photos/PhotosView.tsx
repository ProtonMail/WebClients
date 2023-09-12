import { FC, useCallback } from 'react';

import { c } from 'ttag';

import { Loader } from '@proton/components/components';

import { useThumbnailsDownload } from '../../../store';
import { usePhotosView } from '../../../store/_views/usePhotosView';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import { PhotosEmptyView } from './PhotosEmptyView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosToolbar } from './toolbar';

export const PhotosView: FC<void> = () => {
    const { shareId, linkId, photos, isLoading, isLoadingMore } = usePhotosView();
    const isEmpty = photos.length === 0;
    const thumbnails = useThumbnailsDownload();

    const handleItemRender = useCallback(
        (itemLinkId: string) => {
            if (shareId) {
                thumbnails.addToDownloadQueue(shareId, itemLinkId);
            }
        },
        [shareId]
    );

    if (isLoading && !isLoadingMore) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <PhotosEmptyView />;
    }

    return (
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
                    shareId={shareId}
                    isLoadingMore={isLoadingMore}
                />
            )}
        </UploadDragDrop>
    );
};
