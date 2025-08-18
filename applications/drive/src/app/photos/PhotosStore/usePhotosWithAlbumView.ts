import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import type { LinkDownload } from '../../store/_downloads';
import { useDownloadProvider } from '../../store/_downloads';
import type { DriveEvent, DriveEvents } from '../../store/_events';
import { useDriveEventManager } from '../../store/_events';
import { type DecryptedLink, useLinksListing, useLinksQueue } from '../../store/_links';
import useLinksState from '../../store/_links/useLinksState';
import { isPhotoGroup, sortWithCategories } from '../../store/_photos';
import type { PhotoGridItem, PhotoLink } from '../../store/_photos';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from '../../store/_views/utils';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../zustand/photos/layout.store';
import { usePhotosWithAlbums } from './PhotosWithAlbumsProvider';
import { getTagFilteredPhotos } from './getTagFilteredPhotos';

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
    const eventsManager = useDriveEventManager();
    const { getCachedChildren, loadLinksMeta } = useLinksListing();
    const linkState = useLinksState();
    const {
        shareId,
        linkId,
        isPhotosLoading,
        isAlbumPhotosLoading,
        volumeId,
        photos,
        albumPhotos,
        albums,
        loadPhotos,
        loadAlbums,
        loadSharedWithMeAlbums,
        addAlbumPhotos,
        loadAlbumPhotos,
        removePhotosFromCache,
        updateAlbumsFromCache,
        addPhotoAsCover,
        removeAlbumPhotos,
        deleteAlbum,
        favoritePhoto,
        userAddressEmail,
        updatePhotoFavoriteFromCache,
        addNewAlbumPhotoToCache,
        removeTagsFromPhoto,
        clearAlbumPhotos,
    } = usePhotosWithAlbums();

    const [selectedTags, setSelectedTags] = useState([PhotoTag.All]);
    const processedEventIds = useRef<Set<string>>(new Set());
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );
    const { addToQueue } = useLinksQueue({ loadThumbnails: true });
    const { download } = useDownloadProvider();
    const [isAlbumsLoading, setIsAlbumsLoading] = useState<boolean>(true);

    const abortSignal = useAbortSignal([shareId, linkId]);
    const cache = useMemo(() => {
        return shareId && linkId ? getCachedChildren(abortSignal, shareId, linkId) : undefined;
    }, [shareId, linkId, abortSignal, getCachedChildren]);

    const cachedLinks = useMemoArrayNoMatterTheOrder(cache?.links || []);

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

    useEffect(() => {
        if (currentPageType === AlbumsPageTypes.GALLERY || currentPageType === AlbumsPageTypes.ALBUMS) {
            clearAlbumPhotos();
        }
    }, [currentPageType]);
    // This will be flattened to contain categories and links
    // The isPhotosEmpty needs to be decorelate from the photosViewData as it is connected to tag filtering
    // isPhotosEmpty is based on the full unfiltered photos list
    const {
        photosViewData,
        photoLinkIdToIndexMap,
        photoLinkIds,
        isPhotosEmpty,
    }: {
        photosViewData: PhotoGridItem[];
        photoLinkIdToIndexMap: Record<string, number>;
        photoLinkIds: string[];
        isPhotosEmpty: boolean;
    } = useMemo(() => {
        if (!shareId || !linkId || !volumeId) {
            return {
                photosViewData: [],
                photoLinkIdToIndexMap: {},
                photoLinkIds: [],
                isPhotosEmpty: true,
            };
        }

        const result: Record<string, PhotoLink> = {};

        // We create "fake" links to avoid complicating the rest of the code
        photos.forEach((photo) => {
            result[photo.linkId] = {
                linkId: photo.linkId,
                rootShareId: shareId,
                parentLinkId: linkId,
                volumeId,
                isFile: true,
                activeRevision: {
                    photo: {
                        linkId: photo.linkId,
                        captureTime: photo.captureTime,
                        hash: photo.hash,
                        contentHash: photo.contentHash,
                        relatedPhotosLinkIds: photo.relatedPhotos.map((relatedPhoto) => relatedPhoto.linkId),
                    },
                },
                photoProperties: {
                    isFavorite: Boolean(PhotoTag.Favorites === photo.tags.find((tag) => tag === PhotoTag.Favorites)),
                    tags: photo.tags,
                    albums: [],
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

        const isPhotosEmpty = Object.values(result).length === 0;
        const photosViewData = getTagFilteredPhotos(sortWithCategories(Object.values(result)), selectedTags);

        // To improve performance, let's build some maps ahead of time
        // For previews and selection, we need these maps to know where
        // each link is located in the data array.
        const photoLinkIdToIndexMap: Record<string, number> = {};

        // We also provide a list of linkIds for the preview navigation,
        // so it's important that this array follows the sorted view order.
        const photoLinkIds: string[] = [];

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
            isPhotosEmpty,
        };
    }, [photos, cachedLinks, linkId, shareId, volumeId, selectedTags]);

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
        // We merge the link from state afterwards
        albumPhotos.forEach((photo) => {
            result[photo.linkId] = Object.assign(
                {
                    linkId: photo.linkId,
                    rootShareId: photo.rootShareId,
                    parentLinkId: photo.parentLinkId,
                    volumeId: photo.volumeId,
                    isFile: true,
                    activeRevision: {
                        photo,
                    },
                },
                linkState.getLink(photo.rootShareId, photo.linkId)?.decrypted || {}
            );
        });

        const albumPhotosViewData = sortWithCategories(Object.values(result));

        // To improve performance, let's build some maps ahead of time
        // For previews and selection, we need these maps to know where
        // each link is located in the data array.
        const albumPhotosLinkIdToIndexMap: Record<string, number> = {};

        // We also provide a list of linkIds for the preview navigation,
        // so it's important that this array follows the sorted view order.
        const albumPhotosLinkIds: string[] = [];

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
    }, [linkState, albumPhotos, linkId, shareId]);

    const albumsView = useMemo(() => {
        if (!albums || !albums.size) {
            return Array.from(albums.values());
        }
        const albumsView = Array.from(albums.values()).map((album) => {
            const cachedAlbum = linkState.getLink(album.rootShareId, album.linkId);
            const coverLinkId = album.albumProperties?.coverLinkId || album.cover?.linkId || album.linkId;
            const cachedAlbumCover = album.cover?.linkId
                ? linkState.getLink(album.rootShareId, coverLinkId)
                : cachedAlbum;
            return {
                ...album,
                ...cachedAlbum?.decrypted,
                ...(cachedAlbumCover?.decrypted && { cover: cachedAlbumCover.decrypted }),
            };
        });
        return albumsView;
    }, [albums, linkState]);

    useEffect(() => {
        if (!volumeId || !shareId) {
            return;
        }
        const abortController = new AbortController();

        if (
            albumShareId &&
            albumLinkId &&
            currentPageType &&
            [AlbumsPageTypes.ALBUMSGALLERY, AlbumsPageTypes.ALBUMS].includes(currentPageType)
        ) {
            setIsAlbumsLoading(true);
            void Promise.all([
                loadSharedWithMeAlbums(abortController.signal),
                loadAlbums(abortController.signal),
            ]).finally(() => {
                setIsAlbumsLoading(false);
                void loadAlbumPhotos(abortController.signal, albumShareId, albumLinkId);
            });
        } else {
            setIsAlbumsLoading(false);
            // If loading /photos first, defer loading of albums after photos
            void loadPhotos(abortController.signal).then(() => {
                setIsAlbumsLoading(true);
                void Promise.all([
                    loadAlbums(abortController.signal),
                    loadSharedWithMeAlbums(abortController.signal),
                    // TODO: Temporary fix when you reload the page on AlbumsPageTypes.ALBUMSADDPHOTOS and you go back, you need albumPhotos
                    albumShareId && albumLinkId
                        ? loadAlbumPhotos(abortController.signal, albumShareId, albumLinkId)
                        : undefined,
                ]).finally(() => {
                    setIsAlbumsLoading(false);
                });
            });
        }

        return () => {
            abortController.abort();
        };
    }, [volumeId, shareId, albumLinkId, albumShareId]);

    useEffect(() => {
        if (!shareId) {
            return;
        }

        const callbackId = eventsManager.eventHandlers.register((eventVolumeId, events, processedEventCounter) => {
            if (eventVolumeId === volumeId && !processedEventIds.current.has(events.eventId)) {
                processedEventIds.current.add(events.eventId);
                updateByEvents(events, shareId, removePhotosFromCache, updateAlbumsFromCache, processedEventCounter);
            }
        });

        return () => {
            eventsManager.eventHandlers.unregister(callbackId);
        };
    }, [eventsManager.eventHandlers, shareId]);

    const loadPhotoLink = useCallback((shareId: string, linkId: string, domRef?: React.MutableRefObject<unknown>) => {
        if (!shareId || !linkId) {
            return;
        }
        addToQueue(shareId, linkId, domRef);
    }, []);

    const refreshAlbums = useCallback(
        (abortSignal: AbortSignal = new AbortController().signal) => {
            if (!volumeId || !shareId) {
                return;
            }
            return loadAlbums(abortSignal);
        },
        [volumeId, shareId, loadAlbums]
    );

    const refreshSharedWithMeAlbums = useCallback(
        (abortSignal: AbortSignal = new AbortController().signal) => {
            if (!volumeId || !shareId) {
                return;
            }
            return loadSharedWithMeAlbums(abortSignal);
        },
        [volumeId, shareId, loadSharedWithMeAlbums]
    );

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

    /**
     * A `PhotoLink` may not be fully loaded, so we need to preload all links in the cache
     * first to request a download.
     *
     * @param linkIds List of Link IDs to preload
     */
    const requestDownload = useCallback(
        async (linkIds: { linkId: string; shareId: string }[]) => {
            const ac = new AbortController();

            const result: { [key: string]: string[] } = {};
            for (const item of linkIds) {
                const { linkId, shareId: itemShareId } = item;
                if (!result[itemShareId]) {
                    result[itemShareId] = [];
                }
                result[itemShareId].push(linkId);
            }

            const metaLinks: DecryptedLink[] = [];
            const relatedMetaLinks: DecryptedLink[] = [];

            for (const shareId of Object.keys(result)) {
                const meta = await loadLinksMeta(ac.signal, 'photos-download', shareId, result[shareId]);

                if (meta.links.length === 0) {
                    continue;
                }

                if (meta.errors.length > 0) {
                    sendErrorReport(
                        new EnrichedError('Failed to load links meta for download', {
                            tags: {
                                shareId,
                            },
                            extra: {
                                linkIds: linkIds,
                                errors: meta.errors,
                            },
                        })
                    );

                    return;
                }

                metaLinks.push(...meta.links);

                const relatedLinkIds = metaLinks.flatMap(
                    (link) => link.activeRevision?.photo?.relatedPhotosLinkIds || []
                );

                const relatedMeta = await loadLinksMeta(ac.signal, 'photos-related-download', shareId, relatedLinkIds);

                if (relatedMeta.errors.length > 0) {
                    sendErrorReport(
                        new EnrichedError('Failed to load related links meta for download', {
                            tags: {
                                shareId,
                            },
                            extra: {
                                linkIds: linkIds,
                                errors: relatedMeta.errors,
                            },
                        })
                    );

                    return;
                }

                relatedMetaLinks.push(...relatedMeta.links);
            }

            const links: LinkDownload[] = [...metaLinks, ...relatedMetaLinks].map(
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
        },
        [shareId, albumLinkId, albumPhotos.length, albums, download, loadLinksMeta]
    );

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
        refreshSharedWithMeAlbums,
        refreshAlbumPhotos,
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
        updatePhotoFavoriteFromCache,
        addNewAlbumPhotoToCache,
        removeTagsFromPhoto,
    };
};
