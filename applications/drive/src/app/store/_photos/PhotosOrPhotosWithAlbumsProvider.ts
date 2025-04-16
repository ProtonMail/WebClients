import { useContext } from 'react';

import type { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';

import { PhotosWithAlbumsContext } from '../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { PhotosContext } from './PhotosProvider';

interface CommonProviderPhotosMethods {
    removePhotosFromCache: (linkIds: string[]) => void;
    shareId?: string;
    linkId?: string;
    deletePhotosShare: (volumeId: string, shareId: string) => Promise<void>;
    volumeId?: string;
    volumeType: VolumeType;
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
