import type { FC } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useConfig } from '@proton/components';
import { getDriveForPhotos, splitNodeUid } from '@proton/drive/index';
import { getBusDriver } from '@proton/drive/internal/BusDriver';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import { getAppName } from '@proton/shared/lib/apps/helper';

import useNavigate from '../../hooks/drive/useNavigate';
import { useShiftKey } from '../../hooks/util/useShiftKey';
import { usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { toggleFavorite } from '../PhotosActions/Albums';
import { useAlbumsStore } from '../useAlbums.store';
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
    const updateTitle = useAppTitleUpdate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { albumShareId } = useParams<{ albumLinkId: string; albumShareId: string }>();
    const photoCount = useAlbumsStore((state) => {
        const uid = state.currentAlbumNodeUid;
        return (uid ? state.albums.get(uid)?.photoCount : undefined) ?? 0;
    });

    const { setPreviewNodeUid, modals } = usePhotoLayoutStore(
        useShallow((state) => ({
            setPreviewNodeUid: state.setPreviewNodeUid,
            modals: state.modals,
        }))
    );

    const {
        linkId,

        albumPhotos,

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

    const { navigateToNodeUid } = useNavigate();

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

    const { album, isLoading } = useAlbumsStore(
        useShallow((state) => {
            const album = state.currentAlbumNodeUid ? state.albums.get(state.currentAlbumNodeUid) : undefined;
            // Skip the full-page loader if we already have cached photo uids for this album.
            const isLoading = state.isLoading && album?.photoNodeUids === undefined;
            return { isLoading, album };
        })
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
                modals.linkSharing?.({ nodeUid: album.nodeUid, drive: getDriveForPhotos() });
                searchParams.delete('openShare');
                setSearchParams(searchParams);
            }
        }
    }, [albumShareId, album, searchParams, setSearchParams, modals]);

    const albumVolumeIdRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!album?.nodeUid) {
            return;
        }

        const { volumeId: albumVolumeId } = splitNodeUid(album.nodeUid);
        albumVolumeIdRef.current = albumVolumeId;

        const context = `album-photos`;
        getBusDriver().subscribePhotosEventsScope(albumVolumeId, context);
        return () => {
            void getBusDriver().unsubscribeSdkEventsScope(albumVolumeId, context, 'photos');
        };
    }, [album?.nodeUid]);

    useEffect(() => {
        return () => {
            useAlbumsStore.getState().clearCurrentAlbum();
        };
    }, []);

    if (isLoading || !linkId || !album) {
        return <Loader />;
    }

    // TODO: Album not found view [DRVWEB-4615]
    return (
        <>
            {isAlbumPhotosEmpty ? (
                <div className="flex flex-column flex-nowrap p-4 w-full h-full">
                    <AlbumEmptyView
                        nodeUid={album.nodeUid}
                        onAddAlbumPhotos={() => {
                            void navigateToNodeUid(album.nodeUid, getDriveForPhotos(), '', {
                                addPhotos: true,
                            });
                        }}
                    />
                </div>
            ) : (
                <PhotosInsideAlbumsGrid
                    data={albumPhotos}
                    onItemRender={handleItemRender}
                    onItemRenderLoadedLink={handleItemRenderLoadedLink}
                    isLoading={isLoading}
                    onItemClick={setPreviewNodeUid}
                    //TODO: Remove that any
                    selectedItems={selectedItems as any}
                    onSelectChange={(i, isSelected) =>
                        handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                    }
                    isGroupSelected={isGroupSelected}
                    isItemSelected={isItemSelected}
                    onFavorite={toggleFavorite}
                    rootLinkId={linkId}
                >
                    <AlbumCoverHeader
                        nodeUid={album.nodeUid}
                        photoCount={photoCount}
                        onShare={() => {
                            modals.linkSharing?.({
                                nodeUid: album.nodeUid,
                                drive: getDriveForPhotos(),
                            });
                        }}
                        onAddAlbumPhotos={() => {
                            void navigateToNodeUid(album.nodeUid, getDriveForPhotos(), '', {
                                addPhotos: true,
                            });
                        }}
                    />
                </PhotosInsideAlbumsGrid>
            )}
        </>
    );
};
