import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';
import { generateNodeUid, getDriveForPhotos } from '@proton/drive';
import {
    queryAddAlbumPhotos,
    queryAlbums,
    queryDeleteAlbum,
    queryDeletePhotosShare,
    queryRemoveAlbumPhotos,
    queryRemoveTagsFromPhoto,
    querySharedWithMeAlbums,
    queryUpdateAlbumCover,
} from '@proton/shared/lib/api/drive/photos';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import type { PhotoDataForAddToAlbumPayload } from '@proton/shared/lib/interfaces/drive/photos';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import isTruthy from '@proton/utils/isTruthy';

import { type ShareWithKey, useDefaultShare, useDriveEventManager } from '../../store';
import { useDebouncedRequest } from '../../store/_api';
import { type DecryptedLink, useLink, useLinkActions, useLinksActions } from '../../store/_links';
import { useShare } from '../../store/_shares';
import { useDirectSharingInfo } from '../../store/_shares/useDirectSharingInfo';
import { useBatchHelper } from '../../store/_utils/useBatchHelper';
import { VolumeTypeForEvents, useVolumesState } from '../../store/_volumes';
import { createDebouncedBuffer } from '../../utils/createDebouncedBuffer';
import { sendErrorReport } from '../../utils/errorHandling';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { useAlbumProgressStore } from '../../zustand/photos/addToAlbumProgress.store';
import { useAlbumsStore } from '../useAlbums.store';
import { type PhotoItem, usePhotosStore } from '../usePhotos.store';
import { createPhotoItemsFromNode } from '../utils/createPhotoItemsFromNode';

export interface Album {
    Locked: boolean;
    CoverLinkID?: string;
    LastActivityTime: number;
    PhotoCount: number;
    LinkID: string;
    VolumeID: string;
    ShareID: string | null;
}

export interface DecryptedAlbum extends DecryptedLink {
    cover?: DecryptedLink;
    photoCount: number;
    permissions: {
        isOwner: boolean;
        isAdmin: boolean;
        isEditor: boolean;
    };
}

export const MAX_ADD_ALBUM_PHOTOS_BATCH = 10;
export const MAX_REMOVE_ALBUM_PHOTOS_BATCH = 10;
export const ALBUM_DECRYPT_BATCH_SIZE = 10;

/**
 *
 * TODO: Migrate to Zustand
 */
export const PhotosWithAlbumsContext = createContext<{
    shareId?: string;
    linkId?: string;
    volumeId?: string;
    volumeType: VolumeType.Photos;
    userAddressEmail?: string;
    isPhotosLoading: boolean;
    isAlbumPhotosLoading: boolean;
    albums: Map<string, DecryptedAlbum>;
    loadPhotos: (abortSignal: AbortSignal) => Promise<void>;
    initializePhotosView: (abortSignal: AbortSignal) => Promise<void>;
    addAlbumPhotos: (
        abortSignal: AbortSignal,
        albumShareId: string,
        albumLinkId: string,
        LinkIDs: string[],
        fromUpload?: boolean
    ) => Promise<string[]>;
    addPhotoAsCover: (abortSignal: AbortSignal, albumLinkId: string, coverLinkId: string) => void;
    loadAlbumPhotos: (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string) => Promise<void>;
    loadAlbums: (abortSignal: AbortSignal) => Promise<void>;
    removeAlbumsFromCache: (albumLinkIdsToRemove: Set<string>) => void;
    loadSharedWithMeAlbums: (abortSignal: AbortSignal) => Promise<void>;
    removePhotosFromCache: (linkIds: string[]) => void;
    updateAlbumsFromCache: (linkIds: string[]) => void;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
    addNewAlbumPhotoToCache: (
        abortSignal: AbortSignal,
        albumShareId: string,
        albumLinkId: string,
        photoLinkId: string
    ) => Promise<void>;
    removeAlbumPhotos: (
        abortSignal: AbortSignal,
        albumShareId: string,
        albumLinkId: string,
        LinkIDs: string[]
    ) => Promise<void>;
    deleteAlbum: (abortSignal: AbortSignal, albumLinkId: string, force: boolean) => Promise<void>;
    favoritePhoto: (
        abortSignal: AbortSignal,
        linkId: string,
        shareId: string
    ) => Promise<{ LinkID: string; shouldNotififyCopy: boolean }>;
    removeTagsFromPhoto: (abortSignal: AbortSignal, linkId: string, tags: PhotoTag[]) => Promise<void>;
    clearAlbumPhotos: () => void;
} | null>(null);

