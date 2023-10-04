import React, { FC, useCallback, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { NavigationControl, useAppTitle } from '@proton/components';
import { Loader } from '@proton/components/components';

import { PhotoLink, useThumbnailsDownload } from '../../../store';
import { usePhotosView } from '../../../store/_views/usePhotosView';
import PortalPreview from '../../PortalPreview';
import { useDetailsModal } from '../../modals/DetailsModal';
import UploadDragDrop from '../../uploads/UploadDragDrop/UploadDragDrop';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import { PhotosEmptyView } from './PhotosEmptyView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosToolbar } from './toolbar';

export const PhotosView: FC<void> = () => {
    useAppTitle(c('Title').t`Photos`);

    const { shareId, linkId, photos, isLoading, isLoadingMore } = usePhotosView();

    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [previewIndex, setPreviewIndex] = useState<number>(-1);

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
    const gridPhotoLinkIndices: number[] = useMemo(
        () =>
            photos.reduce<number[]>((previousValue, currentValue, currentIndex) => {
                if (typeof currentValue !== 'string') {
                    previousValue.push(currentIndex);
                }
                return previousValue;
            }, []),
        [photos]
    );
    const rootRef = useRef<HTMLDivElement>(null);

    if (isLoading && !isLoadingMore) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <PhotosEmptyView />;
    }

    const selectedItem = photos[gridPhotoLinkIndices[previewIndex]] as PhotoLink;

    return (
        <>
            {detailsModal}
            {selectedItem && (
                <PortalPreview
                    ref={rootRef}
                    shareId={shareId}
                    linkId={selectedItem.linkId}
                    revisionId={selectedItem.activeRevision.id}
                    key="portal-preview-photos"
                    open={previewIndex !== -1}
                    date={selectedItem.activeRevision.photo?.captureTime}
                    onDetails={() =>
                        selectedItem.activeRevision?.photo?.linkId &&
                        showDetailsModal({
                            shareId,
                            linkId: selectedItem.activeRevision?.photo?.linkId,
                        })
                    }
                    navigationControls={
                        <NavigationControl
                            current={previewIndex + 1}
                            total={gridPhotoLinkIndices.length}
                            rootRef={rootRef}
                            onPrev={() => setPreviewIndex(previewIndex - 1)}
                            onNext={() => setPreviewIndex(previewIndex + 1)}
                        />
                    }
                    onClose={() => setPreviewIndex(-1)}
                    onExit={() => setPreviewIndex(-1)}
                />
            )}

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
                        onItemClick={setPreviewIndex}
                    />
                )}
            </UploadDragDrop>
        </>
    );
};
