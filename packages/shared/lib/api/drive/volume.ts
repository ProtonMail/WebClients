import { FOLDER_PAGE_SIZE } from '../../drive/constants';
import type {
    CreateDrivePhotosWithAlbumsVolume,
    CreateDriveVolume,
    RestoreDriveVolume,
} from '../../interfaces/drive/volume';

export const queryUserVolumes = () => ({
    method: 'GET',
    url: 'drive/volumes',
});

export const queryGetDriveVolume = (volumeId: string) => ({
    method: 'GET',
    url: `drive/volumes/${volumeId}`,
});

export const queryCreateDriveVolume = (data: CreateDriveVolume) => ({
    method: 'post',
    url: 'drive/volumes',
    data,
});

export const queryCreatePhotosWithAlbumsVolume = (data: CreateDrivePhotosWithAlbumsVolume) => ({
    method: 'post',
    url: `drive/photos/volumes`,
    data,
});

export const queryRestoreDriveVolume = (encryptedVolumeId: string, data: RestoreDriveVolume) => ({
    method: 'put',
    url: `drive/volumes/${encryptedVolumeId}/restore`,
    data,
});

export const queryDeleteLockedVolumes = (volumeId: string) => {
    return {
        method: 'put',
        url: `drive/volumes/${volumeId}/delete_locked`,
    };
};

export const queryVolumeTrash = (
    volumeId: string,
    { Page = 0, PageSize = FOLDER_PAGE_SIZE }: { Page?: number; PageSize?: number }
) => {
    return {
        method: 'get',
        url: `drive/volumes/${volumeId}/trash`,
        params: {
            Page,
            PageSize,
        },
    };
};

export const queryVolumeEmptyTrash = (volumeId: string) => ({
    method: 'delete',
    url: `drive/volumes/${volumeId}/trash`,
});

export const queryVolumeSharedLinks = (
    volumeId: string,
    params: { Page: number; PageSize?: number; Recursive?: 1 | 0 }
) => {
    return {
        method: 'get',
        url: `drive/volumes/${volumeId}/urls`,
        params,
    };
};

export const queryLatestVolumeEvent = (volumeId: string) => ({
    url: `drive/volumes/${volumeId}/events/latest`,
    method: 'get',
});

export const queryVolumeEvents = (volumeId: string, eventId: string) => ({
    url: `drive/volumes/${volumeId}/events/${eventId}`,
    method: 'get',
});
