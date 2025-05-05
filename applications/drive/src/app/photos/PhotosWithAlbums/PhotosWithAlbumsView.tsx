import React, { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle } from '@proton/components';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import useFlag from '@proton/unleash/useFlag';

import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import { useThumbnailsDownload, useUserSettings } from '../../store';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { useFavoritePhotoToggle } from '../PhotosActions/Albums';
import { EmptyPhotos } from './EmptyPhotos';
import { EmptyTagView } from './EmptyTagView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosTags } from './components/Tags';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import type { PhotosLayoutOutletContext } from './layout/PhotosLayout';

export const PhotosWithAlbumsView = () => {
    useAppTitle(c('Title').t`Photos`);
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');

    const {
        albumPhotos,

        shareId,
        linkId,
        photos,
        isPhotosLoading,
        loadPhotoLink,

        selectedTags,
        handleSelectTag,
        isPhotosEmpty,
        albumPhotosLinkIdToIndexMap,
        photoLinkIdToIndexMap,
    } = useOutletContext<PhotosLayoutOutletContext>();

    const favoritePhotoToggle = useFavoritePhotoToggle();
    const { photoTags } = useUserSettings();
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isPhotosLoading);
    const isShiftPressed = useShiftKey();
    const { setPreviewLinkId, currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
            setPreviewLinkId: state.setPreviewLinkId,
        }))
    );
    const { selectedItems, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection({
        photos,
        albumPhotos,
        albumPhotosLinkIdToIndexMap,
        photoLinkIdToIndexMap,
    });

    const thumbnails = useThumbnailsDownload();
    const handleItemRender = useCallback(
        (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
            if (!shareId) {
                return;
            }
            incrementItemRenderedCounter();
            loadPhotoLink(shareId, itemLinkId, domRef);
        },
        [shareId, incrementItemRenderedCounter, loadPhotoLink]
    );

    const handleItemRenderLoadedLink = useCallback(
        (itemLinkId: string, domRef: React.MutableRefObject<unknown>) => {
            if (shareId) {
                thumbnails.addToDownloadQueue(shareId, itemLinkId, undefined, domRef);
            }
        },
        [shareId, thumbnails]
    );

    const addOrRemovePhotoToFavorite = useCallback(
        async (linkId: string, shareId: string, isFavorite: boolean) => {
            void favoritePhotoToggle(linkId, shareId, isFavorite);
        },
        [favoritePhotoToggle]
    );

    // We want to show the view in case they are more page to load, we can start to show what we already have
    if (!shareId || !linkId || (isPhotosLoading && photos.length === 0)) {
        return <Loader />;
    }
    const isSelectedTagEmtpy = !isPhotosEmpty && photos.length === 0;

    const isAddAlbumPhotosView = currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS;

    return (
        <>
            {!isPhotosEmpty && !isAddAlbumPhotosView && (
                <PhotosTags
                    selectedTags={selectedTags}
                    tags={[PhotoTag.All, ...photoTags]}
                    onTagSelect={(newTags) => handleSelectTag(new AbortController().signal, newTags)}
                />
            )}

            {isPhotosEmpty && <EmptyPhotos shareId={shareId} linkId={linkId} />}
            {isSelectedTagEmtpy && <EmptyTagView tag={selectedTags[0]} />}
            {!isPhotosEmpty && !isSelectedTagEmtpy && (
                <PhotosGrid
                    data={photos}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={isPhotosLoading}
                    onItemClick={setPreviewLinkId}
                    selectedItems={selectedItems}
                    onSelectChange={(i, isSelected) =>
                        handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                    }
                    isGroupSelected={isGroupSelected}
                    isItemSelected={isItemSelected}
                    onFavorite={!driveAlbumsDisabled ? addOrRemovePhotoToFavorite : undefined}
                    isAddAlbumPhotosView={isAddAlbumPhotosView}
                    rootLinkId={linkId}
                    hasSelection={selectedItems.length > 0 || currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS}
                />
            )}
        </>
    );
};
