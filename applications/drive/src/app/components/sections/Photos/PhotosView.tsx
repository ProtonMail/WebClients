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
import { usePhotosSelection } from './hooks';
import { PhotosToolbar } from './toolbar';
import { PhotosClearSelectionButton } from './toolbar/PhotosClearSelectionButton';

export const PhotosView: FC<void> = () => {
    useAppTitle(c('Title').t`Photos`);

    const { shareId, linkId, photos, isLoading, isLoadingMore, loadPhotoLink, removePhotosFromCache } = usePhotosView();
    const { selection, setSelected, clearSelection } = usePhotosSelection();

    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [previewIndex, setPreviewIndex] = useState<number>(-1);

    const isEmpty = photos.length === 0;
    const thumbnails = useThumbnailsDownload();

    const handleItemRender = async (itemLinkId: string) => {
        await loadPhotoLink(new AbortController().signal, itemLinkId);
    };

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
        if (shareId) {
            thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
        }
    };

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

    const handleItemClick = useCallback(
        (index: number) => {
            setPreviewIndex(gridPhotoLinkIndices.findIndex((item) => item === index));
        },
        [gridPhotoLinkIndices]
    );

    const handleSelection = useCallback(
        (index: number, isSelected: boolean) => {
            if (typeof photos[index] === 'string') {
                const indices = [];

                for (let i = index + 1; i < photos.length; i++) {
                    if (typeof photos[i] === 'string') {
                        break;
                    }

                    indices.push(i);
                }

                setSelected(indices, isSelected);
            } else {
                setSelected([index], isSelected);
            }
        },
        [setSelected, photos]
    );

    const selectedItems = useMemo(
        () =>
            selection.reduce<PhotoLink[]>((acc, selected, index) => {
                const item = photos[index];
                if (selected && typeof item !== 'string') {
                    acc.push(item);
                }
                return acc;
            }, []),
        [photos, selection]
    );
    const selectedCount = selectedItems.length;

    const handleToolbarPreview = useCallback(() => {
        const index = selection.findIndex((isSelected) => isSelected === true);

        if (index) {
            handleItemClick(index);
        }
    }, [selectedItems]);

    const handleTrashed = useCallback(
        (linkIds: string[]) => {
            removePhotosFromCache(linkIds);
            setSelected(
                linkIds.map((linkId) =>
                    photos.findIndex((item) => {
                        return typeof item !== 'string' && item.linkId === linkId;
                    })
                ),
                false
            );
        },
        [removePhotosFromCache, setSelected, photos]
    );

    const previewRef = useRef<HTMLDivElement>(null);

    if (isLoading && !isLoadingMore) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <PhotosEmptyView />;
    }

    const previewItem = photos[gridPhotoLinkIndices[previewIndex]] as PhotoLink;

    return (
        <>
            {detailsModal}
            {previewItem && (
                <PortalPreview
                    ref={previewRef}
                    shareId={shareId}
                    linkId={previewItem.linkId}
                    revisionId={previewItem.activeRevision.id}
                    key="portal-preview-photos"
                    open={previewIndex !== -1}
                    date={previewItem.activeRevision.photo.captureTime}
                    onDetails={() =>
                        showDetailsModal({
                            shareId,
                            linkId: previewItem.activeRevision.photo.linkId,
                        })
                    }
                    navigationControls={
                        <NavigationControl
                            current={previewIndex + 1}
                            total={gridPhotoLinkIndices.length}
                            rootRef={previewRef}
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
                    titleArea={
                        <span className="text-strong pl-1">
                            {selectedCount > 0 ? (
                                <div className="flex gap-2">
                                    <PhotosClearSelectionButton onClick={clearSelection} />
                                    {c('Info').jt`${selectedCount} selected`}
                                </div>
                            ) : (
                                c('Title').t`Photos`
                            )}
                        </span>
                    }
                    toolbar={
                        <PhotosToolbar
                            shareId={shareId}
                            linkId={linkId}
                            selectedItems={selectedItems}
                            onPreview={handleToolbarPreview}
                            onTrash={handleTrashed}
                        />
                    }
                />

                {isEmpty ? (
                    <PhotosEmptyView />
                ) : (
                    <PhotosGrid
                        data={photos}
                        onItemRender={handleItemRender}
                        onItemRenderLoadedLink={handleItemRenderLoadedLink}
                        isLoadingMore={isLoadingMore}
                        onItemClick={handleItemClick}
                        selection={selection}
                        hasSelection={selectedCount > 0}
                        onSelectChange={handleSelection}
                    />
                )}
            </UploadDragDrop>
        </>
    );
};
