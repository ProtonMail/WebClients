import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
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
import type { PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import isTruthy from '@proton/utils/isTruthy';

import { type AlbumPhoto, type Photo, type ShareWithKey, useDefaultShare, useDriveEventManager } from '../../store';
import { photoPayloadToPhotos, useDebouncedRequest } from '../../store/_api';
import { type DecryptedLink, useLink, useLinkActions } from '../../store/_links';
import { useLinksActions } from '../../store/_links';
import useLinksState from '../../store/_links/useLinksState';
import { useShare, useShareActions } from '../../store/_shares';
import { useDirectSharingInfo } from '../../store/_shares/useDirectSharingInfo';
import { SHOULD_MIGRATE_PHOTOS_STATUS } from '../../store/_shares/useShareActions';
import { useBatchHelper } from '../../store/_utils/useBatchHelper';
import { VolumeTypeForEvents, useVolumesState } from '../../store/_volumes';
import { sendErrorReport } from '../../utils/errorHandling';
import { useCreatePhotosWithAlbums } from './useCreatePhotosWithAlbums';

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
    addAlbumPhotos: (
        abortSignal: AbortSignal,
        albumShareId: string,
        albumLinkId: string,
        LinkIDs: string[]
    ) => Promise<void>;
    addPhotoAsCover: (abortSignal: AbortSignal, albumLinkId: string, coverLinkId: string) => void;
    loadAlbumPhotos: (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string) => Promise<void>;
    loadAlbums: (abortSignal: AbortSignal) => Promise<void>;
    loadSharedWithMeAlbums: (abortSignal: AbortSignal) => Promise<void>;
    removePhotosFromCache: (linkIds: string[]) => void;
    updateAlbumsFromCache: (linkIds: string[]) => void;
    deletePhotosShare: () => Promise<void>;
    updatePhotoFavoriteFromCache: (linkId: string, isFavorite: boolean) => void;
    removeAlbumPhotos: (
        abortSignal: AbortSignal,
        albumShareId: string,
        albumLinkId: string,
        LinkIDs: string[]
    ) => Promise<void>;
    deleteAlbum: (abortSignal: AbortSignal, albumLinkId: string, force: boolean) => Promise<void>;
    favoritePhoto: (abortSignal: AbortSignal, linkId: string) => Promise<void>;
    removeTagsFromPhoto: (abortSignal: AbortSignal, linkId: string, tags: PhotoTag[]) => Promise<void>;
    migrationStatus: 'unknown' | 'migrating' | 'migrated' | 'no-share';
    startPhotosMigration: () => void;
} | null>(null);

