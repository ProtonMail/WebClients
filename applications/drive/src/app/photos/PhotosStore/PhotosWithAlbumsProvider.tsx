import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';
import {
    queryAddAlbumPhotos,
    queryAlbumPhotos,
    queryAlbums,
    queryDeleteAlbum,
    queryDeletePhotosShare,
    queryPhotos,
    queryRemoveAlbumPhotos,
    queryRemoveTagsFromPhoto,
    querySharedWithMeAlbums,
    queryUpdateAlbumCover,
} from '@proton/shared/lib/api/drive/photos';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import { getCanAdmin, getCanWrite, getIsOwner } from '@proton/shared/lib/drive/permissions';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import type { PhotoDataForAddToAlbumPayload, PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import isTruthy from '@proton/utils/isTruthy';

import { type AlbumPhoto, type Photo, type ShareWithKey, useDefaultShare, useDriveEventManager } from '../../store';
import { decryptedLinkToPhotos, photoPayloadToPhotos, useDebouncedRequest } from '../../store/_api';
import { type DecryptedLink, useLink, useLinkActions, useLinksActions } from '../../store/_links';
import useLinksState from '../../store/_links/useLinksState';
import { useShare } from '../../store/_shares';
import { useDirectSharingInfo } from '../../store/_shares/useDirectSharingInfo';
import { useBatchHelper } from '../../store/_utils/useBatchHelper';
import { VolumeTypeForEvents, useVolumesState } from '../../store/_volumes';
import { sendErrorReport } from '../../utils/errorHandling';
import { useAlbumProgressStore } from '../../zustand/photos/addToAlbumProgress.store';

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
    photos: Photo[];
    albumPhotos: AlbumPhoto[];
    albums: Map<string, DecryptedAlbum>;
    loadPhotos: (abortSignal: AbortSignal, tags?: PhotoTag[]) => Promise<void>;
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
    updatePhotoFavoriteFromCache: (linkId: string, isFavorite: boolean) => void;
    addNewAlbumPhotoToCache: (
        abortSignal: AbortSignal,
        albumShareId: string,
        albumLinkId: string,
        linkId: string
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
    const { batchAPIHelper, batchPromiseHelper } = useBatchHelper();
    const driveEventManager = useDriveEventManager();
    const [photosLoading, setIsPhotosLoading] = useState<boolean>(true);
    const [albumPhotosLoading, setIsAlbumPhotosLoading] = useState<boolean>(true);
    const [userAddressEmail, setUserAddressEmail] = useState<string>();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [albums, setAlbums] = useState<Map<string, DecryptedAlbum>>(new Map());
    const currentAlbumLinkId = useRef<string>();
    const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([]);
    const { getShare, getShareCreatorKeys } = useShare();
    const { getSharePermissions } = useDirectSharingInfo();
    const { getLink } = useLink();
    const { updatePhotoLinkTags } = useLinksState();
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

    const loadPhotos = useCallback(
        async (abortSignal: AbortSignal, tags?: PhotoTag[]) => {
            if (!volumeId || !shareId) {
                return;
            }
            const photoCall = async (lastLinkId?: string, tag?: PhotoTag) => {
                const { Photos, Code } = await request<{ Photos: PhotoPayload[]; Code: number }>(
                    queryPhotos(volumeId, {
                        PreviousPageLastLinkID: lastLinkId,
                        Tag: tag,
                    }),
                    abortSignal
                );
                if (Code === 1000 && !!Photos.length) {
                    const photosData = Photos.map(photoPayloadToPhotos);

                    setPhotos((prevPhotos) => {
                        const newPhotos = photosData.filter(
                            (newPhoto) => !prevPhotos.some((prevPhoto) => prevPhoto.linkId === newPhoto.linkId)
                        );
                        return [...prevPhotos, ...newPhotos];
                    });

                    void photoCall(photosData[photosData.length - 1].linkId);
                } else {
                    setIsPhotosLoading(false);
                }
            };

            setIsPhotosLoading(true);
            if (tags) {
                tags.forEach((tag) => {
                    void photoCall(undefined, tag);
                });
            } else {
                void photoCall();
            }
        },
        [request, shareId, volumeId]
    );

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

            await loadPhotos(abortSignal);
        },
        [
            // Unstable dependencies:
            // getShareCreatorKeys,
            loadPhotos,
            photosShare,
        ]
    );

    const loadAlbumPhotos = useCallback(
        async (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string) => {
            if (!volumeId) {
                return;
            }
            setIsAlbumPhotosLoading(true);

            const albumPhotosCall = async (anchorID?: string) => {
                let albumVolumeId = volumeId;
                if (albumShareId !== undefined && shareId !== albumShareId) {
                    const share = await getShare(abortSignal, albumShareId);
                    albumVolumeId = share.volumeId;
                }
                const { Photos, Code, AnchorID, More } = await request<{
                    Photos: PhotoPayload[];
                    Code: number;
                    AnchorID: string;
                    More: boolean;
                }>(
                    queryAlbumPhotos(albumVolumeId, albumLinkId, {
                        AnchorID: anchorID,
                    }),
                    abortSignal
                );
                if (Code === 1000) {
                    const photosData = Photos.map(photoPayloadToPhotos);
                    if (!currentAlbumLinkId.current || currentAlbumLinkId.current !== albumLinkId) {
                        currentAlbumLinkId.current = albumLinkId;
                        // We swapped album, so we remove previous ones from state
                        setAlbumPhotos(
                            photosData.map((photo) => {
                                return {
                                    ...photo,
                                    parentLinkId: albumLinkId,
                                    rootShareId: albumShareId,
                                    volumeId: albumVolumeId,
                                };
                            })
                        );
                    } else {
                        setAlbumPhotos((prevPhotos) => {
                            const newPhotos = photosData
                                .filter(
                                    (newPhoto) => !prevPhotos.some((prevPhoto) => prevPhoto.linkId === newPhoto.linkId)
                                )
                                .map((photo) => {
                                    return {
                                        ...photo,
                                        parentLinkId: albumLinkId,
                                        rootShareId: albumShareId,
                                        volumeId: albumVolumeId,
                                    };
                                });
                            return [...prevPhotos, ...newPhotos];
                        });
                    }
                    // Limit of 1000 photos per albums for now
                    if (More) {
                        void albumPhotosCall(AnchorID);
                    } else {
                        setIsAlbumPhotosLoading(false);
                    }
                }
            };

            void albumPhotosCall();
        },
        [request, volumeId, shareId, getShare]
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
                                    newAlbums.set(album.linkId, album);
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
                                    setVolumeShareIds(album.VolumeID, [album.ShareID]);
                                    return {
                                        ...link,
                                        cover: cover,
                                        photoCount: album.PhotoCount,
                                        permissions: {
                                            isOwner: getIsOwner(permissions),
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
            relatedPhotos: [],
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
                    albumPhoto: AlbumPhoto | undefined;
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
                    albumPhoto: AlbumPhoto | undefined;
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
        async (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string, linkId: string) => {
            const photoLink = await getLink(abortSignal, albumShareId, linkId);
            const albumPhoto = getAlbumPhotoFromLink(photoLink);
            if (!albumPhoto) {
                return;
            }
            setAlbumPhotos((currentAlbumPhotos) => [...currentAlbumPhotos, albumPhoto]);
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
        [getLink]
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

            const allNewAlbumPhotos: AlbumPhoto[] = [];
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

            allNewAlbumPhotos.push(
                ...result.successes.map((linkId) => linksInfoForAlbum.get(linkId)?.albumPhoto).filter(isTruthy)
            );

            setAlbums((currentAlbums) => {
                const newAlbums = new Map(currentAlbums);
                const album = newAlbums.get(albumLinkId);
                if (!album) {
                    return newAlbums;
                }
                album.photoCount = album.photoCount + allNewAlbumPhotos.length;
                return newAlbums;
            });

            // In case of directUpload we can skip loadAlbumsPhotos as photos will already be decrypted.
            // We just need to add them to the list
            // For other cases, it's safer to loadAlbumPhotos (request to API) to prevent new photos loading issues
            if (fromUpload) {
                if (currentAlbumLinkId.current === albumLinkId) {
                    setAlbumPhotos((currentAlbumPhotos) => [...currentAlbumPhotos, ...allNewAlbumPhotos]);
                    // Reload albums to reload cover of current album - first photo is automatically set as cover.
                    if (albumPhotos.length === 0) {
                        void loadAlbums(abortSignal);
                    }
                }
            } else {
                void loadAlbumPhotos(abortSignal, albumShareId, albumLinkId);
                showNotifications(result, albumName, fromUpload, linkIds);
                // Reload albums to reload cover of current album - first photo is automatically set as cover.
                if (albumPhotos.length === 0) {
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
            albumPhotos.length,
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

                        return {
                            linkId,
                            update: {
                                ...link,
                                cover: cover,
                                photoCount: album.photoCount,
                                permissions: {
                                    isOwner: getIsOwner(permissions),
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
            // Optimistic: change the cover manually in memory
            void updateAlbumsFromCache([albumLinkId]);
        },
        [request, volumeId]
    );

    const removePhotosFromCache = useCallback((linkIds: string[]) => {
        setPhotos((prevPhotos) => {
            return prevPhotos.filter((photo) => !linkIds.includes(photo.linkId));
        });
    }, []);

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

            setAlbumPhotos((prevPhotos) => prevPhotos.filter((photo) => !result.successes.includes(photo.linkId)));
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

    const updatePhotoFavoriteFromCache = useCallback(
        (linkId: string, isFavorite: boolean) => {
            if (!shareId) {
                return;
            }

            const updateTagsForPhoto = <T extends Photo>(photo: T, photoList: T[]) => {
                if (!photo) {
                    return;
                }
                // eslint-disable-next-line
                const updatedTags = isFavorite
                    ? photo.tags.includes(PhotoTag.Favorites)
                        ? photo.tags
                        : [...photo.tags, PhotoTag.Favorites]
                    : photo.tags.filter((tag) => tag !== PhotoTag.Favorites);

                updatePhotoLinkTags(shareId, linkId, updatedTags);

                return photoList.map((original) =>
                    original.linkId === linkId ? { ...original, tags: updatedTags } : original
                );
            };

            const photo = photos.find((photo) => photo.linkId === linkId);
            if (photo) {
                const update = updateTagsForPhoto(photo, photos);
                if (update) {
                    setPhotos(update);
                }
            } else {
                // This is the cache when the photo is not in the cache already
                // As uploaded directly to the stream
                const signal = new AbortController().signal;
                void getLink(signal, shareId, linkId).then(async (link) => {
                    const relatedPhotos = await batchPromiseHelper(
                        link?.activeRevision?.photo?.relatedPhotosLinkIds || [],
                        async (relatedPhotoLinkId) => getLink(signal, shareId, relatedPhotoLinkId),
                        10,
                        signal
                    );
                    const photo = decryptedLinkToPhotos(link, relatedPhotos);
                    const update = updateTagsForPhoto(photo, photos);
                    if (update) {
                        setPhotos(update);
                    }
                });
            }

            const albumPhoto = albumPhotos.find((photo) => photo.linkId === linkId);
            if (albumPhoto) {
                const update = updateTagsForPhoto(albumPhoto, albumPhotos);
                if (update) {
                    setAlbumPhotos(update);
                }
            }
        },
        [shareId, photos, albumPhotos, updatePhotoLinkTags]
    );

    const clearAlbumPhotos = useCallback(() => {
        setAlbumPhotos([]);
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
                photos,
                albums,
                albumPhotos,
                addAlbumPhotos,
                addPhotoAsCover,
                loadAlbumPhotos,
                loadAlbums,
                loadSharedWithMeAlbums,
                loadPhotos,
                initializePhotosView,
                removeAlbumsFromCache,
                addNewAlbumPhotoToCache,
                updatePhotoFavoriteFromCache,
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
