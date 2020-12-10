import { CreateDriveVolume } from '../interfaces/volume';

export const queryCreateDriveVolume = (data: CreateDriveVolume) => ({
    method: 'post',
    url: 'drive/volumes',
    data,
});
