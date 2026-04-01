import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive/index';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

import { useFlagsDriveSDKTransfer } from '../../flags/useFlagsDriveSDKTransfer';
import { DownloadManager } from '../../managers/download/DownloadManager';
import type { LinkDownload } from '../../store/_downloads';
import { useDownloadProvider } from '../../store/_downloads';
import type { DriveEvent, DriveEvents } from '../../store/_events';
import { useDriveEventManager } from '../../store/_events';
import { type DecryptedLink, useLinksListing } from '../../store/_links';
import useLinksState from '../../store/_links/useLinksState';
import { isPhotoGroup, sortWithCategories as legacySortWithCategories } from '../../store/_photos';
import type { PhotoLink } from '../../store/_photos';
import { useAbortSignal, useMemoArrayNoMatterTheOrder } from '../../store/_views/utils';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { AlbumsPageTypes, usePhotoLayoutStore } from '../../zustand/photos/layout.store';
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
    const eventsManager = useDriveEventManager();
    const { getCachedChildren, loadLinksMeta } = useLinksListing();
    const isSDKTransferEnabled = useFlagsDriveSDKTransfer({ isForPhotos: true });
    const linkState = useLinksState();
    const {
        shareId,
        linkId,
        isPhotosLoading,
        isAlbumPhotosLoading,
        volumeId,
        albums,
        loadPhotos,
        initializePhotosView,
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
        addNewAlbumPhotoToCache,
        removeTagsFromPhoto,
        clearAlbumPhotos,
    } = usePhotosWithAlbums();

    const albumPhotoUids = useAlbumsStore(
        (state): Set<string> => state.currentAlbum?.photoNodeUids ?? new Set<string>()
    );

    const [selectedTags, setSelectedTags] = useState([-1]);
    const processedEventIds = useRef<Set<string>>(new Set());
    const { currentPageType } = usePhotoLayoutStore(
        useShallow((state) => ({
            currentPageType: state.currentPageType,
        }))
    );
    const { download } = useDownloadProvider();
    const [isAlbumsLoading, setIsAlbumsLoading] = useState<boolean>(true);
    const photos = usePhotosStore(useShallow((state) => state.photoItems));
    const photoTimelineUids = usePhotosStore(useShallow((state) => state.photoTimelineUids));

    // Initialize the Photos shareId in LinksState so events can properly update it
    // This fixes the issue where the first photo uploaded to an empty photos view doesn't appear:
    // - Without this, when upload events arrive, LinksState doesn't recognize the Photos shareId
    // - The event gets skipped (returns old state without adding the new photo)
    // - The UI never updates to show the newly uploaded photo
    // We must load at least the root link because addOrUpdate returns early with empty arrays
    // Only do this when photos list is empty to avoid unnecessary API calls
    const initializedShareRef = useRef<string | null>(null);
    useEffect(() => {
        if (volumeId && shareId && linkId && initializedShareRef.current !== shareId && photos.size === 0) {
            void loadLinksMeta(new AbortController().signal, 'photos-init', shareId, [linkId]);
            initializedShareRef.current = shareId;
        }
    }, [volumeId, shareId, linkId, loadLinksMeta, photos.size]);

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
        photoNodeUidToIndexMap,
        photoNodeUids,
        isPhotosEmpty,
    }: {
        photosViewData: (MappedPhotoItem | string)[];
        photoNodeUidToIndexMap: Record<string, number>;
        photoNodeUids: string[];
        isPhotosEmpty: boolean;
    } = useMemo(() => {
        if (!shareId || !linkId || !volumeId) {
            return {
                photosViewData: [],
                photoNodeUidToIndexMap: {},
                photoNodeUids: [],
                isPhotosEmpty: true,
            };
        }

        const isPhotosEmpty = photoTimelineUids.size === 0 && !isPhotosLoading;
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
            isPhotosEmpty,
        };
    }, [photos, photoTimelineUids, linkId, shareId, volumeId, selectedTags, isPhotosLoading]);

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

    const albumsView = useMemo(() => {
        if (!albums || !albums.size) {
            return Array.from(albums.values());
        }
        const albumsView = Array.from(albums.values()).map((album) => {
            const cachedAlbum = linkState.getLink(album.rootShareId, album.linkId);
            return {
                ...album,
                ...cachedAlbum?.decrypted,
                // Preserve albumProperties from albums state — linkState may have stale coverLinkId
                albumProperties: album.albumProperties,
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
    }, [volumeId, shareId, albumLinkId, albumShareId, currentPageType]);

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
            const album = albumLinkId && links.length === albumPhotoUids.size ? albums.get(albumLinkId) : undefined;
            if (isSDKTransferEnabled) {
                // NOTE: only need metaLinks since the DownloadManager will hydrate the related photos
                const nodeUids = metaLinks.map((link) => generateNodeUid(link.volumeId, link.linkId));
                await DownloadManager.getInstance().downloadPhotos(nodeUids, album?.name);
            } else {
                await download(links, {
                    zipName: album?.name ? `${album?.name}.zip` : undefined,
                });
            }
        },
        [albumLinkId, albumPhotoUids.size, albums, download, loadLinksMeta, isSDKTransferEnabled]
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
        },
        [isPhotosLoading]
    );

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
        addNewAlbumPhotoToCache,
        removeTagsFromPhoto,
        initializePhotosView,
    };
};
