import type { ExpandedTags } from 'exifreader';

import type { PhotoTag } from '@proton/shared/lib/interfaces/drive/file';

export type ExifInfo = ExpandedTags;

export interface MediaInfo {
    width?: number;
    height?: number;
    duration?: number;
}

export interface ExtendedAttributesMetadata {
    Media?: {
        Width?: number;
        Height?: number;
        Duration?: number;
    };
    Location?: {
        Latitude: number;
        Longitude: number;
    };
    Camera?: {
        CaptureTime?: string;
        Device?: string;
        Orientation?: number;
        SubjectCoordinates?: {
            Top: number;
            Left: number;
            Bottom: number;
            Right: number;
        };
    };
}

export interface ExtendedAttributesResult {
    metadata: ExtendedAttributesMetadata;
}

export interface PhotosExtendedAttributesResult {
    metadata: ExtendedAttributesMetadata;
    tags: PhotoTag[];
    captureTime: Date;
}
