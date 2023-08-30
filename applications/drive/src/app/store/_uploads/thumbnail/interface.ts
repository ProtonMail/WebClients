export interface ThumbnailData {
    thumbnailData: Uint8Array;
    originalWidth?: number;
    originalHeight?: number;
}

export interface ThumbnailGenerator {
    (file: Blob): Promise<ThumbnailData | undefined>;
}

export enum ThumbnailType {
    PREVIEW = 1,
    PHOTO = 2,
}
