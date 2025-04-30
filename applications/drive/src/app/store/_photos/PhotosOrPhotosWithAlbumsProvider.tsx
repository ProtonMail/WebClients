import { type ReactNode, useContext, useEffect, useState } from 'react';

import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import useFlag from '@proton/unleash/useFlag';

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

enum CustomerPhotoState {
    HASOLDPHOTOSHARE,
    HASNEWPHOTOVOLUME,
    HASNOTHING,
    UNKNOWN,
}

export const PhotosOrPhotosWithAlbumsProvider = ({ children }: { children: ReactNode }) => {
    const { photosEnabled, photosWithAlbumsEnabled } = useUserSettings();
    // Feature Flag only for customers that DO NOT need migration
    const photosWithAlbumsForNewVolume = useFlag('DriveAlbumsNewVolumes');
    const [customerPhotoState, setCustomerPhotoState] = useState<CustomerPhotoState>(CustomerPhotoState.UNKNOWN);
    const { getDefaultPhotosShare } = useDefaultShare();

    useEffect(() => {
        if (photosEnabled && !photosWithAlbumsEnabled) {
            void getDefaultPhotosShare().then((photosShare) => {
                if (photosShare?.volumeType === VolumeType.Photos) {
                    setCustomerPhotoState(CustomerPhotoState.HASNEWPHOTOVOLUME);
                } else if (photosShare?.volumeType === VolumeType.Regular) {
                    setCustomerPhotoState(CustomerPhotoState.HASOLDPHOTOSHARE);
                } else if (photosShare === undefined) {
                    // Customer has neither new or old photo share
                    setCustomerPhotoState(CustomerPhotoState.HASNOTHING);
                }
            });
        }
    }, [photosEnabled, photosWithAlbumsEnabled]);

    // Photos global FF is enabled
    if (
        photosEnabled &&
        // AND
        // Either
        // (1) customer have the DriveAlbums FF enabled
        // OR
        // (2) customer already have a new photo volume
        // OR
        // (3) customer has nothing and have the DriveAlbumsNewVolumes enabled
        (photosWithAlbumsEnabled ||
            customerPhotoState === CustomerPhotoState.HASNEWPHOTOVOLUME ||
            (photosWithAlbumsForNewVolume && customerPhotoState === CustomerPhotoState.HASNOTHING))
    ) {
        return <PhotosWithAlbumsProvider>{children}</PhotosWithAlbumsProvider>;
    }

    // Photos global FF is enabled
    // Customer is not in DriveAlbums
    if (
        photosEnabled &&
        (customerPhotoState === CustomerPhotoState.HASOLDPHOTOSHARE ||
            !photosWithAlbumsEnabled ||
            !photosWithAlbumsForNewVolume)
    ) {
        return <PhotosProvider>{children}</PhotosProvider>;
    }

    // We don't know yet the state of the customer, render childs...
    return children;
};
