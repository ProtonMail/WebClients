import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive/index';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import isTruthy from '@proton/utils/isTruthy';

import { DownloadManager } from '../../managers/download/DownloadManager';
import type { DriveEvent, DriveEvents } from '../../store/_events';
import { type DecryptedLink, useLinksListing } from '../../store/_links';
import useLinksState from '../../store/_links/useLinksState';
import { isPhotoGroup, sortWithCategories as legacySortWithCategories } from '../../store/_photos';
import type { PhotoLink } from '../../store/_photos';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from '../../store/_views/utils';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { loadCurrentAlbum } from '../loaders/loadAlbum';
import { loadAlbums, loadAllAlbums, loadSharedWithMeAlbums } from '../loaders/loadAlbums';
import { loadTimelinePhotos } from '../loaders/loadPhotos';
import { useAlbumsStore } from '../useAlbums.store';
import { usePhotosStore } from '../usePhotos.store';
import { getTagFilteredPhotos } from '../utils/getTagFilteredPhotos';
import type { MappedPhotoItem } from '../utils/mapPhotoItemToLegacy';
import { mapPhotoItemToLegacy } from '../utils/mapPhotoItemToLegacy';
import { sortWithCategories } from '../utils/sortWithCategories';
import { usePhotosWithAlbums } from './PhotosWithAlbumsProvider';

/**
 * For Photos, we listen for delete and move events
 * to update our internal state which is not linked to the global state.
 */
export function updateByEvents(
    { events, eventId }: DriveEvents,
    shareId: string,
    removePhotosFromCache: (linkIds: string[]) => void,
    updateAlbumsCache: (linkIds: string[]) => void,
    processedEventCounter: (eventId: string, event: DriveEvent) => void
) {
    const linksToRemove = events
        .filter(
            (event) =>
                event.eventType === EVENT_TYPES.DELETE ||
                (event.originShareId === shareId && event.encryptedLink.rootShareId !== event.originShareId)
        )
        .map((event) => {
            processedEventCounter(eventId, event);
            return event.encryptedLink.linkId;
        });

    removePhotosFromCache(linksToRemove);

    const albumsToBeUpdated = events
        .filter((event) => event.eventType === EVENT_TYPES.UPDATE_METADATA && event.encryptedLink.mimeType === 'Album')
        .map((event) => {
            processedEventCounter(eventId, event);
            return event.encryptedLink.linkId;
        });

    updateAlbumsCache(albumsToBeUpdated);
}

