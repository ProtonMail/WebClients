export interface ThumbnailData {
    thumbnailData: Uint8Array;
    thumbnailType: ThumbnailType;
    originalWidth?: number;
    originalHeight?: number;
}

export interface ThumbnailGenerator {
    (file: Blob, thumbnailType: ThumbnailType): Promise<ThumbnailData | undefined>;
}

export enum ThumbnailType {
    PREVIEW = 1,
    HD_PREVIEW = 2,
}
