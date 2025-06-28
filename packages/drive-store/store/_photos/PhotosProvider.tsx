import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { queryDeletePhotosShare, queryPhotos } from '@proton/shared/lib/api/drive/photos';
import type { PhotoPayload } from '@proton/shared/lib/interfaces/drive/photos';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import { photoPayloadToPhotos, useDebouncedRequest } from '../_api';
import type { ShareWithKey } from '../_shares';
import { useDefaultShare } from '../_shares';
import { useVolumesState } from '../_volumes';
import type { Photo } from './interface';

export const PhotosContext = createContext<{
    shareId?: string;
    linkId?: string;
    volumeId?: string;
    isPhotosLoading: boolean;
    photos: Photo[];
    volumeType: VolumeType.Regular;
    loadPhotos: (abortSignal: AbortSignal, volumeId: string) => void;
    removePhotosFromCache: (linkIds: string[]) => void;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
} | null>(null);

export const PhotosProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [photosShare, setPhotosShare] = useState<ShareWithKey>();
    const [share, setShare] = useState<ShareWithKey>();
    const { getDefaultShare, getDefaultPhotosShare } = useDefaultShare();
    const { setVolumeShareIds } = useVolumesState();
    const request = useDebouncedRequest();
    const [photosLoading, setIsPhotosLoading] = useState<boolean>(true);
    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        void Promise.all([getDefaultShare(), getDefaultPhotosShare()]).then(([defaultShare, defaultPhotosShare]) => {
            setShare(defaultShare);
            setPhotosShare(defaultPhotosShare);
            if (defaultPhotosShare) {
                setVolumeShareIds(defaultPhotosShare.volumeId, [defaultPhotosShare.shareId]);
            }
            // loadPhotos() depends on the photo share shareId/volumeId
            // if its undefined = loading is stopped (we have a problem)
            // if its truthy = loading continues and loadPhotos will take over the photosLoading()
            setIsPhotosLoading(!!defaultPhotosShare);
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
                void Promise.resolve();
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
                volumeType: VolumeType.Regular,
                isPhotosLoading: photosLoading,
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
