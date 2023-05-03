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