export const usePhotosWithAlbumsView = () => {
    const { albumShareId, albumLinkId } = useParams<{ albumShareId?: string; albumLinkId?: string }>();
    const { getCachedChildren } = useLinksListing();
    const linkState = useLinksState();
    const {
        shareId,
        linkId,
        volumeId,
        initializePhotosView,
        addAlbumPhotos,
        removePhotosFromCache,
        addPhotoAsCover,
        removeAlbumPhotos,
        deleteAlbum,
        favoritePhoto,
        userAddressEmail,
        addNewAlbumPhotoToCache,
        removeTagsFromPhoto,
    } = usePhotosWithAlbums();

    const albumPhotoUids = useAlbumsStore(
        useShallow((state): Set<string> => {
            const uid = state.currentAlbumNodeUid;
            return (uid ? state.albums.get(uid)?.photoNodeUids : undefined) ?? new Set<string>();
        })
    );
    const { albumsOrder, albumsMap, isAlbumsLoading } = useAlbumsStore(
        useShallow((state) => ({
            albumsOrder: state.albumsUids,
            albumsMap: state.albums,
            isAlbumsLoading: state.isLoadingList,
        }))
    );

    const [selectedTags, setSelectedTags] = useState([-1]);
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );
    const isPhotosLoading = usePhotosStore((state) => state.isLoading);
    const photos = usePhotosStore(useShallow((state) => state.photoItems));
    const photoTimelineUids = usePhotosStore(useShallow((state) => state.photoTimelineUids));

    const abortSignal = useAbortSignal([shareId, linkId]);
    const cache = useMemo(() => {
        return shareId && linkId ? getCachedChildren(abortSignal, shareId, linkId) : undefined;
    }, [shareId, linkId, abortSignal, getCachedChildren]);

    const cachedLinks = useMemoArrayNoMatterTheOrder(cache?.links || []);

    // We have to concat cachedLinks since for albums
    // some photos are children of root (photo-stream) while some others are children of the album (shared album where upload are done by not the owner)
    const cachedOwnerAlbumPhotosLinks: DecryptedLink[] = [];
    albumPhotoUids.forEach((nodeUid) => {
        const { nodeId: linkId } = splitNodeUid(nodeUid);
        const link = cachedLinks.find((cachedLink) => cachedLink.linkId === linkId);
        if (link) {
            cachedOwnerAlbumPhotosLinks.push(link);
        }
    });

    // This will be flattened to contain categories and links
    const isPhotosEmpty = useMemo(
        () => !shareId || !linkId || !volumeId || (photoTimelineUids.size === 0 && !isPhotosLoading),
        [shareId, linkId, volumeId, photoTimelineUids, isPhotosLoading]
    );

    const {
        photosViewData,
        photoNodeUidToIndexMap,
        photoNodeUids,
    }: {
        photosViewData: (MappedPhotoItem | string)[];
        photoNodeUidToIndexMap: Record<string, number>;
        photoNodeUids: string[];
    } = useMemo(() => {
        if (!shareId || !linkId || !volumeId) {
            return {
                photosViewData: [],
                photoNodeUidToIndexMap: {},
                photoNodeUids: [],
            };
        }

        const timelineItems = Array.from(photoTimelineUids).flatMap((uid) => {
            const item = photos.get(uid);
            return item ? [item] : [];
        });
        const sorted = sortWithCategories(timelineItems);
        const filtered = getTagFilteredPhotos(sorted, selectedTags);
        const photosViewData = filtered.map((item) =>
            typeof item === 'string' ? item : mapPhotoItemToLegacy(item, shareId, linkId)
        );

        // To improve performance, let's build some maps ahead of time
        // For previews and selection, we need these maps to know where
        // each link is located in the data array.
        const photoNodeUidToIndexMap: Record<string, number> = {};

        // We also provide a list of nodeUids for the preview navigation,
        // so it's important that this array follows the sorted view order.
        const photoNodeUids: string[] = [];

        photosViewData.forEach((item, index) => {
            if (!isPhotoGroup(item)) {
                photoNodeUidToIndexMap[item.nodeUid] = index;
                photoNodeUids.push(item.nodeUid);
            }
        });

        return {
            photosViewData,
            photoNodeUidToIndexMap,
            photoNodeUids,
        };
    }, [photos, photoTimelineUids, linkId, shareId, volumeId, selectedTags]);

    const { albumPhotosViewData, albumPhotosNodeUidToIndexMap, albumPhotosNodeUids } = useMemo(() => {
        if (!shareId || !linkId) {
            return {
                albumPhotosViewData: [],
                albumPhotosNodeUidToIndexMap: {},
                albumPhotosNodeUids: [],
            };
        }

        const result: Record<string, PhotoLink> = {};

        // We create "fake" links to avoid complicating the rest of the code
        // We merge the link from state afterwards
        albumPhotoUids.forEach((nodeUid) => {
            const { nodeId: linkId, volumeId: photoVolumeId } = splitNodeUid(nodeUid);
            const photoItem = photos.get(nodeUid);
            result[linkId] = Object.assign(
                {
                    linkId,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    rootShareId: albumShareId!,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    parentLinkId: albumLinkId!,
                    volumeId: photoVolumeId,
                    isFile: true,
                    activeRevision: {
                        photo: {
                            linkId,
                            captureTime: photoItem ? Math.floor(photoItem.captureTime.getTime() / 1000) : 0,
                            tags: photoItem?.tags ?? [],
                            relatedPhotos: [],
                        },
                    },
                },
                linkState.getLink(albumShareId || '', linkId)?.decrypted || {}
            );
        });

        const albumPhotosViewData = legacySortWithCategories(Object.values(result));

        // To improve performance, let's build some maps ahead of time
        // For previews and selection, we need these maps to know where
        // each link is located in the data array.
        const albumPhotosNodeUidToIndexMap: Record<string, number> = {};

        // We also provide a list of nodeUids for the preview navigation,
        // so it's important that this array follows the sorted view order.
        const albumPhotosNodeUids: string[] = [];

        albumPhotosViewData.forEach((item, index) => {
            if (!isPhotoGroup(item)) {
                const nodeUid = generateNodeUid(item.volumeId, item.linkId);
                (item as typeof item & { nodeUid: string }).nodeUid = nodeUid;
                albumPhotosNodeUidToIndexMap[nodeUid] = index;
                albumPhotosNodeUids.push(nodeUid);
            }
        });

        return {
            albumPhotosViewData,
            albumPhotosNodeUidToIndexMap,
            albumPhotosNodeUids,
        };
    }, [albumLinkId, albumPhotoUids, albumShareId, linkId, linkState, photos, shareId]);

    const albumsView = useMemo(
        () => albumsOrder.map((uid) => albumsMap.get(uid)).filter(isTruthy),
        [albumsOrder, albumsMap]
    );

    useEffect(() => {
        const abortController = new AbortController();

        if (!albumShareId && !albumLinkId && currentPageType && AlbumsPageTypes.ALBUMS === currentPageType) {
            void loadAllAlbums(abortController.signal);
        } else if (albumShareId && albumLinkId && AlbumsPageTypes.ALBUMSGALLERY === currentPageType) {
            void getDriveForPhotos()
                .getNodeUid(albumShareId, albumLinkId)
                .then((currentAlbumNodeUid) => {
                    void loadCurrentAlbum(currentAlbumNodeUid, abortController.signal);
                });
        } else if (AlbumsPageTypes.GALLERY === currentPageType || AlbumsPageTypes.ALBUMSADDPHOTOS === currentPageType) {
            void loadTimelinePhotos(abortController.signal);
        }

        return () => {
            abortController.abort();
        };
    }, [albumLinkId, albumShareId, currentPageType]);

    const loadPhotoLink = useCallback((shareId: string, linkId: string) => {
        if (!shareId || !linkId || !volumeId) {
            return;
        }
        const link = linkState.getLink(shareId, linkId);
        if (link) {
            void getDriveForPhotos()
                .getNode(generateNodeUid(volumeId, linkId))
                .then((maybeNode) => {
                    const { node } = getNodeEntity(maybeNode);
                    if (link.decrypted) {
                        linkState.setLinks(shareId, [
                            {
                                encrypted: link.encrypted,
                                decrypted: {
                                    ...link.decrypted,
                                    name: node.name,
                                },
                            },
                        ]);
                    }
                });
        }
    }, []);

    const refreshAlbums = useCallback((abortSignal: AbortSignal = new AbortController().signal) => {
        return loadAlbums(abortSignal);
    }, []);

    const refreshSharedWithMeAlbums = useCallback((abortSignal: AbortSignal = new AbortController().signal) => {
        return loadSharedWithMeAlbums(abortSignal);
    }, []);

    const requestDownload = useCallback(async (photosUids: string[]) => {
        await DownloadManager.getInstance().downloadPhotos(photosUids);
    }, []);

    const addAlbumPhoto = useCallback(
        (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string, linkId: string) => {
            return addAlbumPhotos(abortSignal, albumShareId, albumLinkId, [linkId], true);
        },
        [addAlbumPhotos]
    );

    const setPhotoAsCover = useCallback(
        async (abortSignal: AbortSignal, coverLinkId: string) => {
            if (!albumLinkId) {
                return;
            }
            return addPhotoAsCover(abortSignal, albumLinkId, coverLinkId);
        },
        [addPhotoAsCover, albumLinkId]
    );

    const handleSelectTag = useCallback(async (abortSignal: AbortSignal, tags: PhotoTag[]) => {
        setSelectedTags(tags);
        if (!usePhotosStore.getState().isLoading || tags.includes(PhotoTag.All)) {
            return;
        }
    }, []);

    return {
        volumeId,
        shareId,
        linkId,
        albums: albumsView,
        albumPhotos: albumPhotosViewData,
        albumPhotosNodeUidToIndexMap,
        albumPhotosNodeUids,
        photos: photosViewData,
        photoNodeUidToIndexMap,
        photoNodeUids,
        photoTimelineUids,
        removePhotosFromCache,
        loadPhotoLink,
        requestDownload,
        isPhotosLoading,
        isAlbumsLoading,
        refreshSharedWithMeAlbums,
        refreshAlbums,
        addAlbumPhoto,
        addAlbumPhotos,
        setPhotoAsCover,
        removeAlbumPhotos,
        deleteAlbum,
        selectedTags,
        handleSelectTag,
        userAddressEmail,
        isPhotosEmpty,
        favoritePhoto,
        addNewAlbumPhotoToCache,
        removeTagsFromPhoto,
        initializePhotosView,
    };
};
