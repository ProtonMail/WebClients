import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
    queryAddAlbumPhotos,
    queryAlbumPhotos,
    queryAlbums,
    queryDeletePhotosShare,
    queryPhotos,
    queryUpdateAlbum,
} from '@proton/shared/lib/api/drive/photos';
import type { Photo as PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';

import { type Photo, type ShareWithKey, useDefaultShare, useDriveEventManager } from '../../store';
import { photoPayloadToPhotos, useDebouncedRequest } from '../../store/_api';
import { type DecryptedLink, useLink, useLinkActions } from '../../store/_links';
import { useShare } from '../../store/_shares';
import { VolumeType, useVolumesState } from '../../store/_volumes';
import { useCreatePhotosWithAlbums } from './useCreatePhotosWithAlbums';

export interface Album {
    Locked: boolean;
    CoverLinkID?: string;
    LastActivityTime: number;
    PhotoCount: number;
    LinkID: string;
    VolumeID: string;
    ShareID: string;
}

export interface DecryptedAlbum extends DecryptedLink {
    cover?: DecryptedLink;
    photoCount: number;
}

/**
 *
 * TODO: Migrate to Zustand
 */
export const PhotosWithAlbumsContext = createContext<{
    shareId?: string;
    linkId?: string;
    volumeId?: string;
    userAddressEmail?: string;
    isPhotosLoading: boolean;
    isAlbumsLoading: boolean;
    isAlbumPhotosLoading: boolean;
    photos: Photo[];
    albumPhotos: Photo[];
    albums: DecryptedAlbum[];
    loadPhotos: (abortSignal: AbortSignal) => void;
    addAlbumPhotos: (abortSignal: AbortSignal, albumLinkId: string, LinkIDs: string[]) => Promise<void>;
    addPhotoAsCover: (abortSignal: AbortSignal, albumLinkId: string, coverLinkId: string) => void;
    loadAlbumPhotos: (abortSignal: AbortSignal, albumLinkId: string) => void;
    loadAlbums: (abortSignal: AbortSignal) => void;
    removePhotosFromCache: (linkIds: string[]) => void;
    deletePhotosShare: () => Promise<void>;
} | null>(null);

export const PhotosWithAlbumsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [photosShare, setPhotosShare] = useState<ShareWithKey>();
    const shareId = photosShare?.shareId;
    const volumeId = photosShare?.volumeId;

    const { getDefaultPhotosShare } = useDefaultShare();
    const { getPhotoCloneForAlbum } = useLinkActions();
    const { createPhotosWithAlbumsShare } = useCreatePhotosWithAlbums();
    const request = useDebouncedRequest();
    const driveEventManager = useDriveEventManager();
    const [photosLoading, setIsPhotosLoading] = useState<boolean>(true);
    const [albumsLoading, setIsAlbumsLoading] = useState<boolean>(true);
    const [albumPhotosLoading, setIsAlbumPhotosLoading] = useState<boolean>(true);
    const [userAddressEmail, setUserAddressEmail] = useState<string>();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [albums, setAlbums] = useState<DecryptedAlbum[]>([]);
    const [currentAlbumLinkId, setCurrentAlbumLinkId] = useState<string>();
    const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);
    const { getShareWithKey, getShareCreatorKeys } = useShare();
    const { getLink } = useLink();
    const { setVolumeShareIds } = useVolumesState();

    useEffect(() => {
        const signal = new AbortController().signal;
        void Promise.all([getDefaultPhotosShare()]).then(async ([defaultPhotosShare]) => {
            //TODO: Migration case where the share exist but is from old volume type=1
            if (!defaultPhotosShare) {
                // If no share, create new photo share
                const createdPhotos = await createPhotosWithAlbumsShare();
                const share = await getShareWithKey(signal, createdPhotos.shareId);
                setPhotosShare(share);
                setVolumeShareIds(share.volumeId, [share.shareId]);
                const { address } = await getShareCreatorKeys(signal, share);
                setUserAddressEmail(address.Email);
            } else {
                // use old photo share
                setPhotosShare(defaultPhotosShare);
                const { address } = await getShareCreatorKeys(signal, defaultPhotosShare);
                setUserAddressEmail(address.Email);
            }
        });
    }, []);

    useEffect(() => {
        if (volumeId === undefined) {
            return;
        }

        driveEventManager.volumes.startSubscription(volumeId, VolumeType.photo).catch(console.warn);
        return () => {
            driveEventManager.volumes.unsubscribe(volumeId);
        };
    }, [volumeId]);

    const loadPhotos = async (abortSignal: AbortSignal) => {
        if (!volumeId || !shareId) {
            return;
        }
        const photoCall = async (lastLinkId?: string) => {
            const { Photos, Code } = await request<{ Photos: PhotoPayload[]; Code: number }>(
                queryPhotos(volumeId, {
                    PreviousPageLastLinkID: lastLinkId,
                }),
                abortSignal
            );
            if (Code === 1000 && !!Photos.length) {
                const photosData = Photos.map(photoPayloadToPhotos);
                setPhotos((prevPhotos) => [...prevPhotos, ...photosData]);
                void photoCall(photosData[photosData.length - 1].linkId);
            } else {
                setIsPhotosLoading(false);
            }
        };

        setIsPhotosLoading(true);
        void photoCall();
    };

    const loadAlbumPhotos = useCallback(
        async (abortSignal: AbortSignal, albumLinkId: string) => {
            if (!volumeId) {
                return;
            }
            const albumPhotosCall = async (anchorID?: string) => {
                const { Photos, Code, AnchorID, More } = await request<{
                    Photos: PhotoPayload[];
                    Code: number;
                    AnchorID: string;
                    More: boolean;
                }>(
                    queryAlbumPhotos(volumeId, albumLinkId, {
                        AnchorID: anchorID,
                    }),
                    abortSignal
                );
                if (Code === 1000) {
                    const photosData = Photos.map(photoPayloadToPhotos);
                    if (!currentAlbumLinkId || currentAlbumLinkId !== albumLinkId) {
                        setCurrentAlbumLinkId(albumLinkId);
                        // We swapped album, so we remove previous ones from state
                        setAlbumPhotos(photosData);
                    } else {
                        setAlbumPhotos((prevPhotos) => {
                            const newPhotos = photosData.filter(
                                (newPhoto) => !prevPhotos.some((prevPhoto) => prevPhoto.linkId === newPhoto.linkId)
                            );
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
        [request]
    );

    const loadAlbums = async (abortSignal: AbortSignal) => {
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
                const decryptedAlbums = await Promise.all(
                    Albums.map(async (album) => {
                        const link = await getLink(abortSignal, shareId, album.LinkID);
                        const cover = album.CoverLinkID
                            ? await getLink(abortSignal, shareId, album.CoverLinkID)
                            : undefined;
                        return {
                            ...link,
                            cover: cover,
                            photoCount: album.PhotoCount,
                        };
                    })
                );
                setAlbums(() => [...decryptedAlbums]);
                // there is a limit of 500 albums so should actually never happen technically
                if (More) {
                    void albumCall(AnchorID);
                }
            }
            setIsAlbumsLoading(false);
        };

        setIsAlbumsLoading(true);
        void albumCall();
    };

    const addAlbumPhotos = useCallback(
        async (abortSignal: AbortSignal, albumLinkId: string, LinkIDs: string[]): Promise<void> => {
            if (!shareId || !volumeId) {
                throw new Error('Photo volume or share not found');
            }
            const links = await Promise.all(
                LinkIDs.map(async (linkId) => {
                    const link = await getLink(abortSignal, shareId, linkId);
                    const { Hash, Name, NodePassphrase, NodePassphraseSignature } = await getPhotoCloneForAlbum(
                        abortSignal,
                        shareId,
                        albumLinkId,
                        link.name
                    );
                    return {
                        LinkID: link.linkId,
                        Hash: Hash,
                        Name: Name,
                        NodePassphrase: NodePassphrase,
                        NodePassphraseSignature: NodePassphraseSignature,
                        NameSignatureEmail: link.nameSignatureEmail,
                        SignatureEmail: link.signatureEmail,
                        ContentHash: link.activeRevision?.photo?.contentHash,
                    };
                })
            );

            const addAlbumPhotosCall = async () => {
                const { Code, Responses } = await request<{
                    Responses: {
                        LinkID: string;
                        Response: {
                            Code: number;
                            Error: string;
                            Details: {
                                NewLinkID: string;
                            };
                        };
                    }[];
                    Code: number;
                }>(
                    queryAddAlbumPhotos(volumeId, albumLinkId, {
                        AlbumData: links,
                    }),
                    abortSignal
                );
                if (Code !== 1001) {
                    throw new Error('Photo(s) could not be added to album');
                }
                for (const { Response } of Responses) {
                    if (Response.Code !== 1000) {
                        throw new Error(`Photo(s) could not be added to album: ${Response.Error || 'unknown'}`);
                    }
                }
                void loadAlbumPhotos(abortSignal, albumLinkId);
            };
            return addAlbumPhotosCall();
        },
        [request, loadAlbumPhotos, getLink, getPhotoCloneForAlbum, volumeId, shareId]
    );

    const addPhotoAsCover = useCallback(
        async (abortSignal: AbortSignal, albumLinkId: string, coverLinkId: string) => {
            if (!volumeId) {
                throw new Error('Photo volume not found');
            }
            const addPhotoAsCoverCall = async () => {
                const response = await request<{
                    Code: number;
                }>(
                    queryUpdateAlbum(volumeId, albumLinkId, {
                        CoverLinkID: coverLinkId,
                    }),
                    abortSignal
                );
                if (response.Code !== 1000) {
                    throw new Error('Failed to set album cover');
                }
            };
            return addPhotoAsCoverCall();
        },
        [request]
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

    return (
        <PhotosWithAlbumsContext.Provider
            value={{
                shareId: photosShare?.shareId,
                linkId: photosShare?.rootLinkId,
                volumeId: photosShare?.volumeId,
                userAddressEmail: userAddressEmail,
                isPhotosLoading: photosLoading,
                isAlbumPhotosLoading: albumPhotosLoading,
                isAlbumsLoading: albumsLoading,
                photos,
                albums,
                albumPhotos,
                addAlbumPhotos,
                addPhotoAsCover,
                loadAlbumPhotos,
                loadAlbums,
                loadPhotos,
                removePhotosFromCache,
                deletePhotosShare,
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
