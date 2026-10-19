import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { NodeType, ValidationError, getDriveForPhotos } from '@proton/drive/index';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { useLegacyContextShareHandler } from '../../legacy/hooks/drive/useLegacyContextShareHandler';
import useNavigate from '../../legacy/hooks/drive/useNavigate';
import { DownloadManager } from '../../modules/download/DownloadManager';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../layout.store';
import { loadCurrentAlbum } from '../loaders/loadAlbum';
import { loadAllAlbums } from '../loaders/loadAlbums';
import { loadTimelinePhotos } from '../loaders/loadPhotos';
import { useAlbumsStore } from '../useAlbums.store';
import { usePhotosStore } from '../usePhotos.store';

export const usePhotosWithAlbumsView = () => {
    const { albumShareId, albumLinkId } = useParams<{ albumShareId?: string; albumLinkId?: string }>();
    const { handleContextShare } = useLegacyContextShareHandler();
    const { navigateToNoAccess } = useNavigate();

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
                .then(async (currentAlbumNodeUid) => {
                    await loadCurrentAlbum(currentAlbumNodeUid, usePhotosStore.getState, abortController.signal);
                    if (!abortController.signal.aborted && !useAlbumsStore.getState().getCurrentAlbum()) {
                        navigateToNoAccess();
                    }
                })
                .catch((err: unknown) => {
                    if (abortController.signal.aborted) {
                        return;
                    }
                    if (err instanceof ValidationError && err.code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED) {
                        return handleContextShare(abortController.signal, {
                            shareId: albumShareId,
                            linkId: albumLinkId,
                            type: NodeType.Album,
                        });
                    }
                    navigateToNoAccess();
                })
                .catch(() => {
                    if (!abortController.signal.aborted) {
                        navigateToNoAccess();
                    }
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
    }, [albumLinkId, albumShareId, currentPageType, handleContextShare, navigateToNoAccess]);

    const requestDownload = useCallback(async (photosUids: string[]) => {
        await DownloadManager.getInstance().downloadPhotos(photosUids);
    }, []);

    const requestAlbumDownload = useCallback(async (albumUid: string, albumName: string) => {
        await DownloadManager.getInstance().downloadAlbum(albumUid, albumName);
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
        requestAlbumDownload,
        isPhotosLoading,
        isAlbumsLoading,
        isAlbumLoading,
        selectedTags,
        handleSelectTag,
    };
};
