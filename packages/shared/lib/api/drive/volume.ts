import { FOLDER_PAGE_SIZE } from '../../drive/constants';
import { CreateDriveVolume, RestoreDriveVolume } from '../../interfaces/drive/volume';

export const queryCreateDriveVolume = (data: CreateDriveVolume) => ({
    method: 'post',
    url: 'drive/volumes',
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
