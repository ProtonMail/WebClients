import { PHOTOS_PAGE_SIZE } from '../../drive/constants';

export const queryPhotos = (
    volumeId: string,
    params?: {
        Desc?: 0 | 1;
        PreviousPageLastLinkID?: string;
        MinimumCaptureTime?: number;
    }
) => ({
    method: 'get',
    url: `drive/volumes/${volumeId}/photos`,
    params: {
        PageSize: PHOTOS_PAGE_SIZE,
        ...params,
    },
});

export const queryAlbums = (
    volumeId: string,
    params?: {
        AnchorID?: string;
    }
) => ({
    method: 'get',
    url: `drive/photos/volumes/${volumeId}/albums`,
    params: {
        ...params,
    },
});

export const queryAddAlbumPhotos = (
    volumeId: string,
    albumLinkId: string,
    data: {
        AlbumData: any[]; // TODO: type correctly
    }
) => ({
    method: 'POST',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}/add-multiple`,
    data,
});

export const queryAlbumPhotos = (
    volumeId: string,
    albumLinkId: string,
    params?: {
        AnchorID?: string;
    }
) => ({
    method: 'get',
    url: `drive/photos/volumes/${volumeId}/albums/${albumLinkId}/children`,
    params: {
        ...params,
    },
});

export const queryDeletePhotosShare = (volumeId: string, shareId: string) => ({
    method: 'delete',
    url: `drive/volumes/${volumeId}/photos/share/${shareId}`,
});

export const queryPhotosDuplicates = (volumeId: string, { nameHashes }: { nameHashes: string[] }) => ({
    method: 'post',
    url: `drive/volumes/${volumeId}/photos/duplicates`,
    data: {
        NameHashes: nameHashes,
    },
});

// TODO: Type data properly
export const queryCreateAlbum = (volumeId: string, data: any) => ({
    method: 'post',
    url: `drive/photos/volumes/${volumeId}/albums`,
    data,
});
