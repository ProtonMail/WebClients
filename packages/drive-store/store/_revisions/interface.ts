import type { DriveFileBlock, Thumbnail } from '@proton/shared/lib/interfaces/drive/file';

export interface DriveFileRevision {
    id: string;
    createTime: number;
    size: number;
    state: number;
    manifestSignature: string;
    signatureEmail?: string;
    blocs: DriveFileBlock[];
    thumbnails: Thumbnail[];
    xAttr?: string;
}
