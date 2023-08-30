import { FC, useCallback } from 'react';

import { c } from 'ttag';

import { Loader } from '@proton/components/components';

import { usePhotos as usePhotosProvider, useThumbnailsDownload } from '../../../store';
import { PhotoLink, usePhotosView } from '../../../store/_views/usePhotosView';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import { PhotosEmptyView } from './PhotosEmptyView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosToolbar } from './toolbar';

export const PhotosView: FC<void> = () => {
    const { photos, getPhotoLink, isLoading } = usePhotosView();
    const { shareId, linkId } = usePhotosProvider();
    const isEmpty = photos.length === 0;
    const thumbnails = useThumbnailsDownload();

    const handleItemRender = useCallback(
        (item: PhotoLink) => {
            if (shareId) {
                thumbnails.addToDownloadQueue(shareId, item.linkId);
            }
        },
        [shareId]
    );

    if (isLoading) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <PhotosEmptyView />;
    }

    return (
        <UploadDragDrop
            isPhoto
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
                    getPhotoLink={getPhotoLink}
                    onItemRender={handleItemRender}
                    shareId={shareId}
                />
            )}
        </UploadDragDrop>
    );
};
