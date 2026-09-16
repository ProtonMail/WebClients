import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

/**
 * @deprecated
 * Legacy type
 */

// These are not coming from the BE but can't be equal to the PhotoTag
export enum AlbumTag {
    All = 10,
    MyAlbums = 11,
    Shared = 12,
    SharedWithMe = 13,
}

export type Tag = PhotoTag | AlbumTag;
