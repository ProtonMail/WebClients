import type { FC, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
    queryAddAlbumPhotos,
    queryAlbumPhotos,
    queryAlbums,
    queryDeletePhotosShare,
    queryPhotos,
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
    loadPhotos: (abortSignal: AbortSignal, volumeId: string) => void;
    addAlbumPhotos: (
        abortSignal: AbortSignal,
        volumeId: string,
        shareId: string,
        albumLinkId: string,
        LinkIDs: string[]
    ) => Promise<void>;
    loadAlbumPhotos: (abortSignal: AbortSignal, volumeId: string, albumLinkId: string) => void;
    loadAlbums: (abortSignal: AbortSignal, volumeId: string, shareId: string) => void;
    removePhotosFromCache: (linkIds: string[]) => void;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
} | null>(null);

export const PhotosWithAlbumsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [photosShare, setPhotosShare] = useState<ShareWithKey>();
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

    const photosSharevolumeId = photosShare?.volumeId;

    useEffect(() => {
        if (photosSharevolumeId === undefined) {
            return;
        }

        driveEventManager.volumes.startSubscription(photosSharevolumeId, VolumeType.photo).catch(console.warn);
        return () => {
            driveEventManager.volumes.unsubscribe(photosSharevolumeId);
        };
    }, [photosSharevolumeId]);

    const loadPhotos = async (abortSignal: AbortSignal, volumeId: string) => {
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
        async (abortSignal: AbortSignal, volumeId: string, albumLinkId: string) => {
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
                        setAlbumPhotos((prevPhotos) => [...prevPhotos, ...photosData]);
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

    const loadAlbums = async (abortSignal: AbortSignal, volumeId: string, shareId: string) => {
        const albumCall = async (anchorID?: string) => {
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

    // Add an already uploaded photo to an album
    const addAlbumPhotos = useCallback(
        async (
            abortSignal: AbortSignal,
            volumeId: string,
            shareId: string,
            albumLinkId: string,
            LinkIDs: string[]
        ): Promise<void> => {
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
                const { Responses } = await request<{
                    Responses: any[];
                }>(
                    queryAddAlbumPhotos(volumeId, albumLinkId, {
                        AlbumData: links,
                    }),
                    abortSignal
                );
                for (const response of Responses) {
                    if (response.Code !== 1000) {
                        // TODO: log errors / show toast "could not be added to album"
                    }
                }
                void loadAlbumPhotos(abortSignal, volumeId, albumLinkId);
            };
            void addAlbumPhotosCall();
        },
        [request]
    );

    const removePhotosFromCache = (linkIds: string[]) => {
        setPhotos((prevPhotos) => {
            return prevPhotos.filter((photo) => !linkIds.includes(photo.linkId));
        });
    };

    const deletePhotosShare = async (volumeId: string, shareId: string): Promise<void> => {
        await request(queryDeletePhotosShare(volumeId, shareId));
    };

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
