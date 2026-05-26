import React, { useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle } from '@proton/components';
import { getDriveForPhotos } from '@proton/drive';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { useShiftKey } from '../../legacy/hooks/util/useShiftKey';
import { useUserSettings } from '../../modules/userSettings';
import { toggleFavorite } from '../PhotosActions/Albums';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../layout.store';
import { usePhotosStore } from '../usePhotos.store';
import { EmptyPhotos } from './EmptyPhotos';
import { EmptyTagView } from './EmptyTagView';
import { PhotosGrid } from './PhotosGrid';
import { PhotosTags } from './components/Tags';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import type { PhotosLayoutOutletContext } from './layout/PhotosLayout';
import { enqueueAdditionalInfo } from './loaders/loadAdditionalInfo';

export const PhotosWithAlbumsView = () => {
    useAppTitle(c('Title').t`Photos`);

    const { isPhotosLoading, selectedTags, handleSelectTag, photoTimelineUids, albumPhotoTimelineUids } =
        useOutletContext<PhotosLayoutOutletContext>();

    const { photoTags } = useUserSettings();
    const isShiftPressed = useShiftKey();
    const { setPreviewNodeUid, currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
            setPreviewNodeUid: state.setPreviewNodeUid,
        }))
    );

    const photoItems = usePhotosStore((state) => state.photoItems);

    const activeUids = useMemo(() => {
        const uids = Array.from(
            currentPageType === AlbumsPageTypes.ALBUMSGALLERY
                ? (albumPhotoTimelineUids ?? new Set<string>())
                : photoTimelineUids
        );
        if (selectedTags.includes(PhotoTag.All)) {
            return uids;
        }
        return uids.filter((uid) => {
            const tags = photoItems.get(uid)?.tags ?? [];
            return selectedTags.some((tag) => tags.includes(tag));
        });
    }, [currentPageType, albumPhotoTimelineUids, photoTimelineUids, selectedTags, photoItems]);

    const { selectedItems, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection({
        photoTimelineUids,
        albumPhotoTimelineUids,
        selectedTags,
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

    // TODO: ALBUMSADDPHOTOS and ALBUMS page types may need their own empty-state logic
    const isPhotosEmpty =
        currentPageType === AlbumsPageTypes.ALBUMSGALLERY
            ? (albumPhotoTimelineUids?.size ?? 0) === 0
            : photoTimelineUids.size === 0;

    // We want to show the view in case they are more page to load, we can start to show what we already have
    if (isPhotosLoading && activeUids.length === 0) {
        return <Loader />;
    }
    const isSelectedTagEmtpy = !isPhotosEmpty && activeUids.length === 0;

    const isAddAlbumPhotosView = currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS;

    return (
        <>
            {!isPhotosEmpty && !isAddAlbumPhotosView && (
                <div className="mb-2">
                    <PhotosTags
                        selectedTags={selectedTags}
                        tags={[PhotoTag.All, ...photoTags]}
                        onTagSelect={handleSelectTag}
                    />
                </div>
            )}

            {isPhotosEmpty && <EmptyPhotos />}
            {isSelectedTagEmtpy && <EmptyTagView tag={selectedTags[0]} />}
            {!isPhotosEmpty && !isSelectedTagEmtpy && (
                <PhotosGrid
                    uids={activeUids}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={isPhotosLoading}
                    onItemClick={setPreviewNodeUid}
                    onSelectChange={(i, isSelected) =>
                        handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                    }
                    isGroupSelected={isGroupSelected}
                    isItemSelected={isItemSelected}
                    onFavorite={toggleFavorite}
                    isAddAlbumPhotosView={isAddAlbumPhotosView}
                    // TODO: rootLinkId is used to determine isOwnedByCurrentUser in PhotosCard — migrate to nodeUid-based check
                    rootLinkId=""
                    hasSelection={selectedItems.length > 0 || currentPageType === AlbumsPageTypes.ALBUMSADDPHOTOS}
                />
            )}
        </>
    );
};
