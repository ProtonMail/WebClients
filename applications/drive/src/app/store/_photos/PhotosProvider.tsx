import { FC, createContext, useContext, useState } from 'react';

import { useLoading } from '@proton/hooks/index';
import { queryDeletePhotosShare, queryPhotos } from '@proton/shared/lib/api/drive/photos';
import type { Photo as PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';

import { photoPayloadToPhotos, useDebouncedRequest } from '../_api';
import { Share, ShareWithKey } from '../_shares';
import useSharesState from '../_shares/useSharesState';
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
    restoredShares: Share[] | ShareWithKey[] | undefined;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
} | null>(null);

export const PhotosProvider: FC = ({ children }) => {
    const { getActivePhotosShare, getDefaultShareId, getRestoredPhotoShares } = useSharesState();
    const defaultShareId = getDefaultShareId();
    const share = getActivePhotosShare();
    const restoredShares = getRestoredPhotoShares();

    const request = useDebouncedRequest();
    const [photosLoading, withPhotosLoading] = useLoading();

    const [photos, setPhotos] = useState<Photo[]>([]);

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

    if (!defaultShareId) {
        return <PhotosContext.Provider value={null}>{children}</PhotosContext.Provider>;
    }

    return (
        <PhotosContext.Provider
            value={{
                shareId: share?.shareId,
                linkId: share?.rootLinkId,
                volumeId: share?.volumeId,
                hasPhotosShare: !!share,
                isLoading: (!defaultShareId && !share) || photosLoading,
                photos,
                loadPhotos,
                removePhotosFromCache,
                restoredShares,
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
