import { queryPhotos } from '@proton/shared/lib/api/drive/photos';
import type { Photo } from '@proton/shared/lib/interfaces/drive/photos';

import { photoPayloadToPhotos, useDebouncedRequest } from '../_api';

export const usePhotos = () => {
    const request = useDebouncedRequest();

    const getPhotos = (abortSignal: AbortSignal, volumeId: string, lastLinkId?: string) => {
        return request<{ Photos: Photo[]; Code: number }>(
            queryPhotos(volumeId, {
                PreviousPageLastLinkID: lastLinkId,
            }),
            abortSignal
        ).then(({ Photos, Code }) => {
            if (Code === 1000) {
                return Photos.map(photoPayloadToPhotos);
            }

            // TODO: Error cases
            return [];
        });
    };

    return {
        getPhotos,
    };
};
