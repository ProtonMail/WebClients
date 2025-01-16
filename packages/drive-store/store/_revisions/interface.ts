import type { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';

import type { Photo } from '../_photos';

export type Thumbnail = { id: String; size: Number; type: Number; hash: String };

export interface ThumbnailURLInfo {
    bareUrl: string;
    token: string;
}

export interface DriveFileRevision {
    id: string;
    createTime: number;
    size: number;
    state: number;
    manifestSignature: string;
    signatureEmail?: string;
    blocs: DriveFileBlock[];
    thumbnail?: ThumbnailURLInfo;
    thumbnails: Thumbnail[];
    photo?: Photo;
    xAttr?: string;
}
