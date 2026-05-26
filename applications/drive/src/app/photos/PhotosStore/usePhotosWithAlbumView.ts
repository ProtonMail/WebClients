import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { getDriveForPhotos } from '@proton/drive/index';
import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { DownloadManager } from '../../modules/download/DownloadManager';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../layout.store';
import { loadCurrentAlbum } from '../loaders/loadAlbum';
import { loadAllAlbums } from '../loaders/loadAlbums';
import { loadTimelinePhotos } from '../loaders/loadPhotos';
import { useAlbumsStore } from '../useAlbums.store';
import { usePhotosStore } from '../usePhotos.store';

export const usePhotosWithAlbumsView = () => {
    const { albumShareId, albumLinkId } = useParams<{ albumShareId?: string; albumLinkId?: string }>();

    const {
        albumPhotoTimelineUids,
        isAlbumLoading,
        albumsUids,
        albums: albumsMap,
        isAlbumsLoading,
    } = useAlbumsStore(
        useShallow((state) => ({
            albumPhotoTimelineUids: state.getCurrentAlbum()?.photoNodeUids,
            isAlbumLoading: state.isLoading,
            albumsUids: state.albumsUids,
            albums: state.albums,
            isAlbumsLoading: state.isLoadingList,
        }))
    );
    const albumsOrder = albumsUids;

    const [selectedTags, setSelectedTags] = useState([-1]);
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );

    const { photoTimelineUids, isPhotosLoading } = usePhotosStore(
        useShallow((state) => ({ photoTimelineUids: state.photoTimelineUids, isPhotosLoading: state.isLoading }))
    );

    useEffect(() => {
        const abortController = new AbortController();

        if (!albumShareId && !albumLinkId && currentPageType && AlbumsPageTypes.ALBUMS === currentPageType) {
            void loadAllAlbums(abortController.signal);
        } else if (
            albumShareId &&
            albumLinkId &&
            (AlbumsPageTypes.ALBUMSGALLERY === currentPageType || AlbumsPageTypes.ALBUMSADDPHOTOS === currentPageType)
        ) {
            void getDriveForPhotos()
                .getNodeUid(albumShareId, albumLinkId)
                .then((currentAlbumNodeUid) => {
                    void loadCurrentAlbum(currentAlbumNodeUid, abortController.signal);
                });
            if (AlbumsPageTypes.ALBUMSADDPHOTOS === currentPageType) {
                void loadTimelinePhotos(abortController.signal);
            }
        } else if (AlbumsPageTypes.GALLERY === currentPageType) {
            void loadTimelinePhotos(abortController.signal);
        }

        return () => {
            abortController.abort();
        };
    }, [albumLinkId, albumShareId, currentPageType]);

    const requestDownload = useCallback(async (photosUids: string[]) => {
        await DownloadManager.getInstance().downloadPhotos(photosUids);
    }, []);

    const handleSelectTag = useCallback(async (tags: PhotoTag[]) => {
        setSelectedTags(tags);
    }, []);

    return {
        albumsUids,
        albumsOrder,
        albumsMap,
        albumPhotoTimelineUids,
        photoTimelineUids,
        requestDownload,
        isPhotosLoading,
        isAlbumsLoading,
        isAlbumLoading,
        selectedTags,
        handleSelectTag,
    };
};
