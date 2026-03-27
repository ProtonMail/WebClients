import { PhotoTag, splitNodeUid } from '@proton/drive';

import type { PhotoItem } from '../usePhotos.store';

/**
 * Maps a PhotoItem (new SDK-based store) to a legacy-compatible object by deriving
 * linkId, volumeId, rootShareId from the nodeUid using splitNodeUid().
 *
 * Used to bridge the new SDK photo store with legacy components that expect
 * PhotoLink-shaped objects (linkId, volumeId, rootShareId, etc.).
 */
export function mapPhotoItemToLegacy(item: PhotoItem, shareId: string, parentLinkId: string) {
    const { volumeId, nodeId: linkId } = splitNodeUid(item.nodeUid);
    return {
        ...item,
        linkId,
        volumeId,
        rootShareId: shareId,
        parentLinkId,
        isFile: true,
        name: item.additionalInfo?.name,
        activeRevision: {
            photo: {
                linkId,
                captureTime: Math.floor(item.captureTime.getTime() / 1000),
            },
        },
        photoProperties: {
            albums: [] as { albumLinkId: string; hash: string; contentHash: string; addedTime: number }[],
            tags: item.tags,
            isFavorite: item.tags.includes(PhotoTag.Favorites),
        },
    };
}

export type MappedPhotoItem = ReturnType<typeof mapPhotoItemToLegacy>;
