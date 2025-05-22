import { type ReactNode, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import useFlag from '@proton/unleash/useFlag';

import { PhotosContainer } from '../../containers/PhotosContainer';
import { PhotosWithAlbumsContext, PhotosWithAlbumsProvider } from '../../photos/PhotosStore/PhotosWithAlbumsProvider';
import { PhotosWithAlbumsContainer } from '../../photos/PhotosWithAlbumsContainer';
import { useSharesStore } from '../../zustand/share/shares.store';
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
    const { haveLockedOrRestoredOldPhotosShare } = useSharesStore((state) => ({
        haveLockedOrRestoredOldPhotosShare: state.haveLockedOrRestoredOldPhotosShare(),
    }));
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (haveLockedOrRestoredOldPhotosShare && photosEnabled && photosWithAlbumsEnabled) {
            createNotification({
                type: 'info',
                expiration: 10000,
                text: c('Notification')
                    .t`Access our new Albums, Filters, and more by taking action on your locked volume. Restore or delete it now to enjoy these new features immediately.`,
            });
        }
    }, [haveLockedOrRestoredOldPhotosShare, createNotification, photosEnabled, photosWithAlbumsEnabled]);

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

    if (
        // It is not allowed to create new photo volume until old photo shares
        // are recovered so they can be migrated.
        !haveLockedOrRestoredOldPhotosShare &&
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

    // Do not use condition on global photos FF.
    // Various places in Drive depend on some photo provider, so worst
    // case we need to load the old one, if user don't have access yet
    // to the new one, either by FF or the presence of old locked photo
    // share.
    // If its just race-condition as albums FF is disabled and the state
    // is not loaded yet, worst case we start loading photos that can
    // even fail, but it will be replaced by the new provider once the
    // state is loaded.
    // The important part is that we don't let the Drive app to fail
    // completely in error page without any acccess.
    // Note that the race condition could happen only during the rollout
    // and the rollout was already done. We might roll it back during
    // heavy load but not expected.
    return <PhotosProvider>{children}</PhotosProvider>;
};
