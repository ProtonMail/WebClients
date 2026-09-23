import type { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';

type Thumbnail = { id: String; size: Number; type: Number; hash: String };

interface ThumbnailURLInfo {
    bareUrl: string;
    token: string;
}

interface DriveFileRevisionPhoto {
    linkId: string;
    captureTime: number;
    mainPhotoLinkId?: string;
    exif?: string;
    hash?: string;
    contentHash?: string;
    relatedPhotosLinkIds?: string[];
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
    photo?: DriveFileRevisionPhoto;
    xAttr?: string;
}
