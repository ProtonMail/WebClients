import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useConfig } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import useFlag from '@proton/unleash/useFlag';

import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import { useThumbnailsDownload } from '../../store';
import { usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { useFavoritePhotoToggle } from '../PhotosActions/Albums';
import { PhotosInsideAlbumsGrid } from './PhotosInsideAlbumsGrid';
import { AlbumCoverHeader } from './components/AlbumCoverHeader';
import { AlbumEmptyView } from './components/AlbumEmptyView';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import type { PhotosLayoutOutletContext } from './layout/PhotosLayout';

const useAppTitleUpdate = () => {
    const { APP_NAME } = useConfig();

    const formatTitle = useCallback(
        (title?: string, maybeAppName?: string) => {
            const appName = maybeAppName || getAppName(APP_NAME);
            return [title, appName].filter(Boolean).join(' - ');
        },
        [APP_NAME]
    );

    return useCallback(
        (title?: string, maybeAppName?: string) => {
            const titleUpdate = formatTitle(title, maybeAppName);
            if (titleUpdate === undefined) {
                return;
            }
            document.title = titleUpdate;
        },
        [formatTitle]
    );
};

export const PhotosWithAlbumsInsideAlbumView: FC = () => {
    useAppTitle(c('Title').t`Album`);
    const driveAlbumsDisabled = useFlag('DriveAlbumsDisabled');
    const updateTitle = useAppTitleUpdate();
    const [searchParams, setSearchParams] = useSearchParams();
    const favoritePhotoToggle = useFavoritePhotoToggle();
    const { albumLinkId, albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const { setPreviewLinkId, modals } = usePhotoLayoutStore(
        useShallow((state) => ({
            setPreviewLinkId: state.setPreviewLinkId,
            modals: state.modals,
        }))
    );

    const {
        linkId,
        albums,
        loadPhotoLink,

        albumPhotos,

        isAlbumsLoading,
        isAlbumPhotosLoading,

        albumPhotosLinkIdToIndexMap,
        photoLinkIdToIndexMap,
        photos,
    } = useOutletContext<PhotosLayoutOutletContext>();

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(LayoutSetting.Grid, isAlbumsLoading);
    const { selectedItems, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection({
        photos,
        albumPhotos,
        albumPhotosLinkIdToIndexMap,
        photoLinkIdToIndexMap,
    });
    const isShiftPressed = useShiftKey();

    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const thumbnails = useThumbnailsDownload();
    const { navigateToAlbum } = useNavigate();

    const handleItemRender = useCallback(
        (itemLinkId: string, domRef?: React.MutableRefObject<unknown>) => {
            if (!albumShareId) {
                return;
            }
            incrementItemRenderedCounter();
            loadPhotoLink(albumShareId, itemLinkId, domRef);
        },
        [incrementItemRenderedCounter, loadPhotoLink, albumShareId]
    );

    const handleItemRenderLoadedLink = (itemLinkId: string, domRef?: React.MutableRefObject<unknown>) => {
        if (albumShareId) {
            thumbnails.addToDownloadQueue(albumShareId, itemLinkId, undefined, domRef);
        }
    };

    const album = useMemo(() => {
        if (!albumLinkId) {
            return undefined;
        }
        return albums.find((album) => album.linkId === albumLinkId);
    }, [albums, albumLinkId]);

    const addOrRemovePhotoToFavorite = useCallback(
        async (linkId: string, shareId: string, isFavorite: boolean) => {
            void favoritePhotoToggle(linkId, shareId, isFavorite);
        },
        [favoritePhotoToggle]
    );

    const isAlbumPhotosEmpty = album?.photoCount === 0;
    const albumName = album?.name;

    useEffect(() => {
        if (albumName) {
            updateTitle(`Album > ${albumName}`);
        }
    }, [albumName, updateTitle]);

    useEffect(() => {
        if (album && albumShareId) {
            if (searchParams.has('openShare')) {
                modals.linkSharing?.({ nodeUid: generateNodeUid(album.volumeId, album.linkId) });
                searchParams.delete('openShare');
                setSearchParams(searchParams);
            }
        }
    }, [albumShareId, album, searchParams, setSearchParams, modals]);

    const uploadLinkId = useMemo(() => {
        // If you own the root photo share, your uploads always goes to the root (photo stream) and then we add the photos to the album
        // If you don't own it (shared album), you upload directly in the album as a folder, it won't appear in photo stream
        return album?.permissions.isOwner ? linkId : albumLinkId || linkId;
    }, [album?.permissions.isOwner, linkId, albumLinkId]);

    useEffect(() => {
        if (isAlbumsLoading === false && isAlbumPhotosLoading === false) {
            setIsInitialized(true);
        }
    }, [isAlbumsLoading, isAlbumPhotosLoading]);

    if (!albumShareId || !linkId || !album || !uploadLinkId || !isInitialized || !albumLinkId) {
        return <Loader />;
    }
    const photoCount = album.photoCount;

    // TODO: Album not found view [DRVWEB-4615]
    return (
        <>
            {isAlbumPhotosEmpty ? (
                <div className="flex flex-column flex-nowrap p-4 w-full h-full">
                    <AlbumEmptyView
                        album={album}
                        onAddAlbumPhotos={() => {
                            navigateToAlbum(albumShareId, albumLinkId, { addPhotos: true });
                        }}
                    />
                </div>
            ) : (
                <PhotosInsideAlbumsGrid
                    data={albumPhotos}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={isAlbumsLoading}
                    onItemClick={setPreviewLinkId}
                    selectedItems={selectedItems}
                    onSelectChange={(i, isSelected) =>
                        handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                    }
                    isGroupSelected={isGroupSelected}
                    isItemSelected={isItemSelected}
                    onFavorite={!driveAlbumsDisabled ? addOrRemovePhotoToFavorite : undefined}
                    rootLinkId={linkId}
                >
                    <AlbumCoverHeader
                        shareId={albumShareId}
                        linkId={album.linkId}
                        album={album}
                        photoCount={photoCount}
                        onShare={() => {
                            modals.linkSharing?.({
                                nodeUid: generateNodeUid(album.volumeId, album.linkId),
                            });
                        }}
                        onAddAlbumPhotos={() => {
                            navigateToAlbum(albumShareId, albumLinkId, { addPhotos: true });
                        }}
                    />
                </PhotosInsideAlbumsGrid>
            )}
        </>
    );
};
