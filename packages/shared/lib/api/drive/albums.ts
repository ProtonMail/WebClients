import type { CreateAlbum } from '../../interfaces/drive/photos';

export const queryCreateAlbum = (volumeID: string, data: CreateAlbum) => ({
    method: 'post',
    url: `drive/photos/volumes/${volumeID}/albums`,
    data,
});
