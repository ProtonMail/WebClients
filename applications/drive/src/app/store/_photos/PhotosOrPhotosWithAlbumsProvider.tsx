import { type ReactNode, useContext, useEffect, useState } from 'react';

import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import { PhotosContainer } from '../../containers/PhotosContainer';
import { PhotosWithAlbumsContext, PhotosWithAlbumsProvider } from '../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { PhotosWithAlbumsContainer } from '../../photos/PhotosWithAlbumsContainer';
import { useUserSettings } from '../_settings';
import { useDefaultShare } from '../_shares';
import { PhotosContext, PhotosProvider } from './PhotosProvider';

interface CommonProviderPhotosMethods {
    removePhotosFromCache: (linkIds: string[]) => void;
    shareId?: string;
    linkId?: string;
    volumeId?: string;
    volumeType: VolumeType;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
}

export function usePhotosOrPhotosWithAlbums(): CommonProviderPhotosMethods {
    const statePhotosWithAlbums = useContext(PhotosWithAlbumsContext);
    const statePhotos = useContext(PhotosContext);
    if (statePhotosWithAlbums) {
        return statePhotosWithAlbums;
    }
    if (statePhotos) {
        return statePhotos;
    }
    throw new Error('Trying to use uninitialized PhotosProvider or PhotosWithAlbumProvider');
}

export const PhotosOrPhotosWithAlbumsContainer = () => {
    const statePhotosWithAlbums = useContext(PhotosWithAlbumsContext);
    const statePhotos = useContext(PhotosContext);

    if (statePhotosWithAlbums) {
        return <PhotosWithAlbumsContainer />;
    }

    if (statePhotos) {
        return <PhotosContainer />;
    }
    throw new Error('Trying to use uninitialized PhotosProvider or PhotosWithAlbumProvider');
};

export const PhotosOrPhotosWithAlbumsProvider = ({ children }: { children: ReactNode }) => {
    const { photosEnabled, photosWithAlbumsEnabled } = useUserSettings();
    const [showPhotosWithAlbums, setShowPhotosWithAlbums] = useState<undefined | boolean>();
    const { getDefaultPhotosShare } = useDefaultShare();

    useEffect(() => {
        if (photosEnabled && !photosWithAlbumsEnabled) {
            void getDefaultPhotosShare().then((photosShare) => {
                setShowPhotosWithAlbums(photosShare?.volumeType === VolumeType.Photos);
            });
        }
    }, [photosEnabled, photosWithAlbumsEnabled]);

    if (photosEnabled && photosWithAlbumsEnabled) {
        return <PhotosWithAlbumsProvider>{children}</PhotosWithAlbumsProvider>;
    }
    if (photosEnabled && !photosWithAlbumsEnabled && showPhotosWithAlbums === undefined) {
        return children;
    }
    return <PhotosProvider>{children}</PhotosProvider>;
};
