import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Loader, useAppTitle, useConfig } from '@proton/components';
import { getDriveForPhotos } from '@proton/drive/index';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import { getAppName } from '@proton/shared/lib/apps/helper';

import useNavigate from '../../legacy/hooks/drive/useNavigate';
import { useShiftKey } from '../../legacy/hooks/util/useShiftKey';
import { toggleFavorite } from '../PhotosActions/Albums';
import { usePhotoLayoutStore } from '../layout.store';
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

    const { albumPhotoTimelineUids, photoTimelineUids } = useOutletContext<PhotosLayoutOutletContext>();

    const { selectedItems, isGroupSelected, isItemSelected, handleSelection } = usePhotosSelection({
        photoTimelineUids,
        albumPhotoTimelineUids,
    });

    const albumUids = useMemo(() => Array.from(albumPhotoTimelineUids ?? new Set<string>()), [albumPhotoTimelineUids]);

    const isShiftPressed = useShiftKey();

    const { navigateToNodeUid } = useNavigate();

    const handleItemRender = useCallback((nodeUid: string, domRef: React.MutableRefObject<unknown>) => {
        const shouldProcess = () => Boolean(domRef.current);
        // Decrypt the node and fetch its metadata.
        enqueueAdditionalInfo(nodeUid, shouldProcess);
        // Load the thumbnail. Photos are single-revision, so we can request it from the
        // thumbnail loader by nodeUid alone, without waiting for the revisionUid — which
        // would otherwise mean waiting on the node to be decrypted and its metadata fetched.
        loadThumbnail(getDriveForPhotos(), {
            nodeUid: nodeUid,
            shouldLoad: shouldProcess,
            thumbnailTypes: ['sd'],
        });
    }, []);

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

    useEffect(() => {
        if (!album?.treeEventScopeId) {
            return;
        }
        const context = 'album-photos';
        let unsub: (() => Promise<void>) | undefined;
        void useAlbumsStore
            .getState()
            .subscribeToAlbumEvents(album.treeEventScopeId, context)
            .then((fn) => {
                unsub = fn;
            });
        return () => {
            void unsub?.();
        };
    }, [album?.treeEventScopeId]);

    useEffect(() => {
        return () => {
            useAlbumsStore.getState().clearCurrentAlbum();
        };
    }, []);

    if (isLoading || !album) {
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
                    uids={albumUids}
                    onItemRender={handleItemRender}
                    isLoading={isLoading}
                    onItemClick={setPreviewNodeUid}
                    selectedCount={selectedItems.length}
                    onSelectChange={(i, isSelected) =>
                        handleSelection(i, { isSelected, isMultiSelect: isShiftPressed() })
                    }
                    isGroupSelected={isGroupSelected}
                    isItemSelected={isItemSelected}
                    onFavorite={toggleFavorite}
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
