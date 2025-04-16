import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useConfig, useNotifications } from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import useFlag from '@proton/unleash/useFlag';

import UploadDragDrop from '../../components/uploads/UploadDragDrop/UploadDragDrop';
import useNavigate from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import type { OnFileUploadSuccessCallbackData } from '../../store';
import { useThumbnailsDownload } from '../../store';
import { sendErrorReport } from '../../utils/errorHandling';
import { usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { useFavoritePhotoToggle } from '../PhotosActions/Albums';
import { PhotosInsideAlbumsGrid } from './PhotosInsideAlbumsGrid';
import { AlbumCoverHeader } from './components/AlbumCoverHeader';
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
    const isUploadDisabled = useFlag('DrivePhotosUploadDisabled');
    const updateTitle = useAppTitleUpdate();
    let [searchParams, setSearchParams] = useSearchParams();
    const { createNotification } = useNotifications();
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
        addAlbumPhoto,

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

    const onPhotoUploadedToAlbum = useCallback(
        async (file: OnFileUploadSuccessCallbackData) => {
            if (!file || !album || !albumShareId) {
                return;
            }
            const abortSignal = new AbortController().signal;
            try {
                // If you're not the owner of the album
                // you just upload directly in the album
                // so you don't add afterwards to add the photo to the album
                // Additionally if the file is skipped AND already in the album, no need to call backend to re-add
                const isAlreadyInAlbum = albumPhotos.some(
                    (photo) => typeof photo === 'object' && photo.linkId === file.fileId
                );
                if (album.permissions.isOwner && !isAlreadyInAlbum) {
                    await addAlbumPhoto(abortSignal, albumShareId, file.fileId);
                }
            } catch (e) {
                if (e instanceof Error && e.message) {
                    createNotification({ text: e.message, type: 'error' });
                }
                sendErrorReport(e);
            }
        },
        [createNotification, addAlbumPhoto, albumShareId, album, albumPhotos]
    );

    const addOrRemovePhotoToFavorite = useCallback(
        async (linkId: string, isFavorite: boolean) => {
            void favoritePhotoToggle(linkId, isFavorite);
        },
        [favoritePhotoToggle]
    );

    const isAlbumPhotosEmpty = albumPhotos.length === 0;
    const albumName = album?.name;

    const onShare = useCallback(() => {
        if (!albumShareId || !album) {
            return;
        }
        modals.linkSharing?.({ shareId: albumShareId, linkId: album.linkId });
    }, [albumShareId, album, modals]);

    useEffect(() => {
        if (albumName) {
            updateTitle(`Album > ${albumName}`);
        }
    }, [albumName, updateTitle]);

    useEffect(() => {
        if (album && (albumShareId || album.shareId)) {
            // album.shareId if album is shared already
            // albumShareId otherwise
            const validShareId = album.shareId || albumShareId;
            if (searchParams.has('openShare') && typeof validShareId === 'string') {
                modals.linkSharing?.({ shareId: validShareId, linkId: album.linkId });
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

    const viewOnly = useMemo(() => {
        return isUploadDisabled || !album?.permissions.isEditor;
    }, [isUploadDisabled, album?.permissions.isEditor]);

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
            <UploadDragDrop
                disabled={viewOnly}
                isForPhotos={true}
                shareId={albumShareId}
                parentLinkId={uploadLinkId}
                onFileUpload={onPhotoUploadedToAlbum}
                onFileSkipped={onPhotoUploadedToAlbum}
                className="flex flex-column flex-nowrap flex-1"
            >
                {isAlbumPhotosEmpty ? (
                    <div className="flex flex-column flex-nowrap mx-2 p-4 w-full h-full">
                        <AlbumCoverHeader
                            shareId={albumShareId}
                            uploadLinkId={uploadLinkId}
                            linkId={album.linkId}
                            onFileUpload={onPhotoUploadedToAlbum}
                            onFileSkipped={onPhotoUploadedToAlbum}
                            album={album}
                            photoCount={photoCount}
                            onShare={onShare}
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
                        onFavorite={addOrRemovePhotoToFavorite}
                        rootLinkId={linkId}
                    >
                        <AlbumCoverHeader
                            shareId={albumShareId}
                            uploadLinkId={uploadLinkId}
                            linkId={album.linkId}
                            album={album}
                            photoCount={photoCount}
                            onFileUpload={onPhotoUploadedToAlbum}
                            onFileSkipped={onPhotoUploadedToAlbum}
                            onShare={() => {
                                modals.linkSharing?.({ shareId: albumShareId, linkId: album.linkId });
                            }}
                            onAddAlbumPhotos={() => {
                                navigateToAlbum(albumShareId, albumLinkId, { addPhotos: true });
                            }}
                        />
                    </PhotosInsideAlbumsGrid>
                )}
            </UploadDragDrop>
        </>
    );
};
