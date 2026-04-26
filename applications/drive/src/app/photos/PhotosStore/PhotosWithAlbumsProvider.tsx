import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/components';
import { type MaybeNode, generateNodeUid, getDriveForPhotos, splitNodeUid } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import {
    queryAddAlbumPhotos,
    queryDeleteAlbum,
    queryDeletePhotosShare,
    queryRemoveAlbumPhotos,
    queryRemoveTagsFromPhoto,
} from '@proton/shared/lib/api/drive/photos';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';
import type { PhotoDataForAddToAlbumPayload } from '@proton/shared/lib/interfaces/drive/photos';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import { useDebouncedRequest } from '../../store/_api';
import { type DecryptedLink, useLink, useLinkActions, useLinksActions } from '../../store/_links';
import { useBatchHelper } from '../../store/_utils/useBatchHelper';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { useAlbumProgressStore } from '../../zustand/photos/addToAlbumProgress.store';
import { loadAlbums } from '../loaders/loadAlbums';
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
    initializePhotosView: (nodeUidOrMaybeNode: string | MaybeNode) => Promise<void>;
    addAlbumPhotos: (
        abortSignal: AbortSignal,
        albumShareId: string,
        albumLinkId: string,
        LinkIDs: string[],
        fromUpload?: boolean
    ) => Promise<string[]>;
    addPhotoAsCover: (abortSignal: AbortSignal, albumLinkId: string, coverLinkId: string) => void;
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
    const [photosShare, setPhotosShare] = useState<{ shareId: string; volumeId: string; rootLinkId: string }>();
    const volumeId = photosShare?.volumeId;
    const shareId = photosShare?.shareId;

    const { getPhotoCloneForAlbum, copyLinksToVolume } = useLinkActions();
    const { favoritePhotoLink } = useLinksActions();
    const request = useDebouncedRequest();
    const { batchAPIHelper } = useBatchHelper();
    const [userAddressEmail, setUserAddressEmail] = useState<string>();
    const currentAlbumLinkId = useRef<string>();
    const { getLink } = useLink();
    const albumProgress = useAlbumProgressStore();
    const { createNotification } = useNotifications();

    const initializePhotosView = useCallback(
        async (nodeUidOrMaybeNode: string | MaybeNode) => {
            if (photosShare) {
                return;
            }
            const drive = getDriveForPhotos();
            const { node: photosRootNode } = getNodeEntity(
                typeof nodeUidOrMaybeNode === 'string' ? await drive.getNode(nodeUidOrMaybeNode) : nodeUidOrMaybeNode
            );

            if (!photosRootNode.deprecatedShareId) {
                return;
            }
            setPhotosShare({
                shareId: photosRootNode.deprecatedShareId,
                volumeId: splitNodeUid(photosRootNode.uid).volumeId,
                rootLinkId: splitNodeUid(photosRootNode.uid).nodeId,
            });
            setUserAddressEmail(photosRootNode.ownedBy.email);
        },
        [photosShare]
    );

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
            const album = [...useAlbumsStore.getState().albums.values()].find(
                (a) => splitNodeUid(a.nodeUid).nodeId === albumLinkId
            );
            const albumVolumeId = (album ? splitNodeUid(album.nodeUid).volumeId : undefined) || volumeId;
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
        },
        [volumeId]
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

            const albumEntry = [...useAlbumsStore.getState().albums.values()].find(
                (a) => splitNodeUid(a.nodeUid).nodeId === albumLinkId
            );
            if (albumEntry) {
                useAlbumsStore.getState().upsertAlbum({
                    ...albumEntry,
                    photoCount: (albumEntry.photoCount ?? 0) + nbSuccesses,
                });
            }

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
                    if (albumStore.getCurrentAlbum()?.photoNodeUids?.size === 0) {
                        void loadAlbums(abortSignal);
                    }
                }
            } else {
                showNotifications(result, albumName, fromUpload, linkIds);
                // Reload albums to reload cover of current album - first photo is automatically set as cover.
                if (useAlbumsStore.getState().getCurrentAlbum()?.photoNodeUids?.size === 0) {
                    void loadAlbums(abortSignal);
                }
            }
            return result.successes;
        },
        [
            addPhotosToAlbumInBatches,
            copyLinksToVolume,
            getLink,
            getPayloadDataAndPreloadPhotoLinks,
            shareId,
            showNotifications,
            volumeId,
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
        [favoritePhotoLink, photosShare]
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

    const updateAlbumsFromCache = useCallback(async (_linkIds: string[]) => {
        // TODO: DRVWEB-4974 - refresh specific albums once SDK supports partial updates
        await loadAlbums();
    }, []);

    // TODO: Remove that after migrating all to SDK
    const addPhotoAsCover = useCallback(
        async (_: AbortSignal, albumLinkId: string, coverLinkId: string) => {
            if (!volumeId) {
                throw new Error('Photo volume not found');
            }
            if (!shareId) {
                throw new Error('Photo share not found');
            }
            const { node } = getNodeEntity(
                await getDriveForPhotos().updateAlbum(generateNodeUid(volumeId, albumLinkId), {
                    coverPhotoNodeUid: generateNodeUid(volumeId, coverLinkId),
                })
            );
            await getBusDriver().emit(
                {
                    type: BusDriverEventName.UPDATED_NODES,
                    items: [
                        {
                            uid: node.uid,
                            parentUid: node.parentUid,
                            isShared: node.isShared,
                            isTrashed: Boolean(node.trashTime),
                        },
                    ],
                },
                getDriveForPhotos()
            );
        },
        [shareId, volumeId]
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
            const remaining = [...useAlbumsStore.getState().albums.values()].filter(
                (a) => splitNodeUid(a.nodeUid).nodeId !== albumLinkId
            );
            useAlbumsStore.getState().setAlbums(remaining);
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

            const removedNodeUids = result.successes.map((linkId) => generateNodeUid(albumLink.volumeId, linkId));
            useAlbumsStore.getState().removePhotoNodeUids(removedNodeUids);

            // If the cover photo was removed, we force the loadAlbums to get fresh metadata (coverNodeUid/photoCount)
            const currentAlbum = useAlbumsStore.getState().getCurrentAlbum();
            if (currentAlbum?.coverNodeUid && removedNodeUids.includes(currentAlbum.coverNodeUid)) {
                await loadAlbums();
            }
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
                addAlbumPhotos,
                addPhotoAsCover,
                initializePhotosView,
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
