import { useCallback } from 'react';

import { useShallow } from 'zustand/react/shallow';

import type { ProtonDriveClient } from '@proton/drive';
import { ThumbnailType, splitNodeRevisionUid } from '@proton/drive';

import { useBatchThumbnailLoader } from '../../hooks/drive/useBatchThumbnailLoader';
import { useThumbnailStore } from '../../zustand/thumbnails/thumbnails.store';
import type { Drive } from './interface';

interface UseThumbnailLoaderProps {
    drive: Drive;
}

export function useThumbnailLoader({ drive }: UseThumbnailLoaderProps) {
    const { loadThumbnail } = useBatchThumbnailLoader({ drive });
    const { getThumbnail } = useThumbnailStore(
        useShallow((state) => ({
            getThumbnail: state.getThumbnail,
        }))
    );

    // If the thumbnail is not available yet, the first call to this function
    // returns nothing. Once the thumbnail is loaded, the getThumbnail function
    // will be updated and thus also this one and the second call will return
    // the thumbnail already.
    // The idea is to call this whenver the function changes. When the node
    // thumbnail is already loaded, it is no-op.
    const getSmallThumbnailUrl = useCallback(
        async (nodeUid: string, nodeRevisionUid: string): Promise<string | undefined> => {
            // TODO: This is to make it compatible with the rest of the app. We need to use the node or revision UID instead.
            const thumbnailId = splitNodeRevisionUid(nodeRevisionUid).revisionId || nodeUid;
            loadThumbnail({
                uid: nodeUid,
                thumbnailId,
                hasThumbnail: true,
            });
            return getThumbnail(thumbnailId)?.sdUrl;
        },
        [loadThumbnail, getThumbnail]
    );

    return {
        getSmallThumbnailUrl,
    };
}

export const getLargeThumbnail = async (
    drive: Pick<ProtonDriveClient, 'iterateThumbnails'>,
    nodeUid: string
): Promise<{ url: string; data: Uint8Array<ArrayBuffer>[] } | undefined> => {
    // TODO: Add support of HD thumbnails to thumbnail provider.
    for await (const thumbnailResult of drive.iterateThumbnails([nodeUid], ThumbnailType.Type2)) {
        if (thumbnailResult.ok) {
            const data = [thumbnailResult.thumbnail as Uint8Array<ArrayBuffer>];
            const url = URL.createObjectURL(new Blob(data, { type: 'image/jpeg' }));

            return {
                url,
                data,
            };
        }
        throw new Error(thumbnailResult.error);
    }
};
