import React, { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle } from '@proton/components';
import { getDriveForPhotos } from '@proton/drive';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import { useFlag } from '@proton/unleash/useFlag';

import { useShiftKey } from '../../hooks/util/useShiftKey';
import { useUserSettings } from '../../store';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { toggleFavorite } from '../PhotosActions/Albums';
import { EmptyPhotos } from './EmptyPhotos';
import { EmptyTagView } from './EmptyTagView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosTags } from './components/Tags';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import type { PhotosLayoutOutletContext } from './layout/PhotosLayout';
import { enqueueAdditionalInfo } from './loaders/loadAdditionalInfo';

export const PhotosWithAlbumsView = () => {
    useAppTitle(c('Title').t`Photos`);
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');

    const {
        albumPhotos,

        volumeId,
        shareId,
        linkId,
        photos,
        isPhotosLoading,

        selectedTags,
        handleSelectTag,
        isPhotosEmpty,
        albumPhotosNodeUidToIndexMap,
        photoNodeUidToIndexMap,
    } = useOutletContext<PhotosLayoutOutletContext>();

    const { photoTags } = useUserSettings();
    const isShiftPressed = useShiftKey();
    const { setPreviewNodeUid, currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
            setPreviewNodeUid: state.setPreviewNodeUid,
        }))
    );
    const { selectedItems, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection({
        photos,
        albumPhotos,
        albumPhotosNodeUidToIndexMap,
        photoNodeUidToIndexMap,
    });

    const handleItemRender = useCallback((nodeUid: string, domRef: React.MutableRefObject<unknown>) => {
        enqueueAdditionalInfo(nodeUid, () => Boolean(domRef.current));
    }, []);

    const handleItemRenderLoadedLink = useCallback(
        (nodeUid: string, activeRevisionUid: string, domRef: React.MutableRefObject<unknown>) => {
            loadThumbnail(getDriveForPhotos(), {
                nodeUid: nodeUid,
                revisionUid: activeRevisionUid,
                shouldLoad: () => Boolean(domRef.current),
                thumbnailTypes: ['sd', 'hd'],
            });
        },
        []
    );

    // We want to show the view in case they are more page to load, we can start to show what we already have
    if (!volumeId || !shareId || !linkId || (isPhotosLoading && photos.length === 0)) {
        return <Loader />;
    }
    const isSelectedTagEmtpy = !isPhotosEmpty && photos.length === 0;

    const isAddAlbumPhotosView = currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS;

    return (
        <>
            {!isPhotosEmpty && !isAddAlbumPhotosView && (
                <div className="mb-2">
                    <PhotosTags
                        selectedTags={selectedTags}
                        tags={[PhotoTag.All, ...photoTags]}
                        onTagSelect={(newTags) => handleSelectTag(new AbortController().signal, newTags)}
                    />
                </div>
            )}

            {isPhotosEmpty && <EmptyPhotos volumeId={volumeId} shareId={shareId} linkId={linkId} />}
            {isSelectedTagEmtpy && <EmptyTagView tag={selectedTags[0]} />}
            {!isPhotosEmpty && !isSelectedTagEmtpy && (
                <PhotosGrid
                    data={photos}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={isPhotosLoading}
                    onItemClick={setPreviewNodeUid}
                    onSelectChange={(i, isSelected) =>
                        handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                    }
                    isGroupSelected={isGroupSelected}
                    isItemSelected={isItemSelected}
                    onFavorite={!driveAlbumsDisabled ? toggleFavorite : undefined}
                    isAddAlbumPhotosView={isAddAlbumPhotosView}
                    rootLinkId={linkId}
                    hasSelection={selectedItems.length > 0 || currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS}
                />
            )}
        </>
    );
};
