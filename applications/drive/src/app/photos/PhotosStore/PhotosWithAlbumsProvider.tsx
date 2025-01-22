import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { queryAlbums, queryDeletePhotosShare, queryPhotos } from '@proton/shared/lib/api/drive/photos';
import type { Photo as PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';

import { type Photo, type ShareWithKey, useDefaultShare } from '../../store';
import { photoPayloadToPhotos, useDebouncedRequest } from '../../store/_api';
import { useShare } from '../../store/_shares';
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

/**
 *
 * TODO: Migrate to Zustand
 */
export const PhotosWithAlbumsContext = createContext<{
    shareId?: string;
    linkId?: string;
    volumeId?: string;
    isPhotosLoading: boolean;
    isAlbumsLoading: boolean;
    photos: Photo[];
    albums: Album[];
    loadPhotos: (abortSignal: AbortSignal, volumeId: string) => void;
    loadAlbums: (abortSignal: AbortSignal, volumeId: string) => void;
    removePhotosFromCache: (linkIds: string[]) => void;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
} | null>(null);

export const PhotosWithAlbumsProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [photosShare, setPhotosShare] = useState<ShareWithKey>();
    const { getDefaultPhotosShare } = useDefaultShare();
    const { createPhotosWithAlbumsShare } = useCreatePhotosWithAlbums();
    const request = useDebouncedRequest();
    const [photosLoading, setIsPhotosLoading] = useState<boolean>(true);
    const [albumsLoading, setIsAlbumsLoading] = useState<boolean>(true);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const { getShareWithKey } = useShare();

    useEffect(() => {
        const signal = new AbortController().signal;
        void Promise.all([getDefaultPhotosShare()]).then(async ([defaultPhotosShare]) => {
            //TODO: Migration case where the share exist but is from old volume type=1
            if (!defaultPhotosShare) {
                // If no share, create new photo share
                const createdPhotos = await createPhotosWithAlbumsShare();
                const share = await getShareWithKey(signal, createdPhotos.shareId);
                setPhotosShare(share);
            } else {
                // use old photo share
                setPhotosShare(defaultPhotosShare);
            }
        });
    }, []);

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

    const loadAlbums = async (abortSignal: AbortSignal, volumeId: string) => {
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
                setAlbums(() => [...Albums]);
                // there is a limit of 500 albums so should actually never happen technically
                if (More) {
                    void albumCall(AnchorID);
                }
            }
            setIsPhotosLoading(false);
        };

        setIsAlbumsLoading(true);
        void albumCall();
    };

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
                isPhotosLoading: photosLoading,
                isAlbumsLoading: albumsLoading,
                photos,
                albums,
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
