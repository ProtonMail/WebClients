import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useConfig } from '@proton/components';
import { generateNodeUid, getDriveForPhotos } from '@proton/drive/index';
import { getBusDriver } from '@proton/drive/internal/BusDriver';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { useFlag } from '@proton/unleash/useFlag';

import useNavigate from '../../hooks/drive/useNavigate';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import { usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { toggleFavorite } from '../PhotosActions/Albums';
import { PhotosInsideAlbumsGrid } from './PhotosInsideAlbumsGrid';
import { AlbumCoverHeader } from './components/AlbumCoverHeader';
import { AlbumEmptyView } from './components/AlbumEmptyView';
import { usePhotosSelection } from './hooks/usePhotosSelection';
import type { PhotosLayoutOutletContext } from './layout/PhotosLayout';
import { enqueueAdditionalInfo } from './loaders/loadAdditionalInfo';

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
    const { albumLinkId, albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const { setPreviewNodeUid, modals } = usePhotoLayoutStore(
        useShallow((state) => ({
            setPreviewNodeUid: state.setPreviewNodeUid,
            modals: state.modals,
        }))
    );

    const {
        linkId,
        albums,

        albumPhotos,

        isAlbumsLoading,
        isAlbumPhotosLoading,

        albumPhotosNodeUidToIndexMap,
        photoNodeUidToIndexMap,
        photos,
    } = useOutletContext<PhotosLayoutOutletContext>();

    const { selectedItems, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection({
        photos,
        albumPhotos,
        albumPhotosNodeUidToIndexMap,
        photoNodeUidToIndexMap,
    });

    const isShiftPressed = useShiftKey();

    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const { navigateToAlbum } = useNavigate();

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

    const album = useMemo(() => {
        if (!albumLinkId) {
            return undefined;
        }
        return albums.find((album) => album.linkId === albumLinkId);
    }, [albums, albumLinkId]);

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

    useEffect(() => {
        if (!album?.volumeId || album.permissions.isOwner) {
            return;
        }
        // Subscribe to shared album volume events so we receive updates for photos in this album.
        // For owned albums this is already covered by subscribePhotosEventsMyUpdates.
        // TODO: Use proper treeEventScopeId once albums are migrated to SDK
        const treeEventScopeId = album.volumeId;
        const context = `album-photos`;
        getBusDriver().subscribePhotosEventsScope(treeEventScopeId, context);
        return () => {
            void getBusDriver().unsubscribeSdkEventsScope(treeEventScopeId, context, 'photos');
        };
    }, [album?.volumeId, album?.linkId, album?.permissions.isOwner]);

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
                    onItemClick={setPreviewNodeUid}
                    //TODO: Remove that any
                    selectedItems={selectedItems as any}
                    onSelectChange={(i, isSelected) =>
                        handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                    }
                    isGroupSelected={isGroupSelected}
                    isItemSelected={isItemSelected}
                    onFavorite={!driveAlbumsDisabled ? toggleFavorite : undefined}
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
                                drive: getDriveForPhotos(),
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
