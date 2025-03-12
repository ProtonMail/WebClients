import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import type { LinkDownload } from '../../store/_downloads';
import { useDownloadProvider } from '../../store/_downloads';
import type { DriveEvent, DriveEvents } from '../../store/_events';
import { useDriveEventManager } from '../../store/_events';
import { type DecryptedLink, useLinksListing, useLinksQueue } from '../../store/_links';
import { isPhotoGroup, sortWithCategories } from '../../store/_photos';
import type { PhotoLink } from '../../store/_photos';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from '../../store/_views/utils';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { usePhotosWithAlbums } from './PhotosWithAlbumsProvider';

/**
 * For Photos, we listen for delete and move events
 * to update our internal state which is not linked to the global state.
 */
export function updateByEvents(
    { events, eventId }: DriveEvents,
    shareId: string,
    removePhotosFromCache: (linkIds: string[]) => void,
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
}

export const usePhotosWithAlbumsView = () => {
    let { albumShareId, albumLinkId } = useParams<{ albumShareId?: string; albumLinkId?: string }>();
    const eventsManager = useDriveEventManager();
    const { getCachedChildren, loadLinksMeta, getCachedLinksWithoutMeta } = useLinksListing();
    const {
        shareId,
        linkId,
        isPhotosLoading,
        isAlbumPhotosLoading,
        volumeId,
        photos,
        albumPhotos,
        albums,
        userAddressEmail,
        loadPhotos,
        loadAlbums,
        loadSharedWithMeAlbums,
        addAlbumPhotos,
        loadAlbumPhotos,
        removePhotosFromCache,
        addPhotoAsCover,
        removeAlbumPhotos,
        deleteAlbum,
    } = usePhotosWithAlbums();

    const [selectedTags, setSelectedTags] = useState([PhotoTag.All]);

    const { addToQueue } = useLinksQueue({ loadThumbnails: true });
    const { download } = useDownloadProvider();
    const [isAlbumsLoading, setIsAlbumsLoading] = useState<boolean>(true);

    const abortSignal = useAbortSignal([shareId, linkId]);
    const cache = shareId && linkId ? getCachedChildren(abortSignal, shareId, linkId) : undefined;
    const cachedLinks = useMemoArrayNoMatterTheOrder(cache?.links || []);
    const cachedAlbums =
        shareId && linkId
            ? getCachedLinksWithoutMeta(
                  abortSignal,
                  shareId,
                  Array.from(albums.values()).map((album) => album.cover?.linkId || '')
              )
            : undefined;
    const cachedAlbumsCover = useMemoArrayNoMatterTheOrder(cachedAlbums?.links || []);
    const cacheAlbumPhotos =
        shareId && linkId && albumLinkId ? getCachedChildren(abortSignal, shareId, albumLinkId) : undefined;

    // We have to concat cachedLinks since for albums
    // some photos are children of root (photo-stream) while some others are children of the album (shared album where upload are done by not the owner)
    const cachedOwnerAlbumPhotosLinks: DecryptedLink[] = [];
    albumPhotos.forEach((albumPhoto) => {
        const albumPhotoLinkId = albumPhoto.linkId;
        const link = cachedLinks.find((cachedLink) => cachedLink.linkId === albumPhotoLinkId);
        if (link) {
            cachedOwnerAlbumPhotosLinks.push(link);
        }
    });
    const cachedAlbumPhotosLinks = useMemoArrayNoMatterTheOrder(
        (cacheAlbumPhotos?.links || []).concat(cachedOwnerAlbumPhotosLinks)
    );

    // This will be flattened to contain categories and links
    const { photosViewData, photoLinkIdToIndexMap, photoLinkIds } = useMemo(() => {
        if (!shareId || !linkId) {
            return {
                photosViewData: [],
                photoLinkIdToIndexMap: {},
                photoLinkIds: [],
            };
        }

        const result: Record<string, PhotoLink> = {};

        // We create "fake" links to avoid complicating the rest of the code
        photos.forEach((photo) => {
            result[photo.linkId] = {
                linkId: photo.linkId,
                rootShareId: shareId,
                parentLinkId: linkId,
                isFile: true,
                activeRevision: {
                    photo,
                },
            };
        });

        // Add data from cache
        cachedLinks.forEach((link) => {
            // If this link is not a photo, ignore it
            if (!link.activeRevision?.photo) {
                return;
            }

            // Related photos are not supported by the web client for now
            if (link.activeRevision.photo.mainPhotoLinkId) {
                return;
            }

            result[link.linkId] = link;
        });

        const photosViewData = sortWithCategories(Object.values(result));

        // To improve performance, let's build some maps ahead of time
        // For previews and selection, we need these maps to know where
        // each link is located in the data array.
        let photoLinkIdToIndexMap: Record<string, number> = {};

        // We also provide a list of linkIds for the preview navigation,
        // so it's important that this array follows the sorted view order.
        let photoLinkIds: string[] = [];

        photosViewData.forEach((item, index) => {
            if (!isPhotoGroup(item)) {
                photoLinkIdToIndexMap[item.linkId] = index;
                photoLinkIds.push(item.linkId);
            }
        });

        return {
            photosViewData,
            photoLinkIdToIndexMap,
            photoLinkIds,
        };
    }, [photos, cachedLinks, linkId, shareId, selectedTags]);

    const { albumPhotosViewData, albumPhotosLinkIdToIndexMap, albumPhotosLinkIds } = useMemo(() => {
        if (!shareId || !linkId) {
            return {
                albumPhotosViewData: [],
                albumPhotosLinkIdToIndexMap: {},
                albumPhotosLinkIds: [],
            };
        }

        const result: Record<string, PhotoLink> = {};

        // We create "fake" links to avoid complicating the rest of the code
        albumPhotos.forEach((photo) => {
            result[photo.linkId] = {
                linkId: photo.linkId,
                rootShareId: photo.rootShareId,
                parentLinkId: photo.parentLinkId,
                isFile: true,
                activeRevision: {
                    photo,
                },
            };
        });

        // Add data from cache
        cachedAlbumPhotosLinks.forEach((link) => {
            // If this link is not a photo, ignore it
            if (!link.activeRevision?.photo) {
                return;
            }

            // Related photos are not supported by the web client for now
            if (link.activeRevision.photo.mainPhotoLinkId) {
                return;
            }

            result[link.linkId] = link;
        });

        const albumPhotosViewData = sortWithCategories(Object.values(result));

        // To improve performance, let's build some maps ahead of time
        // For previews and selection, we need these maps to know where
        // each link is located in the data array.
        let albumPhotosLinkIdToIndexMap: Record<string, number> = {};

        // We also provide a list of linkIds for the preview navigation,
        // so it's important that this array follows the sorted view order.
        let albumPhotosLinkIds: string[] = [];

        albumPhotosViewData.forEach((item, index) => {
            if (!isPhotoGroup(item)) {
                albumPhotosLinkIdToIndexMap[item.linkId] = index;
                albumPhotosLinkIds.push(item.linkId);
            }
        });

        return {
            albumPhotosViewData,
            albumPhotosLinkIdToIndexMap,
            albumPhotosLinkIds,
        };
    }, [albumPhotos, cachedAlbumPhotosLinks, linkId, shareId]);

    const albumsView = useMemo(() => {
        if (!shareId || !linkId || !cachedAlbumsCover) {
            return Array.from(albums.values());
        }
        const albumsView = Array.from(albums.values()).map((album) => {
            const cachedAlbumCover = cachedAlbumsCover.find((link) => album.cover?.linkId === link.linkId);
            return {
                ...album,
                ...(cachedAlbumCover && { cover: cachedAlbumCover }),
            };
        });
        return albumsView;
    }, [albums, cachedAlbumsCover, linkId, shareId]);

    useEffect(() => {
        if (!volumeId || !shareId) {
            return;
        }
        const abortController = new AbortController();

        if (albumShareId && albumLinkId) {
            setIsAlbumsLoading(true);
            void Promise.all([
                loadSharedWithMeAlbums(abortController.signal),
                loadAlbums(abortController.signal),
            ]).finally(() => {
                setIsAlbumsLoading(false);
                void loadAlbumPhotos(abortController.signal, albumShareId, albumLinkId);
            });
        } else {
            // If loading /photos first, defer loading of albums after photos
            void loadPhotos(abortController.signal).then(() => {
                setIsAlbumsLoading(true);
                void Promise.all([
                    loadAlbums(abortController.signal),
                    loadSharedWithMeAlbums(abortController.signal),
                ]).finally(() => {
                    setIsAlbumsLoading(false);
                });
            });
        }

        const callbackId = eventsManager.eventHandlers.register((eventVolumeId, events, processedEventCounter) => {
            if (eventVolumeId === volumeId) {
                updateByEvents(events, shareId, removePhotosFromCache, processedEventCounter);
            }
        });

        return () => {
            eventsManager.eventHandlers.unregister(callbackId);
            abortController.abort();
        };
    }, [volumeId, shareId, albumLinkId, albumShareId]);

    const loadPhotoLink = (shareId: string, linkId: string, domRef?: React.MutableRefObject<unknown>) => {
        if (!shareId || !linkId) {
            return;
        }
        addToQueue(shareId, linkId, domRef);
    };

    const refreshAll = () => {
        if (!volumeId || !shareId) {
            return;
        }
        const abortController = new AbortController();
        void loadPhotos(abortController.signal);
        void loadAlbums(abortController.signal);
    };

    const refreshAlbums = () => {
        if (!volumeId || !shareId) {
            return;
        }
        const abortController = new AbortController();
        void loadAlbums(abortController.signal);
    };

    const refreshAlbumPhotos = useCallback(
        (albumLinkId: string) => {
            if (!volumeId || !shareId || !albumShareId || !albumLinkId) {
                return;
            }
            const abortController = new AbortController();
            void loadAlbumPhotos(abortController.signal, albumShareId, albumLinkId);
        },
        [volumeId, shareId, albumShareId, loadAlbumPhotos]
    );

    const refreshPhotos = () => {
        if (!volumeId || !shareId) {
            return;
        }
        const abortController = new AbortController();
        void loadPhotos(abortController.signal);
    };

    /**
     * A `PhotoLink` may not be fully loaded, so we need to preload all links in the cache
     * first to request a download.
     *
     * @param linkIds List of Link IDs to preload
     */
    const requestDownload = async (linkIds: string[]) => {
        if (!shareId) {
            return;
        }

        const ac = new AbortController();
        const meta = await loadLinksMeta(ac.signal, 'photos-download', shareId, linkIds);

        if (meta.links.length === 0) {
            return;
        }

        if (meta.errors.length > 0) {
            sendErrorReport(
                new EnrichedError('Failed to load links meta for download', {
                    tags: {
                        shareId,
                    },
                    extra: {
                        linkIds: linkIds.filter((id) => !meta.links.find((link) => link.linkId === id)),
                        errors: meta.errors,
                    },
                })
            );

            return;
        }

        const relatedLinkIds = meta.links.flatMap((link) => link.activeRevision?.photo?.relatedPhotosLinkIds || []);

        const relatedMeta = await loadLinksMeta(ac.signal, 'photos-related-download', shareId, relatedLinkIds);

        if (relatedMeta.errors.length > 0) {
            sendErrorReport(
                new EnrichedError('Failed to load links meta for download', {
                    tags: {
                        shareId,
                    },
                    extra: {
                        linkIds: linkIds.filter((id) => !relatedMeta.links.find((link) => link.linkId === id)),
                        errors: relatedMeta.errors,
                    },
                })
            );

            return;
        }

        const links: LinkDownload[] = [...meta.links, ...relatedMeta.links].map(
            (link) =>
                ({
                    ...link,
                    shareId: link.rootShareId,
                }) satisfies LinkDownload
        );

        // if on album page and all links are selected, download the zip as the album name
        const album = albumLinkId && links.length === albumPhotos.length ? albums.get(albumLinkId) : undefined;

        await download(links, {
            zipName: album?.name,
        });
    };

    const addAlbumPhoto = useCallback(
        (abortSignal: AbortSignal, albumShareId: string, linkId: string) => {
            if (!albumLinkId) {
                throw new Error('Failed to add a photo to an album');
            }
            return addAlbumPhotos(abortSignal, albumShareId, albumLinkId, [linkId]);
        },
        [albumLinkId, addAlbumPhotos]
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

    const handleSelectTag = useCallback(
        async (abortSignal: AbortSignal, tags: PhotoTag[]) => {
            setSelectedTags(tags);
            if (!isPhotosLoading || tags.includes(PhotoTag.All)) {
                return;
            }
            void loadPhotos(abortSignal, tags);
        },
        [isPhotosLoading, loadPhotos]
    );

    return {
        volumeId,
        shareId,
        linkId,
        userAddressEmail,
        albums: albumsView,
        albumPhotos: albumPhotosViewData,
        albumPhotosLinkIdToIndexMap,
        albumPhotosLinkIds,
        photos: photosViewData,
        photoLinkIdToIndexMap,
        photoLinkIds,
        removePhotosFromCache,
        loadPhotoLink,
        requestDownload,
        isPhotosLoading,
        isAlbumsLoading,
        isAlbumPhotosLoading,
        refreshAll,
        refreshAlbums,
        refreshPhotos,
        refreshAlbumPhotos,
        addAlbumPhoto,
        addAlbumPhotos,
        setPhotoAsCover,
        removeAlbumPhotos,
        deleteAlbum,
        selectedTags,
        handleSelectTag,
    };
};
