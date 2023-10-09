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

    const { shareId, linkId, photos, isLoading, isLoadingMore, loadPhotoLink } = usePhotosView();
    const { selection, setSelected, clearSelection } = usePhotosSelection();

    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [previewLinkId, setPreviewLinkId] = useState<string | undefined>();

    const thumbnails = useThumbnailsDownload();

    const handleItemRender = async (itemLinkId: string) => {
        await loadPhotoLink(new AbortController().signal, itemLinkId);
    };

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
        if (shareId) {
            thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
        }
    };

    const { gridLinkToIndexMap, photoLinkIds } = useMemo(() => {
        let gridLinkToIndexMap: Record<string, number> = {};
        let photoLinkIds: string[] = [];

        photos.forEach((item, index) => {
            if (typeof item !== 'string') {
                gridLinkToIndexMap[item.linkId] = index;
                photoLinkIds.push(item.linkId);
            }
        });

        return { gridLinkToIndexMap, photoLinkIds };
    }, [photos]);
    const photoCount = photoLinkIds.length;

    const selectedItems = useMemo<PhotoLink[]>(
        () =>
            Object.keys(selection).reduce<PhotoLink[]>((acc, linkId) => {
                const item = photos[gridLinkToIndexMap[linkId]];
                if (item && typeof item !== 'string') {
                    acc.push(item);
                }

                return acc;
            }, []),
        [selection, photos, gridLinkToIndexMap]
    );
    const selectedCount = selectedItems.length;

    const handleSelection = useCallback(
        (index: number, isSelected: boolean) => {
            const item = photos[index];

            if (typeof item === 'string') {
                const items = [];

                for (let i = index + 1; i < photos.length; i++) {
                    const current = photos[i];

                    if (typeof current === 'string') {
                        break;
                    }

                    items.push(current.linkId);
                }

                setSelected(items, isSelected);
            } else {
                setSelected([item.linkId], isSelected);
            }
        },
        [setSelected, photos]
    );

    const handleToolbarPreview = useCallback(() => {
        let selected = Object.keys(selection)[0];

        if (selected) {
            setPreviewLinkId(selected);
        }
    }, [selection, setPreviewLinkId]);

    const previewRef = useRef<HTMLDivElement>(null);
    const previewIndex = useMemo(
        () => photoLinkIds.findIndex((item) => item === previewLinkId),
        [photoLinkIds, previewLinkId]
    );
    const previewItem = useMemo(
        () => (previewLinkId !== undefined ? (photos[gridLinkToIndexMap[previewLinkId]] as PhotoLink) : undefined),
        [photos, previewLinkId, gridLinkToIndexMap]
    );
    const setPreviewIndex = useCallback(
        (index: number) => setPreviewLinkId(photoLinkIds[index]),
        [setPreviewLinkId, photoLinkIds]
    );

    if (isLoading && !isLoadingMore) {
        return <Loader />;
    }

    if (!shareId || !linkId) {
        return <PhotosEmptyView />;
    }

    const isEmpty = photos.length === 0;

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
                    open={!!previewItem}
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
                        onItemClick={setPreviewLinkId}
                        selection={selection}
                        hasSelection={selectedCount > 0}
                        onSelectChange={handleSelection}
                    />
                )}
            </UploadDragDrop>
        </>
    );
};
