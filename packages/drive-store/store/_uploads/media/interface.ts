export interface ThumbnailInfo {
    thumbnailData: Uint8Array<ArrayBuffer>;
    thumbnailType: ThumbnailType;
}

export enum ThumbnailType {
    PREVIEW = 1,
    HD_PREVIEW = 2,
}

export interface Media {
    width?: number;
    height?: number;
    duration?: number;
}
