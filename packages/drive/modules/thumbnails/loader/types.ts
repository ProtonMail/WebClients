import type { ProtonDriveClient } from '@protontech/drive-sdk';

export type ThumbnailStatus = 'loading' | 'loaded';

/**
 * Holds the loaded state for a single thumbnail entry, keyed by revisionUid.
 * SD (Type1) and HD (Type2) are tracked independently so both can coexist.
 */
export type ThumbnailData = {
    sdStatus?: ThumbnailStatus;
    sdUrl?: string;
    hdStatus?: ThumbnailStatus;
    hdUrl?: string;
};

/**
 * Describes a node whose thumbnail(s) should be loaded.
 *
 * - `uid` is the node UID used to fetch the thumbnail from the SDK.
 * - `revisionUid` is the unique ID used as the store key (thumbnailData map).
 *   It should be unique like revision ID, so cache can be invalidate if thumbnail is updated.
 * - `thumbnailTypes` controls which resolutions to load. Defaults to ['sd'].
 * - `shouldLoad` is an optional guard evaluated lazily at batch time — if it
 *   returns false the item is skipped and no status is set.
 */
export interface ThumbnailRequest {
    nodeUid: string;
    revisionUid: string;
    thumbnailTypes?: ('hd' | 'sd')[];
    shouldLoad?: () => boolean;
}

export type DriveClient = Pick<ProtonDriveClient, 'iterateThumbnails'>;