export enum MIGRATION_STATUS {
    UNKNOWN = 'unknown',
    MIGRATING = 'migrating',
    MIGRATED = 'migrated',
}
export const PhotosWithAlbumsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [photosShare, setPhotosShare] = useState<ShareWithKey>();
    const shareId = photosShare?.shareId;
    const volumeId = photosShare?.volumeId;

    const { getDefaultPhotosShare } = useDefaultShare();
    const { getPhotoCloneForAlbum } = useLinkActions();
    const { favoritePhotoLink } = useLinksActions();
    const { createPhotosWithAlbumsShare } = useCreatePhotosWithAlbums();
    const request = useDebouncedRequest();
    const { batchAPIHelper } = useBatchHelper();
    const driveEventManager = useDriveEventManager();
    const [photosLoading, setIsPhotosLoading] = useState<boolean>(true);
    const [albumPhotosLoading, setIsAlbumPhotosLoading] = useState<boolean>(true);
    const [userAddressEmail, setUserAddressEmail] = useState<string>();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [albums, setAlbums] = useState<Map<string, DecryptedAlbum>>(new Map());
    const [migrationStatus, setMigrationStatus] = useState<MIGRATION_STATUS>(MIGRATION_STATUS.UNKNOWN);
    const [currentAlbumLinkId, setCurrentAlbumLinkId] = useState<string>();
    const [albumPhotos, setAlbumPhotos] = useState<AlbumPhoto[]>([]);
    const { getShareWithKey, getShare, getShareCreatorKeys } = useShare();
    const { getSharePermissions } = useDirectSharingInfo();
    const { getLink } = useLink();
    const { updatePhotoLinkTags } = useLinksState();
    const { setVolumeShareIds } = useVolumesState();
    const { shouldMigratePhotos, migratePhotos } = useShareActions();

    const { createNotification } = useNotifications();

    const startPhotosMigration = useCallback(async () => {
        const signal = new AbortController().signal;
        const status = await shouldMigratePhotos();
        let result;
        let newPhotosShare;
        if (status === SHOULD_MIGRATE_PHOTOS_STATUS.MIGRATED) {
            const defaultPhotosShare = await getDefaultPhotosShare();
            if (!defaultPhotosShare) {
                throw new Error('No default photos share found');
            }
            newPhotosShare = defaultPhotosShare;
        } else if (status === SHOULD_MIGRATE_PHOTOS_STATUS.NO_PHOTOS_SHARE) {
            result = await createPhotosWithAlbumsShare();
        } else if (status === SHOULD_MIGRATE_PHOTOS_STATUS.MIGRATION_IN_PROGRESS) {
            setMigrationStatus(MIGRATION_STATUS.MIGRATING);
            result = await migratePhotos(true);
        } else {
            setMigrationStatus(MIGRATION_STATUS.MIGRATING);
            result = await migratePhotos();
        }

        if (!newPhotosShare && result) {
            newPhotosShare = await getShareWithKey(signal, result.shareId);
        }

        if (!newPhotosShare) {
            throw new Error('No photos share found during migration');
        }

        const { address } = await getShareCreatorKeys(signal, newPhotosShare);
        setPhotosShare(newPhotosShare);
        setUserAddressEmail(address.Email);
        setMigrationStatus(MIGRATION_STATUS.MIGRATED);
        setVolumeShareIds(newPhotosShare.volumeId, [newPhotosShare.shareId]);
    }, [
        createPhotosWithAlbumsShare,
        getDefaultPhotosShare,
        getShareCreatorKeys,
        getShareWithKey,
        migratePhotos,
        setVolumeShareIds,
        shouldMigratePhotos,
    ]);

    useEffect(() => {
        if (volumeId === undefined) {
            return;
        }

        driveEventManager.volumes.startSubscription(volumeId, VolumeTypeForEvents.photo).catch(console.warn);
        return () => {
            driveEventManager.volumes.unsubscribe(volumeId);
        };
    }, [volumeId, driveEventManager.volumes]);

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

    const loadAlbumPhotos = useCallback(
        async (abortSignal: AbortSignal, albumShareId: string, albumLinkId: string) => {
            if (!volumeId) {
                return;
            }
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
                    if (!currentAlbumLinkId || currentAlbumLinkId !== albumLinkId) {
                        setCurrentAlbumLinkId(albumLinkId);
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
                    }
                }
                setIsAlbumPhotosLoading(false);
            };

            setIsAlbumPhotosLoading(true);
            void albumPhotosCall();
        },
        [request, currentAlbumLinkId, volumeId, shareId, getShare]
    );

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
                    const newDecryptedAlbums = await Promise.all(
                        Albums.map(async (album) => {
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
                        newDecryptedAlbums.forEach((album) => {
                            if (album !== undefined) {
                                newAlbums.set(album.linkId, album);
                                newAlbumsLinkIds.add(album.linkId);
                            }
                        });
                        return newAlbums;
                    });

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
                    const newDecryptedAlbums = await Promise.all(
                        Albums.map(async (album) => {
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
                    setAlbums((prevAlbums) => {
                        const newAlbums = new Map(prevAlbums);
                        newDecryptedAlbums.forEach((album) => {
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
        const abortController = new AbortController();
        const unsubscribe = driveEventManager.eventHandlers.subscribeToCore((event) => {
            if (event.DriveShareRefresh?.Action === 2) {
                loadSharedWithMeAlbums(abortController.signal, true).catch(sendErrorReport);
            }
        });

        return () => {
            unsubscribe();
            abortController.abort();
        };
    }, [loadSharedWithMeAlbums, driveEventManager.eventHandlers]);

    const addAlbumPhotos = useCallback(
        async (
            abortSignal: AbortSignal,
            albumShareId: string,
            albumLinkId: string,
            LinkIDs: string[]
        ): Promise<void> => {
            if (!shareId || !volumeId) {
                throw new Error('Photo volume or share not found');
            }

            const { name: albumName } = await getLink(abortSignal, albumShareId, albumLinkId);

            // Preload links in queue to prevent doing queue in batches
            const linksInfoForAlbum = new Map<
                string,
                {
                    LinkID: string;
                    Hash: string;
                    Name: string;
                    NodePassphrase: string;
                    NodePassphraseSignature: string;
                    NameSignatureEmail?: string;
                    SignatureEmail?: string;
                    ContentHash?: string;
                }
            >();

            const setPhotoLinksInfoForAlbum = async (link: DecryptedLink) => {
                const { Hash, Name, NodePassphrase, NodePassphraseSignature } = await getPhotoCloneForAlbum(
                    abortSignal,
                    albumShareId,
                    albumLinkId,
                    link.linkId
                );
                linksInfoForAlbum.set(link.linkId, {
                    LinkID: link.linkId,
                    Hash,
                    Name,
                    NodePassphrase,
                    NodePassphraseSignature,
                    NameSignatureEmail: link.nameSignatureEmail,
                    SignatureEmail: link.signatureEmail,
                    ContentHash: link.activeRevision?.photo?.contentHash,
                });
            };

            const queue = LinkIDs.map((linkId) => async () => {
                if (abortSignal.aborted) {
                    return;
                }

                const link = await getLink(abortSignal, albumShareId, linkId);
                await setPhotoLinksInfoForAlbum(link);
                if (!link.activeRevision?.photo?.relatedPhotosLinkIds?.length) {
                    return;
                }
                const relatedPhotosQueue = link.activeRevision.photo.relatedPhotosLinkIds.map(
                    (relatedPhotoLinkId) => async () => {
                        const relatedPhotoLink = await getLink(abortSignal, albumShareId, relatedPhotoLinkId);
                        await setPhotoLinksInfoForAlbum(relatedPhotoLink);
                    }
                );
                await runInQueue(relatedPhotosQueue, MAX_THREADS_PER_REQUEST);
            });
            await runInQueue(queue, MAX_THREADS_PER_REQUEST);

            const result = await batchAPIHelper(abortSignal, {
                linkIds: [...linksInfoForAlbum.keys()],
                batchRequestSize: MAX_ADD_ALBUM_PHOTOS_BATCH,
                allowedCodes: [API_CUSTOM_ERROR_CODES.ALREADY_EXISTS],
                query: async (batchLinkIds) => {
                    const links = await Promise.all(batchLinkIds.map(async (linkId) => linksInfoForAlbum.get(linkId)));

                    return queryAddAlbumPhotos(volumeId, albumLinkId, {
                        AlbumData: links.filter(isTruthy),
                    });
                },
            });

            // refreshing the album is only needed after adding photos for the first time to an album
            if (albumPhotos.length === 0) {
                void loadAlbums(abortSignal);
            }
            void loadAlbumPhotos(abortSignal, albumShareId, albumLinkId);

            const nbFailures = Object.keys(result.failures).length;
            const nbSuccesses = result.successes.length;
            if (nbFailures) {
                createNotification({
                    type: 'error',
                    text: c('Notification').t`⁠Some photo(s) could not be added to "${albumName}"`,
                });
            }
            if (nbSuccesses) {
                createNotification({
                    type: 'success',
                    text: c('Notification').t`Your photo(s) have been added to "${albumName}"`,
                });
            }
        },
        [
            loadAlbumPhotos,
            loadAlbums,
            getLink,
            getPhotoCloneForAlbum,
            volumeId,
            shareId,
            albumPhotos,
            batchAPIHelper,
            createNotification,
        ]
    );

    const favoritePhoto = useCallback(
        async (abortSignal: AbortSignal, linkId: string) => {
            if (!photosShare || !photosShare.shareId) {
                throw new Error('Photo share not found');
            }
            const album = albums.get(currentAlbumLinkId || '');

            await favoritePhotoLink(abortSignal, {
                shareId: album?.rootShareId || photosShare.shareId,
                linkId,
                newShareId: photosShare.shareId,
                newParentLinkId: photosShare.rootLinkId,
            });
        },
        [albums, currentAlbumLinkId, favoritePhotoLink, photosShare]
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
            const newCover = await getLink(abortSignal, shareId, coverLinkId);
            setAlbums((currentAlbums) => {
                const newAlbums = new Map(currentAlbums);
                const album = newAlbums.get(albumLinkId);
                if (album) {
                    newAlbums.set(albumLinkId, {
                        ...album,
                        cover: newCover,
                    });
                }
                return newAlbums;
            });
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

    const removePhotosFromCache = useCallback((linkIds: string[]) => {
        setPhotos((prevPhotos) => {
            return prevPhotos.filter((photo) => !linkIds.includes(photo.linkId));
        });
    }, []);

    const deletePhotosShare = useCallback(async (): Promise<void> => {
        if (!volumeId || !shareId) {
            return;
        }
        await request(queryDeletePhotosShare(volumeId, shareId));
    }, [request, volumeId, shareId]);

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
                allowedCodes: [API_CUSTOM_ERROR_CODES.ALREADY_EXISTS],
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
                    text: c('Notification').t`⁠Some photo(s) could not be removed from ${albumLink.name}`,
                });
            }
            if (nbSuccesses) {
                createNotification({
                    type: 'success',
                    text: c('Notification').t`⁠Your photo(s) have been removed from ${albumLink.name}`,
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
                updatePhotoFavoriteFromCache,
                removePhotosFromCache,
                updateAlbumsFromCache,
                deletePhotosShare,
                removeAlbumPhotos,
                deleteAlbum,
                favoritePhoto,
                removeTagsFromPhoto,
                userAddressEmail,
                migrationStatus,
                startPhotosMigration,
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