export const PhotosWithAlbumsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [photosShare, setPhotosShare] = useState<ShareWithKey>();
    const shareId = photosShare?.shareId;
    const volumeId = photosShare?.volumeId;

    const { getDefaultPhotosShare } = useDefaultShare();
    const { getPhotoCloneForAlbum, copyLinksToVolume } = useLinkActions();
    const { favoritePhotoLink } = useLinksActions();
    const request = useDebouncedRequest();
    const { batchAPIHelper } = useBatchHelper();
    const driveEventManager = useDriveEventManager();
    const [photosLoading, setIsPhotosLoading] = useState<boolean>(true);
    const [albumPhotosLoading, setIsAlbumPhotosLoading] = useState<boolean>(true);
    const [userAddressEmail, setUserAddressEmail] = useState<string>();
    const [albums, setAlbums] = useState<Map<string, DecryptedAlbum>>(new Map());
    const currentAlbumLinkId = useRef<string>();
    const { getShare, getShareCreatorKeys } = useShare();
    const { getSharePermissions, isSharedWithMe } = useDirectSharingInfo();
    const { getLink } = useLink();
    const { setVolumeShareIds } = useVolumesState();
    const eventAbortController = useRef<AbortController | undefined>(undefined);
    const albumProgress = useAlbumProgressStore();
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (volumeId === undefined) {
            return;
        }

        driveEventManager.volumes.startSubscription(volumeId, VolumeTypeForEvents.photo).catch(console.warn);
        return () => {
            driveEventManager.volumes.unsubscribe(volumeId);
        };
    }, [driveEventManager.volumes, volumeId]);

    const loadPhotos = useCallback(async (abortSignal: AbortSignal) => {
        setIsPhotosLoading(true);
        const { push, drain } = createDebouncedBuffer<PhotoItem>((items) =>
            usePhotosStore.getState().setPhotoItems(items)
        );

        try {
            for await (const photo of getDriveForPhotos().iterateTimeline(abortSignal)) {
                push({
                    nodeUid: photo.nodeUid,
                    captureTime: photo.captureTime,
                    tags: photo.tags,
                    relatedPhotoNodeUids: [],
                });
            }
            drain();
        } finally {
            setIsPhotosLoading(false);
        }
    }, []);

    const initializePhotosView = useCallback(
        async (abortSignal: AbortSignal) => {
            if (photosShare) {
                return;
            }

            const defaultPhotosShare = await getDefaultPhotosShare();

            if (!defaultPhotosShare) {
                return;
            }

            setPhotosShare(defaultPhotosShare);
            const { address } = await getShareCreatorKeys(abortSignal, defaultPhotosShare);
            setUserAddressEmail(address.Email);
        },

        [
            // Unstable dependencies:
            // getShareCreatorKeys,
            photosShare,
        ]
    );

    const loadAlbumPhotos = useCallback(
        async (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string) => {
            if (!volumeId) {
                return;
            }
            currentAlbumLinkId.current = albumLinkId;
            setIsAlbumPhotosLoading(true);

            const { push, drain } = createDebouncedBuffer<PhotoItem>((items) => {
                const store = usePhotosStore.getState();
                for (const item of items) {
                    store.setPhotoItemWithoutTimeline(item);
                }
                useAlbumsStore.getState().addPhotoNodeUids(items.map((item) => item.nodeUid));
            });

            try {
                let albumVolumeId = volumeId;
                if (albumShareId !== undefined && shareId !== albumShareId) {
                    const share = await getShare(abortSignal, albumShareId);
                    albumVolumeId = share.volumeId;
                }

                for await (const albumPhoto of getDriveForPhotos().iterateAlbum(
                    generateNodeUid(albumVolumeId, albumLinkId),
                    abortSignal
                )) {
                    push({
                        nodeUid: albumPhoto.nodeUid,
                        captureTime: albumPhoto.captureTime,
                        tags: [],
                        relatedPhotoNodeUids: [],
                    });
                }
                drain();
            } finally {
                setIsAlbumPhotosLoading(false);
            }
        },
        [volumeId, shareId]
    );

    // TODO: this is not working - not called in the right place + not cleaning properly as it should
    const cleanupObsoleteAlbums = (newAlbumsLinkIds: Set<string>) => {
        if (newAlbumsLinkIds.size) {
            setAlbums((prevAlbums) => {
                const newAlbums = new Map(prevAlbums);
                prevAlbums.forEach((album) => {
                    if (!newAlbumsLinkIds.has(album.linkId)) {
                        newAlbums.delete(album.linkId);
                    }
                });
                return newAlbums;
            });
        }
    };

    const removeAlbumsFromCache = (albumLinkIdsToRemove: Set<string>) => {
        setAlbums((prevAlbums) => {
            const newAlbums = new Map(prevAlbums);
            albumLinkIdsToRemove.forEach((albumLinkId) => {
                newAlbums.delete(albumLinkId);
            });
            return newAlbums;
        });
    };

    const loadAlbums = useCallback(
        async (abortSignal: AbortSignal) => {
            const newAlbumsLinkIds = new Set<string>();
            const albumCall = async (anchorID?: string) => {
                if (!volumeId || !shareId) {
                    return;
                }
                const { Albums, Code, AnchorID, More } = await request<{
                    Albums: Album[];
                    Code: number;
                    AnchorID: string;
                    More: boolean;
                }>(
                    queryAlbums(volumeId, {
                        AnchorID: anchorID,
                    }),
                    abortSignal
                );
                if (Code === 1000) {
                    for (let i = 0; i < Albums.length; i += ALBUM_DECRYPT_BATCH_SIZE) {
                        const batch = Albums.slice(i, i + ALBUM_DECRYPT_BATCH_SIZE);
                        const batchResults = await Promise.all(
                            batch.map(async (album) => {
                                try {
                                    const [link, cover] = await Promise.all([
                                        getLink(abortSignal, shareId, album.LinkID),
                                        album.CoverLinkID
                                            ? getLink(abortSignal, shareId, album.CoverLinkID).catch((e) => {
                                                  sendErrorReport(e);
                                                  return undefined;
                                              })
                                            : Promise.resolve(undefined),
                                    ]);
                                    return {
                                        ...link,
                                        albumProperties: link.albumProperties
                                            ? { ...link.albumProperties, coverLinkId: album.CoverLinkID }
                                            : link.albumProperties,
                                        cover: cover,
                                        photoCount: album.PhotoCount,
                                        permissions: {
                                            isOwner: true,
                                            isAdmin: true,
                                            isEditor: true,
                                        },
                                    };
                                } catch (e) {
                                    sendErrorReport(e);
                                }
                            })
                        );

                        setAlbums((prevAlbums) => {
                            const newAlbums = new Map(prevAlbums);
                            batchResults.forEach((album) => {
                                if (album !== undefined) {
                                    newAlbums.set(album.linkId, album as DecryptedAlbum);
                                    newAlbumsLinkIds.add(album.linkId);
                                }
                            });
                            return newAlbums;
                        });
                    }

                    // there is a limit of 500 albums so should actually never happen technically
                    if (More) {
                        void albumCall(AnchorID);
                    }
                }
            };
            cleanupObsoleteAlbums(newAlbumsLinkIds);
            return albumCall();
        },
        [getLink, request, shareId, volumeId]
    );

    const loadSharedWithMeAlbums = useCallback(
        async (abortSignal: AbortSignal, refresh?: boolean) => {
            const newAlbumsLinkIds = new Set<string>();
            const sharedWithMeCall = async (anchorID?: string) => {
                if (!volumeId || !shareId) {
                    return;
                }
                const { Albums, Code, AnchorID, More } = await request<{
                    Albums: Album[];
                    Code: number;
                    AnchorID: string;
                    More: boolean;
                }>(
                    querySharedWithMeAlbums({
                        AnchorID: anchorID,
                    }),
                    abortSignal
                );
                if (Code === 1000) {
                    const results: DecryptedAlbum[] = [];
                    for (let i = 0; i < Albums.length; i += ALBUM_DECRYPT_BATCH_SIZE) {
                        const batch = Albums.slice(i, i + ALBUM_DECRYPT_BATCH_SIZE);
                        const batchResults = await Promise.all(
                            batch.map(async (album) => {
                                try {
                                    if (album.ShareID === null) {
                                        return;
                                    }
                                    // Update share cache
                                    if (refresh) {
                                        await getShare(abortSignal, album.ShareID, refresh);
                                    }
                                    const [link, cover] = await Promise.all([
                                        getLink(abortSignal, album.ShareID, album.LinkID),
                                        album.CoverLinkID
                                            ? getLink(abortSignal, album.ShareID, album.CoverLinkID).catch((e) => {
                                                  sendErrorReport(e);
                                                  return undefined;
                                              })
                                            : Promise.resolve(undefined),
                                    ]);
                                    const permissions = await getSharePermissions(abortSignal, link.rootShareId);
                                    const sharedWithMe = await isSharedWithMe(abortSignal, link.rootShareId);
                                    setVolumeShareIds(album.VolumeID, [album.ShareID]);
                                    return {
                                        ...link,
                                        cover: cover,
                                        photoCount: album.PhotoCount,
                                        permissions: {
                                            isOwner: !sharedWithMe,
                                            isAdmin: getCanAdmin(permissions),
                                            isEditor: getCanWrite(permissions),
                                        },
                                    };
                                } catch (e) {
                                    sendErrorReport(e);
                                }
                            })
                        );
                        results.push(...batchResults.filter(isTruthy));
                    }

                    setAlbums((prevAlbums) => {
                        const newAlbums = new Map(
                            Array.from(prevAlbums.entries()).filter(([, album]) => {
                                // Filter out albums that are not in the current volume,
                                // that is only own albums. All new shared albums will be
                                // set via results.
                                return album.volumeId === volumeId;
                            })
                        );
                        results.forEach((album) => {
                            if (album !== undefined) {
                                newAlbums.set(album.linkId, album);
                                newAlbumsLinkIds.add(album.linkId);
                            }
                        });
                        return newAlbums;
                    });

                    if (More) {
                        void sharedWithMeCall(AnchorID);
                    }
                }
            };
            cleanupObsoleteAlbums(newAlbumsLinkIds);
            return sharedWithMeCall();
        },
        [getLink, request, shareId, volumeId, getSharePermissions]
    );

    useEffect(() => {
        const unsubscribe = driveEventManager.eventHandlers.subscribeToCore((event) => {
            if (event.DriveShareRefresh?.Action === 2) {
                if (eventAbortController.current) {
                    eventAbortController.current.abort();
                }
                eventAbortController.current = new AbortController();
                loadSharedWithMeAlbums(eventAbortController.current.signal, true).catch(sendErrorReport);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [loadSharedWithMeAlbums, driveEventManager.eventHandlers]);

    const getAlbumPhotoFromLink = (link: DecryptedLink) => {
        if (!link.activeRevision?.photo) {
            return undefined;
        }

        return {
            linkId: link.linkId,
            captureTime: link.activeRevision.photo.captureTime,
            hash: link.activeRevision.photo.hash,
            contentHash: link.activeRevision.photo.contentHash,
            tags: link.photoProperties?.tags || [],
            relatedPhotos: [] as { linkId: string; captureTime: number; hash?: string; contentHash?: string }[],
            parentLinkId: link.parentLinkId,
            rootShareId: link.rootShareId,
            volumeId: link.volumeId,
        };
    };

    const getPayloadDataAndPreloadPhotoLinks = useCallback(
        async (
            abortSignal: AbortSignal,
            albumShareId: string,
            albumLinkId: string,
            shareId: string,
            linkIDs: string[]
        ) => {
            const linksInfoForAlbum = new Map<
                string,
                {
                    payload: PhotoDataForAddToAlbumPayload;
                    albumPhoto: ReturnType<typeof getAlbumPhotoFromLink>;
                }
            >();

            const updateMainPhotoWithRelatedInfo = (mainPhotoLinkId: string, relatedLink: DecryptedLink) => {
                const mainPhotoInfo = linksInfoForAlbum.get(mainPhotoLinkId);
                if (mainPhotoInfo && relatedLink.activeRevision?.photo) {
                    const relatedPhotoInfo = {
                        linkId: relatedLink.linkId,
                        captureTime: relatedLink.activeRevision.photo.captureTime,
                        hash: relatedLink.activeRevision.photo.hash,
                        contentHash: relatedLink.activeRevision.photo.contentHash,
                    };

                    linksInfoForAlbum.set(mainPhotoLinkId, {
                        payload: mainPhotoInfo.payload,
                        albumPhoto: mainPhotoInfo.albumPhoto
                            ? {
                                  ...mainPhotoInfo.albumPhoto,
                                  relatedPhotos: [...(mainPhotoInfo.albumPhoto?.relatedPhotos || []), relatedPhotoInfo],
                              }
                            : undefined,
                    });
                }
            };

            const addPhotoToInfoMap = async (link: DecryptedLink, mainPhotoLinkId?: string) => {
                const { Hash, Name, NodePassphrase } = await getPhotoCloneForAlbum(
                    abortSignal,
                    albumShareId,
                    link.rootShareId,
                    albumLinkId,
                    link.linkId
                );

                if (mainPhotoLinkId && link.activeRevision?.photo) {
                    updateMainPhotoWithRelatedInfo(mainPhotoLinkId, link);
                }

                linksInfoForAlbum.set(link.linkId, {
                    // TODO: payload doesnt include NodePassphraseSignature and SignatureEmail
                    // for anoanymous photos. Public sharing is not supported yet, so that is
                    // fine, but must be implemented once enabled.
                    payload: {
                        LinkID: link.linkId,
                        Hash,
                        Name,
                        NodePassphrase,
                        NameSignatureEmail: link.nameSignatureEmail,
                        ContentHash: link.activeRevision?.photo?.contentHash,
                    },
                    albumPhoto: !mainPhotoLinkId ? getAlbumPhotoFromLink(link) : undefined,
                });
            };
            const processPhotoLink = async (linkId: string) => {
                const link = await getLink(abortSignal, shareId, linkId);
                await addPhotoToInfoMap(link);
                if (link.activeRevision?.photo?.relatedPhotosLinkIds?.length) {
                    const relatedPhotosQueue = link.activeRevision.photo.relatedPhotosLinkIds.map(
                        (relatedPhotoLinkId) => async () => {
                            const relatedPhotoLink = await getLink(abortSignal, shareId, relatedPhotoLinkId);
                            await addPhotoToInfoMap(relatedPhotoLink, link.linkId);
                        }
                    );
                    await runInQueue(relatedPhotosQueue, MAX_THREADS_PER_REQUEST);
                }
            };
            albumProgress.setStatus('in-progress');
            albumProgress.setTotal(linkIDs.length);
            const queue = linkIDs.map((linkId) => async () => {
                albumProgress.incrementAdded();
                if (abortSignal.aborted) {
                    return;
                }
                await processPhotoLink(linkId);
            });

            await runInQueue(queue, MAX_THREADS_PER_REQUEST);
            return linksInfoForAlbum;
        },
        [getLink, getPhotoCloneForAlbum]
    );

    const addPhotosToAlbumInBatches = useCallback(
        async (
            abortSignal: AbortSignal,
            volumeId: string,
            albumLinkId: string,
            linksInfoForAlbum: Map<
                string,
                {
                    payload: PhotoDataForAddToAlbumPayload;
                    albumPhoto: ReturnType<typeof getAlbumPhotoFromLink>;
                }
            >
        ) => {
            const addedLinkIds: string[] = [];

            const result = await batchAPIHelper(abortSignal, {
                linkIds: [...linksInfoForAlbum.keys()],
                batchRequestSize: MAX_ADD_ALBUM_PHOTOS_BATCH,
                ignoredCodes: [API_CUSTOM_ERROR_CODES.ALREADY_EXISTS, API_CUSTOM_ERROR_CODES.INVALID_REQUIREMENT],
                query: async (batchLinkIds) => {
                    const linksPayloads = [];
                    for (const linkId of batchLinkIds) {
                        if (addedLinkIds.includes(linkId)) {
                            continue;
                        }
                        const linkInfo = linksInfoForAlbum.get(linkId);
                        if (linkInfo) {
                            linksPayloads.push(linkInfo.payload);
                            addedLinkIds.push(linkId);

                            // All the related photos must be together with the main
                            // photo in one batch request.
                            // Backend has high limit of batch size, so we can simply
                            // include all related photos in the payload.
                            // It would be good to improve this in the future to avoid
                            // creating huge payloads by sending just one photo with
                            // all related photos in one request if its more than the
                            // batch size.
                            linkInfo.albumPhoto?.relatedPhotos.forEach((relatedPhoto) => {
                                const relatedLinkInfo = linksInfoForAlbum.get(relatedPhoto.linkId);
                                if (relatedLinkInfo) {
                                    linksPayloads.push(relatedLinkInfo.payload);
                                    addedLinkIds.push(relatedPhoto.linkId);
                                }
                            });
                        }
                    }

                    if (linksPayloads.length) {
                        return queryAddAlbumPhotos(volumeId, albumLinkId, {
                            AlbumData: linksPayloads,
                        });
                    }
                },
            });
            albumProgress.setStatus('done');
            return {
                successes: result.successes,
                failures: result.failures,
            };
        },
        [batchAPIHelper]
    );

    const showNotifications = useCallback(
        (
            result: { successes: string[]; failures: Record<string, any> },
            albumName: string,
            // Prevent showing notification and call loadAlbumPhotos per upload when uploading directly
            fromUpload: boolean = false,
            mainlinkIds: string[]
        ) => {
            const nbFailures = Object.keys(result.failures).length;
            const nbSuccesses = result.successes.length;
            const nbMainPhotosError = Object.keys(result.failures).filter((linkId) =>
                mainlinkIds.includes(linkId)
            ).length;
            const nbMainPhotosSuccess = result.successes.filter((linkId) => mainlinkIds.includes(linkId)).length;

            if (nbFailures) {
                createNotification({
                    type: 'error',
                    text: c('Notification').ngettext(
                        msgid`${nbMainPhotosError} photo could not be added to "${albumName}"`,
                        `${nbMainPhotosError} photos could not be added to "${albumName}"`,
                        nbMainPhotosError
                    ),
                    preWrap: true,
                });
            } else if (nbSuccesses && !fromUpload) {
                createNotification({
                    type: 'success',
                    text: c('Notification').ngettext(
                        msgid`${nbMainPhotosSuccess} photo have been added to "${albumName}"`,
                        `${nbMainPhotosSuccess} photos have been added to "${albumName}"`,
                        nbMainPhotosSuccess
                    ),
                    preWrap: true,
                });
            } else if (!fromUpload) {
                createNotification({
                    type: 'info',
                    text: c('Notification').t`Selected photo(s) already in "${albumName}"`,
                    preWrap: true,
                });
            }
        },
        [createNotification]
    );

    const addNewAlbumPhotoToCache = useCallback(
        async (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string, photoLinkId: string) => {
            const album = albums.get(albumLinkId);
            const albumVolumeId = album?.volumeId || volumeId;
            if (!albumVolumeId) {
                return;
            }
            const photoNodeUid = generateNodeUid(albumVolumeId, photoLinkId);
            const maybeNode = await getDriveForPhotos().getNode(photoNodeUid);
            const { node, photoAttributes } = getNodeEntity(maybeNode);
            if (!photoAttributes) {
                return;
            }
            const photoItem: PhotoItem = {
                nodeUid: node.uid,
                captureTime: photoAttributes.captureTime,
                tags: photoAttributes.tags,
                relatedPhotoNodeUids: [],
            };
            usePhotosStore.getState().setPhotoItemWithoutTimeline(photoItem);
            useAlbumsStore.getState().addPhotoNodeUid(node.uid);
            setAlbums((currentAlbums) => {
                const newAlbums = new Map(currentAlbums);
                const album = newAlbums.get(albumLinkId);
                if (!album) {
                    return newAlbums;
                }
                album.photoCount = album.photoCount + 1;
                return newAlbums;
            });
        },
        [albums, volumeId]
    );

    const addAlbumPhotos = useCallback(
        async (
            abortSignal: AbortSignal,
            albumShareId: string,
            albumLinkId: string,
            linkIds: string[],
            fromUpload: boolean = false
        ): Promise<string[]> => {
            if (!shareId || !volumeId) {
                throw new Error('Photo volume or share not found');
            }

            const link = await getLink(abortSignal, albumShareId, albumLinkId);
            const { name: albumName } = link;

            // If we add into own album, we use add-multiple
            const shouldAdd = link.volumeId === volumeId;
            // If we add into shared album we must use copy
            const shouldCopy = !shouldAdd;

            const linksInfoForAlbum = await getPayloadDataAndPreloadPhotoLinks(
                abortSignal,
                albumShareId,
                albumLinkId,
                shareId,
                linkIds
            );

            if (!linksInfoForAlbum) {
                throw new Error('Photo share not found');
            }

            let result: { successes: string[]; failures: { [linkId: string]: string | undefined } } = {
                successes: [],
                failures: {},
            };

            if (shouldCopy) {
                result = await copyLinksToVolume(
                    abortSignal,
                    shareId,
                    linkIds,
                    link.volumeId,
                    albumShareId,
                    albumLinkId
                );
            } else {
                // TODO: Move this an action too, like copyLinksToVolume
                // This action add photos from same volume to an album using add-multiple endpoint
                result = await addPhotosToAlbumInBatches(abortSignal, link.volumeId, albumLinkId, linksInfoForAlbum);
            }

            const nbSuccesses = result.successes.length;

            setAlbums((currentAlbums) => {
                const newAlbums = new Map(currentAlbums);
                const album = newAlbums.get(albumLinkId);
                if (!album) {
                    return newAlbums;
                }
                album.photoCount = album.photoCount + nbSuccesses;
                return newAlbums;
            });

            // In case of directUpload we can skip loadAlbumsPhotos as photos will already be decrypted.
            // We just need to add them to the list
            // For other cases, it's safer to loadAlbumPhotos (request to API) to prevent new photos loading issues
            if (fromUpload) {
                if (currentAlbumLinkId.current === albumLinkId) {
                    const store = usePhotosStore.getState();
                    const albumStore = useAlbumsStore.getState();
                    const missingNodeUids: string[] = [];
                    for (const successLinkId of result.successes) {
                        const photoNodeUid = generateNodeUid(volumeId, successLinkId);
                        const existing = store.getPhotoItem(photoNodeUid);
                        if (existing) {
                            albumStore.addPhotoNodeUid(photoNodeUid);
                        } else {
                            missingNodeUids.push(photoNodeUid);
                        }
                    }
                    if (missingNodeUids.length) {
                        const photoItems = await createPhotoItemsFromNode(missingNodeUids);
                        if (photoItems) {
                            store.setPhotoItems(photoItems);
                            albumStore.addPhotoNodeUids(photoItems.map((item) => item.nodeUid));
                        }
                    }
                    // Reload albums to reload cover of current album - first photo is automatically set as cover.
                    if (albumStore.currentAlbum?.photoNodeUids.size === 0) {
                        void loadAlbums(abortSignal);
                    }
                }
            } else {
                void loadAlbumPhotos(abortSignal, albumShareId, albumLinkId);
                showNotifications(result, albumName, fromUpload, linkIds);
                // Reload albums to reload cover of current album - first photo is automatically set as cover.
                if (useAlbumsStore.getState().currentAlbum?.photoNodeUids.size === 0) {
                    void loadAlbums(abortSignal);
                }
            }
            return result.successes;
        },
        [
            shareId,
            volumeId,
            getLink,
            getPayloadDataAndPreloadPhotoLinks,
            addPhotosToAlbumInBatches,
            showNotifications,
            loadAlbumPhotos,
            loadAlbums,
        ]
    );

    const favoritePhoto = useCallback(
        async (
            abortSignal: AbortSignal,
            linkId: string,
            shareId: string
        ): Promise<{ LinkID: string; shouldNotififyCopy: boolean }> => {
            if (!photosShare || !photosShare.shareId) {
                throw new Error('Photo share not found');
            }

            return favoritePhotoLink(abortSignal, {
                shareId,
                linkId,
                newShareId: photosShare.shareId,
                newParentLinkId: photosShare.rootLinkId,
            });
        },
        [albums, favoritePhotoLink, photosShare]
    );

    const removeTagsFromPhoto = useCallback(
        async (abortSignal: AbortSignal, linkId: string, tags: PhotoTag[]) => {
            if (!volumeId) {
                throw new Error('Photo volume not found');
            }
            const removeTagsFromPhoto = async () => {
                const response = await request<{
                    Code: number;
                }>(
                    queryRemoveTagsFromPhoto(volumeId, linkId, {
                        Tags: tags,
                    }),
                    abortSignal
                );
                if (response.Code !== 1000) {
                    throw new Error('Failed to remove tag from photo');
                }
            };
            return removeTagsFromPhoto();
        },
        [request, volumeId]
    );

    const updateAlbumsFromCache = useCallback(
        async (linkIds: string[]) => {
            if (!shareId) {
                return;
            }

            const updatedAlbums = await Promise.all(
                linkIds.map(async (linkId) => {
                    try {
                        const abortSignal = new AbortController().signal;
                        // Use setState updater to get the latest albums state
                        // This avoid concurrency issues since this is event based
                        const album = await new Promise<DecryptedAlbum | undefined>((resolve) => {
                            setAlbums((currentAlbums) => {
                                const album = currentAlbums.get(linkId);
                                resolve(album);
                                return currentAlbums;
                            });
                        });

                        if (!album) {
                            return undefined;
                        }

                        const [link, cover] = await Promise.all([
                            getLink(abortSignal, shareId, linkId),
                            album.cover?.linkId
                                ? getLink(abortSignal, shareId, album.cover?.linkId).catch((e) => {
                                      sendErrorReport(e);
                                      return undefined;
                                  })
                                : Promise.resolve(undefined),
                        ]);

                        const permissions = await getSharePermissions(abortSignal, link.rootShareId);
                        const sharedWithMe = await isSharedWithMe(abortSignal, link.rootShareId);

                        return {
                            linkId,
                            update: {
                                ...link,
                                cover: cover,
                                photoCount: album.photoCount,
                                permissions: {
                                    isOwner: !sharedWithMe,
                                    isAdmin: getCanAdmin(permissions),
                                    isEditor: getCanWrite(permissions),
                                },
                            },
                        };
                    } catch (error) {
                        sendErrorReport(error);
                    }
                })
            );

            setAlbums((currentAlbums) => {
                const newAlbums = new Map(currentAlbums);
                updatedAlbums.forEach((result) => {
                    if (result) {
                        newAlbums.set(result.linkId, result.update);
                    }
                });
                return newAlbums;
            });
        },
        [shareId, getLink, getSharePermissions]
    );

    const addPhotoAsCover = useCallback(
        async (abortSignal: AbortSignal, albumLinkId: string, coverLinkId: string) => {
            if (!volumeId) {
                throw new Error('Photo volume not found');
            }
            if (!shareId) {
                throw new Error('Photo share not found');
            }
            const addPhotoAsCoverCall = async () => {
                const response = await request<{
                    Code: number;
                }>(
                    queryUpdateAlbumCover(volumeId, albumLinkId, {
                        CoverLinkID: coverLinkId,
                    }),
                    abortSignal
                );
                if (response.Code !== 1000) {
                    throw new Error('Failed to set album cover');
                }
            };
            await addPhotoAsCoverCall();
            useAlbumsStore.getState().setCoverNodeUid(generateNodeUid(volumeId, coverLinkId));
            setAlbums((currentAlbums) => {
                const newAlbums = new Map(currentAlbums);
                const album = newAlbums.get(albumLinkId);
                if (!album) {
                    return newAlbums;
                }
                newAlbums.set(albumLinkId, {
                    ...album,
                    albumProperties: album.albumProperties ? { ...album.albumProperties, coverLinkId } : undefined,
                });
                return newAlbums;
            });
        },
        [request, volumeId]
    );

    // TODO: Remove that once we removed the old PhotosStore
    const removePhotosFromCache = useCallback((_: string[]) => {}, []);

    const deletePhotosShare = useCallback(
        async (volumeId: string, shareId: string): Promise<void> => {
            await request(queryDeletePhotosShare(volumeId, shareId));
        },
        [request]
    );

    const deleteAlbum = useCallback(
        async (abortSignal: AbortSignal, albumLinkId: string, force: boolean): Promise<void> => {
            if (!volumeId) {
                return;
            }
            await request(queryDeleteAlbum(volumeId, albumLinkId, { DeleteAlbumPhotos: force ? 1 : 0 }), abortSignal);
            setAlbums((prevAlbums) => {
                const newAlbums = new Map(prevAlbums);
                newAlbums.delete(albumLinkId);
                return newAlbums;
            });
        },
        [request, volumeId]
    );

    const removeAlbumPhotos = useCallback(
        async (
            abortSignal: AbortSignal,
            albumShareId: string,
            albumLinkId: string,
            LinkIDs: string[]
        ): Promise<void> => {
            const albumLink = await getLink(abortSignal, albumShareId, albumLinkId);

            const result = await batchAPIHelper(abortSignal, {
                linkIds: LinkIDs,
                batchRequestSize: MAX_REMOVE_ALBUM_PHOTOS_BATCH,
                query: (batchLinkIds) =>
                    queryRemoveAlbumPhotos(albumLink.volumeId, albumLinkId, {
                        LinkIDs: batchLinkIds,
                    }),
            });

            const nbFailures = Object.keys(result.failures).length;
            const nbSuccesses = result.successes.length;
            if (nbFailures) {
                createNotification({
                    type: 'error',
                    text: c('Notification').ngettext(
                        msgid`${nbFailures} photo could not be removed from "${albumLink.name}"`,
                        `${nbFailures} photos could not be removed from "${albumLink.name}"`,
                        nbFailures
                    ),
                    preWrap: true,
                });
            }
            if (nbSuccesses) {
                createNotification({
                    type: 'success',
                    text: c('Notification').ngettext(
                        msgid`${nbSuccesses} photo have been removed from "${albumLink.name}"`,
                        `${nbSuccesses} photos have been removed from "${albumLink.name}"`,
                        nbSuccesses
                    ),
                    preWrap: true,
                });
            }

            useAlbumsStore
                .getState()
                .removePhotoNodeUids(result.successes.map((linkId) => generateNodeUid(albumLink.volumeId, linkId)));
            setAlbums((currentAlbums) => {
                const newAlbums = new Map(currentAlbums);
                const album = newAlbums.get(albumLinkId);
                if (!album) {
                    return newAlbums;
                }
                album.photoCount = album.photoCount - nbSuccesses;
                if (album.photoCount === 0) {
                    album.cover = undefined;
                }
                return newAlbums;
            });
        },
        [getLink, batchAPIHelper, createNotification]
    );

    const clearAlbumPhotos = useCallback(() => {
        useAlbumsStore.getState().clearCurrentAlbum();
    }, []);

    return (
        <PhotosWithAlbumsContext.Provider
            value={{
                shareId: photosShare?.shareId,
                linkId: photosShare?.rootLinkId,
                volumeId: photosShare?.volumeId,
                volumeType: VolumeType.Photos,
                isPhotosLoading: photosLoading,
                isAlbumPhotosLoading: albumPhotosLoading,
                albums,
                addAlbumPhotos,
                addPhotoAsCover,
                loadAlbumPhotos,
                loadAlbums,
                loadSharedWithMeAlbums,
                loadPhotos,
                initializePhotosView,
                removeAlbumsFromCache,
                addNewAlbumPhotoToCache,
                removePhotosFromCache,
                updateAlbumsFromCache,
                deletePhotosShare,
                removeAlbumPhotos,
                deleteAlbum,
                favoritePhoto,
                removeTagsFromPhoto,
                userAddressEmail,
                clearAlbumPhotos,
            }}
        >
            {children}
        </PhotosWithAlbumsContext.Provider>
    );
};

export function usePhotosWithAlbums() {
    const state = useContext(PhotosWithAlbumsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized PhotosWithAlbumsProvider');
    }
    return state;
}
