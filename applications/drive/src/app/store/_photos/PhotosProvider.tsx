import { FC, createContext, useContext, useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks/index';
import { queryDeletePhotosShare, queryPhotos } from '@proton/shared/lib/api/drive/photos';
import type { Photo as PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';

import { photoPayloadToPhotos, useDebouncedRequest } from '../_api';
import { ShareWithKey, useDefaultShare } from '../_shares';
import type { Photo } from './interface';

export const PhotosContext = createContext<{
    shareId?: string;
    linkId?: string;
    volumeId?: string;
    hasPhotosShare: boolean;
    isLoading: boolean;
    photos: Photo[];
    loadPhotos: (abortSignal: AbortSignal, volumeId: string) => void;
    removePhotosFromCache: (linkIds: string[]) => void;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
} | null>(null);

export const PhotosProvider: FC = ({ children }) => {
    const [photosShare, setPhotosShare] = useState<ShareWithKey>();
    const [share, setShare] = useState<ShareWithKey>();
    const { getDefaultShare, getDefaultPhotosShare } = useDefaultShare();

    const request = useDebouncedRequest();
    const [photosLoading, withPhotosLoading] = useLoading();

    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        void Promise.all([getDefaultShare().then(setShare), getDefaultPhotosShare().then(setPhotosShare)]);
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
                void Promise.resolve();
                const photosData = Photos.map(photoPayloadToPhotos);
                setPhotos((prevPhotos) => [...prevPhotos, ...photosData]);
                void photoCall(photosData[photosData.length - 1].linkId);
            }
        };

        void withPhotosLoading(photoCall());
    };

    const removePhotosFromCache = (linkIds: string[]) => {
        setPhotos((prevPhotos) => {
            return prevPhotos.filter((photo) => !linkIds.includes(photo.linkId));
        });
    };

    const deletePhotosShare = async (volumeId: string, shareId: string): Promise<void> => {
        await request(queryDeletePhotosShare(volumeId, shareId));
    };

    if (!share) {
        return <PhotosContext.Provider value={null}>{children}</PhotosContext.Provider>;
    }

    return (
        <PhotosContext.Provider
            value={{
                shareId: photosShare?.shareId,
                linkId: photosShare?.rootLinkId,
                volumeId: photosShare?.volumeId,
                hasPhotosShare: !!photosShare,
                isLoading: (!share && !photosShare) || photosLoading,
                photos,
                loadPhotos,
                removePhotosFromCache,
                deletePhotosShare,
            }}
        >
            {children}
        </PhotosContext.Provider>
    );
};

export function usePhotos() {
    const state = useContext(PhotosContext);
    if (!state) {
        throw new Error('Trying to use uninitialized PhotosProvider');
    }
    return state;
}
